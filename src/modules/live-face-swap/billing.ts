import { and, eq, isNull, like } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, credit } from '@/config/db/schema';
import { consume, getBalance, revoke } from '@/modules/credits/service';
import { rowsAffectedFromUpdate } from '@/lib/fal-query-error-cas';
import { getSnowId } from '@/lib/hash';

import {
  calculateLiveFaceSwapSettlement,
  LIVE_FACE_SWAP_CREDITS,
  LIVE_FACE_SWAP_MAX_CHUNKS,
  LIVE_FACE_SWAP_MODEL,
  LIVE_FACE_SWAP_PRICING_VERSION,
  LIVE_FACE_SWAP_PROVIDER_COST_USD,
  LIVE_FACE_SWAP_RENEW_AHEAD_MS,
  LIVE_FACE_SWAP_RENEW_LATE_MS,
  LIVE_FACE_SWAP_SCENE,
  LIVE_FACE_SWAP_SECONDS,
  liveFaceSwapPaidUntil,
} from './pricing';

export class LiveFaceSwapInsufficientCreditsError extends Error {
  constructor(
    public requiredCredits: number,
    public balance: number
  ) {
    super('Insufficient credits to continue the live session');
    this.name = 'LiveFaceSwapInsufficientCreditsError';
  }
}

export class LiveFaceSwapSessionConflictError extends Error {
  constructor(message = 'Live session cannot be started or renewed') {
    super(message);
    this.name = 'LiveFaceSwapSessionConflictError';
  }
}

function extractIssuedAt(taskInfo: string | null | undefined): number {
  try {
    const value = JSON.parse(taskInfo || '{}')?.issuedAtMs;
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

async function findSession(id: string, userId: string) {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, id),
        eq(aiTask.userId, userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE)
      )
    )
    .limit(1);
  return task ?? null;
}

function newChargeTask(params: {
  id: string;
  userId: string;
  sequence: number;
  sessionId: string;
}) {
  return {
    id: params.id,
    userId: params.userId,
    scene: LIVE_FACE_SWAP_SCENE,
    mediaType: 'video',
    provider: 'fal',
    model: LIVE_FACE_SWAP_MODEL,
    prompt: '',
    options: JSON.stringify({
      kind: params.sequence === 0 ? 'live-session' : 'live-topup',
      displayName: 'Live Face Swap',
      sessionId: params.sessionId,
      sequence: params.sequence,
      chunkSeconds: LIVE_FACE_SWAP_SECONDS,
      pricingVersion: LIVE_FACE_SWAP_PRICING_VERSION,
      providerCostUsd: LIVE_FACE_SWAP_PROVIDER_COST_USD,
      unusedSecondsRefundOnStop: true,
    }),
    status: 'charging',
    costCredits: 0,
    creditId: null,
    taskId: null,
    taskInfo: null,
    taskResult: null,
  };
}

/**
 * The primary task id is the session's idempotency key. Subsequent charges
 * have deterministic keys "<sessionId>:<sequence>". A separate UNIQUE row is
 * inserted BEFORE consume() so retries cannot debit the same chunk twice.
 *
 * This project uses a non-transactional D1 compatibility shim. If the worker
 * dies after consume but before marking charged, the row remains 'charging'.
 * That is an unresolved payment which must be reconciled; never blindly retry.
 */
async function chargeChunk(params: {
  id: string;
  sessionId: string;
  userId: string;
  userEmail?: string;
  sequence: number;
}) {
  try {
    await db().insert(aiTask).values(newChargeTask(params));
  } catch {
    throw new LiveFaceSwapSessionConflictError(
      'This live session charge is already pending. Please retry later.'
    );
  }

  let charged = false;
  try {
    charged = await db().transaction(async (tx: any) => {
      const result = await consume({
        userId: params.userId,
        userEmail: params.userEmail,
        credits: LIVE_FACE_SWAP_CREDITS,
        scene: LIVE_FACE_SWAP_SCENE,
        description:
          params.sequence === 0
            ? 'Reserve Live Face Swap: 30 seconds'
            : 'Extend Live Face Swap reservation: 30 seconds',
        metadata: JSON.stringify({
          sessionId: params.sessionId,
          sequence: params.sequence,
          pricingVersion: LIVE_FACE_SWAP_PRICING_VERSION,
          providerCostUsd: LIVE_FACE_SWAP_PROVIDER_COST_USD,
        }),
        tx,
      });
      if (!result.success || !result.consumedCredit) return false;
      const written = await tx
        .update(aiTask)
        .set({
          status: params.sequence === 0 ? 'reserved' : 'paid',
          creditId: result.consumedCredit.id,
          costCredits: LIVE_FACE_SWAP_CREDITS,
        })
        .where(
          and(
            eq(aiTask.id, params.id),
            eq(aiTask.userId, params.userId),
            eq(aiTask.status, 'charging'),
            isNull(aiTask.creditId)
          )
        );
      if (rowsAffectedFromUpdate(written) !== 1) {
        throw new Error('Live session charge state is uncertain');
      }
      return true;
    });
  } catch (error) {
    // Critical: do not erase a 'charging' row in this uncertain state. The
    // credit ledger may have committed despite the application error on D1.
    throw error;
  }

  if (!charged) {
    await db()
      .update(aiTask)
      .set({ status: 'insufficient' })
      .where(
        and(
          eq(aiTask.id, params.id),
          eq(aiTask.userId, params.userId),
          eq(aiTask.status, 'charging'),
          isNull(aiTask.creditId)
        )
      );
    throw new LiveFaceSwapInsufficientCreditsError(
      LIVE_FACE_SWAP_CREDITS,
      await getBalance(params.userId)
    );
  }
}

export async function getLiveFaceSwapSession(params: {
  sessionId: string;
  userId: string;
}) {
  return findSession(params.sessionId, params.userId);
}

/** Called only for a NEW initial token request, before its upstream token. */
export async function reserveLiveFaceSwapSession(params: {
  sessionId: string;
  userId: string;
  userEmail?: string;
}) {
  if (await findSession(params.sessionId, params.userId)) {
    throw new LiveFaceSwapSessionConflictError('Session ID was already used');
  }

  await chargeChunk({
    id: params.sessionId,
    sessionId: params.sessionId,
    userId: params.userId,
    userEmail: params.userEmail,
    sequence: 0,
  });
}

/** Token issuance succeeded; start the paid clock at this server timestamp. */
export async function activateLiveFaceSwapSession(params: {
  sessionId: string;
  userId: string;
}) {
  const issuedAtMs = Date.now();
  const written = await db()
    .update(aiTask)
    .set({ status: 'active', taskInfo: JSON.stringify({ issuedAtMs }) })
    .where(
      and(
        eq(aiTask.id, params.sessionId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        eq(aiTask.status, 'reserved')
      )
    );
  if (rowsAffectedFromUpdate(written) !== 1) {
    throw new LiveFaceSwapSessionConflictError('Live session was canceled');
  }
  return issuedAtMs;
}

/** Refund ONLY when no JWT has been delivered to the browser yet. */
export async function refundLiveFaceSwapBeforeToken(params: {
  sessionId: string;
  userId: string;
}) {
  const task = await findSession(params.sessionId, params.userId);
  if (!task || task.status !== 'reserved' || !task.creditId) return;
  const result = await db()
    .update(aiTask)
    .set({ status: 'refunding' })
    .where(
      and(
        eq(aiTask.id, params.sessionId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        eq(aiTask.status, 'reserved')
      )
    );
  if (rowsAffectedFromUpdate(result) !== 1) return;

  // If revoke fails, keep 'refunding' as an auditable pending refund.
  await revoke(task.creditId);
  await db()
    .update(aiTask)
    .set({ status: 'refunded', costCredits: 0 })
    .where(
      and(
        eq(aiTask.id, params.sessionId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.status, 'refunding')
      )
    );
}

export async function getLiveFaceSwapPaidState(params: {
  sessionId: string;
  userId: string;
}) {
  const task = await findSession(params.sessionId, params.userId);
  if (!task || task.status !== 'active') {
    throw new LiveFaceSwapSessionConflictError(
      'Live session is no longer active'
    );
  }
  const issuedAtMs = extractIssuedAt(task.taskInfo);
  if (!issuedAtMs) {
    throw new LiveFaceSwapSessionConflictError('Session clock is unavailable');
  }
  const chunks = await db()
    .select({ id: aiTask.id, status: aiTask.status })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        like(aiTask.id, params.sessionId + ':%')
      )
    );
  const paidSequences = new Set(
    chunks
      .filter(
        (chunk: { id: string; status: string }) => chunk.status === 'paid'
      )
      .map((chunk: { id: string }) =>
        Number(chunk.id.slice(params.sessionId.length + 1))
      )
  );
  let sequence = 0;
  while (
    paidSequences.has(sequence + 1) &&
    sequence + 1 < LIVE_FACE_SWAP_MAX_CHUNKS
  ) {
    sequence++;
  }
  return {
    issuedAtMs,
    sequence,
    paidUntilMs: liveFaceSwapPaidUntil(issuedAtMs, sequence),
    chargedCredits: (sequence + 1) * LIVE_FACE_SWAP_CREDITS,
    creditsPerChunk: LIVE_FACE_SWAP_CREDITS,
  };
}

/** Pre-pay ONE more 30-second chunk. Idempotent per sessionId/sequence. */
export async function renewLiveFaceSwapSession(params: {
  sessionId: string;
  userId: string;
  userEmail?: string;
  sequence: number;
}) {
  const paid = await getLiveFaceSwapPaidState(params);
  if (paid.sequence >= params.sequence) {
    if (params.sequence !== paid.sequence) {
      throw new LiveFaceSwapSessionConflictError('Outdated renewal sequence');
    }
    return paid; // Retry after successful charge: do not charge twice.
  }
  if (params.sequence !== paid.sequence + 1) {
    throw new LiveFaceSwapSessionConflictError(
      'Renewal sequence must be consecutive'
    );
  }

  const now = Date.now();
  const previousPaidUntil = paid.paidUntilMs;
  if (
    now < previousPaidUntil - LIVE_FACE_SWAP_RENEW_AHEAD_MS ||
    now > previousPaidUntil + LIVE_FACE_SWAP_RENEW_LATE_MS
  ) {
    throw new LiveFaceSwapSessionConflictError(
      'Renewal is outside the allowed payment window'
    );
  }

  // A stop may race an in-flight renewal. That paid final chunk is visible
  // in history; no partial refunds are inferred from client-supplied timing.
  await chargeChunk({
    id: params.sessionId + ':' + params.sequence,
    sessionId: params.sessionId,
    userId: params.userId,
    userEmail: params.userEmail,
    sequence: params.sequence,
  });
  return getLiveFaceSwapPaidState(params);
}

/**
 * A deterministic single refund grant per live session. Crash/retry can read
 * this credit ID without issuing a second refund. D1 is not transactional:
 * ambiguous states intentionally remain 'settling' for reconciliation.
 *
 * The original reserved chunks stay in credit history as CONSUME entries;
 * unused credits are returned with a new GRANT, preserving an audit trail.
 */
async function refundUnusedLiveCredits(params: {
  sessionId: string;
  userId: string;
  credits: number;
}) {
  if (params.credits <= 0) return null;
  const id = 'live-face-swap-refund:' + params.sessionId;
  const data = {
    id,
    userId: params.userId,
    userEmail: '',
    transactionNo: getSnowId(),
    transactionType: 'grant',
    transactionScene: LIVE_FACE_SWAP_SCENE,
    credits: params.credits,
    remainingCredits: params.credits,
    status: 'active',
    description: 'Unused Live Face Swap reserved time refund',
    orderNo: params.sessionId,
    expiresAt: null,
  };
  try {
    await db().insert(credit).values(data);
  } catch {
    const [existing] = await db()
      .select()
      .from(credit)
      .where(eq(credit.id, id))
      .limit(1);
    if (
      !existing ||
      existing.userId !== params.userId ||
      existing.transactionType !== 'grant' ||
      existing.credits !== params.credits
    ) {
      throw new LiveFaceSwapSessionConflictError(
        'Unused live credit refund needs manual reconciliation'
      );
    }
  }
  return id;
}

type LiveSettlement = ReturnType<typeof calculateLiveFaceSwapSettlement>;
type LiveSettlementResult = LiveSettlement & {
  status: 'settled' | 'pending' | 'not-started';
  refundCreditId?: string | null;
};

function readSettlement(
  value: string | null | undefined
): LiveSettlementResult | null {
  if (!value) return null;
  try {
    const data = JSON.parse(value);
    return data &&
      data.status === 'settled' &&
      Number.isSafeInteger(data.chargedCredits) &&
      Number.isSafeInteger(data.refundedCredits)
      ? data
      : null;
  } catch {
    return null;
  }
}

/**
 * Called AFTER the browser awaits local WebRTC close. Snapshot a server-side
 * stop timestamp with CAS, then reconcile the unused reservation to one
 * deterministic credit grant. No client-reported duration is trusted.
 *
 * IMPORTANT: This records token-to-stop wall time, not fal's billed duration.
 * There is still no provider-enforced stop. Unsettled/racy sessions retain
 * the entire reservation for manual investigation. Monitor upstream spend.
 */
export async function endLiveFaceSwapSession(params: {
  sessionId: string;
  userId: string;
}): Promise<LiveSettlementResult> {
  let task = await findSession(params.sessionId, params.userId);
  // Token authorization can fail before the first ai_task insert (e.g.
  // missing provider key). Client cleanup still calls /stop; this is not
  // a billing/reconciliation failure.
  if (!task || task.status === 'insufficient') {
    return {
      status: 'not-started',
      billedSeconds: 0,
      reservedCredits: 0,
      chargedCredits: 0,
      refundedCredits: 0,
      uncoveredCredits: 0,
      billingBasis: 'server-token-wallclock',
    };
  }
  // JWT was never issued and the initial reservation was already refunded.
  // Treat duplicate stop reports as successful idempotent cleanup.
  if (task.status === 'refunded') {
    return {
      status: 'settled',
      billedSeconds: 0,
      reservedCredits: LIVE_FACE_SWAP_CREDITS,
      chargedCredits: 0,
      refundedCredits: LIVE_FACE_SWAP_CREDITS,
      uncoveredCredits: 0,
      billingBasis: 'server-token-wallclock',
    };
  }

  const existingSettlement = readSettlement(task.taskResult);
  if (task.status === 'ended' && existingSettlement) return existingSettlement;

  // Stop was clicked while token minting was still in flight. No delivered
  // JWT means we must refund the full initial reservation.
  if (task.status === 'reserved') {
    await refundLiveFaceSwapBeforeToken(params);
    task = await findSession(params.sessionId, params.userId);
    if (task?.status === 'refunded') {
      return {
        status: 'settled',
        billedSeconds: 0,
        reservedCredits: LIVE_FACE_SWAP_CREDITS,
        chargedCredits: 0,
        refundedCredits: LIVE_FACE_SWAP_CREDITS,
        uncoveredCredits: 0,
        billingBasis: 'server-token-wallclock',
      };
    }
  }

  if (task.status === 'active') {
    const issuedAtMs = extractIssuedAt(task.taskInfo);
    if (!issuedAtMs) {
      throw new LiveFaceSwapSessionConflictError(
        'Session clock is unavailable'
      );
    }
    const endedAtMs = Math.max(Date.now(), issuedAtMs);
    const claimed = await db()
      .update(aiTask)
      .set({
        status: 'settling',
        taskInfo: JSON.stringify({ issuedAtMs, endedAtMs }),
      })
      .where(
        and(
          eq(aiTask.id, params.sessionId),
          eq(aiTask.userId, params.userId),
          eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
          eq(aiTask.status, 'active')
        )
      );
    if (rowsAffectedFromUpdate(claimed) !== 1) {
      task = await findSession(params.sessionId, params.userId);
    } else {
      task = {
        ...task,
        status: 'settling',
        taskInfo: JSON.stringify({ issuedAtMs, endedAtMs }),
      };
    }
  }

  if (task?.status === 'ended') {
    const settled = readSettlement(task.taskResult);
    if (settled) return settled;
  }
  if (task?.status !== 'settling') {
    throw new LiveFaceSwapSessionConflictError(
      'Session is not ready for settlement'
    );
  }

  let times: { issuedAtMs: number; endedAtMs: number };
  try {
    times = JSON.parse(task.taskInfo || '{}');
  } catch {
    throw new LiveFaceSwapSessionConflictError('Invalid session timestamps');
  }
  const children = await db()
    .select({
      id: aiTask.id,
      status: aiTask.status,
    })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        like(aiTask.id, params.sessionId + ':%')
      )
    );
  const paid = new Set<number>();
  for (const chunk of children) {
    if (chunk.status === 'charging' || chunk.status === 'reserved') {
      throw new LiveFaceSwapSessionConflictError(
        'A concurrent live charge needs manual reconciliation'
      );
    }
    if (chunk.status === 'paid') {
      paid.add(Number(chunk.id.slice(params.sessionId.length + 1)));
    }
  }
  let sequence = 0;
  while (paid.has(sequence + 1) && sequence + 1 < LIVE_FACE_SWAP_MAX_CHUNKS) {
    sequence++;
  }
  const reservedChunks = sequence + 1;
  const settlement = calculateLiveFaceSwapSettlement({
    issuedAtMs: times.issuedAtMs,
    endedAtMs: times.endedAtMs,
    reservedChunks,
  });

  // Cannot safely settle after the paid-through window, or if there are
  // gaps from a concurrent/uncertain renewal. Keep reservation on hold.
  if (settlement.uncoveredCredits > 0 || paid.size !== sequence) {
    return { ...settlement, status: 'pending' };
  }

  const refundCreditId = await refundUnusedLiveCredits({
    sessionId: params.sessionId,
    userId: params.userId,
    credits: settlement.refundedCredits,
  });
  const result: LiveSettlementResult = {
    ...settlement,
    status: 'settled',
    refundCreditId,
  };
  await db()
    .update(aiTask)
    .set({
      status: 'ended',
      taskResult: JSON.stringify(result),
    })
    .where(
      and(
        eq(aiTask.id, params.sessionId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        eq(aiTask.status, 'settling')
      )
    );
  // A retry returns the persisted result or safely uses the same refund ID.
  return result;
}
