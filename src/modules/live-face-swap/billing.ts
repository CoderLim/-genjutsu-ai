import { and, count, eq, gte, like, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask } from '@/config/db/schema';
import { consume, getBalance, revoke } from '@/modules/credits/service';
import { rowsAffectedFromUpdate } from '@/lib/fal-query-error-cas';

import {
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
  constructor(public requiredCredits: number, public balance: number) {
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
      noPartialRefund: true,
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
            ? 'Start Live Face Swap: 30 seconds'
            : 'Continue Live Face Swap: 30 seconds',
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

  // Trial-only spending guard. This is NOT a public distributed rate limit.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recent] = await db()
    .select({ total: count() })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        gte(aiTask.createdAt, since),
        like(aiTask.options, '%"kind":"live-session"%')
      )
    );
  if (Number(recent?.total ?? 0) >= 5) {
    throw new LiveFaceSwapSessionConflictError('Daily pilot limit reached');
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
    throw new LiveFaceSwapSessionConflictError('Live session is no longer active');
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
      .filter((chunk: { id: string; status: string }) => chunk.status === 'paid')
      .map((chunk: { id: string }) => Number(chunk.id.slice(params.sessionId.length + 1)))
  );
  let sequence = 0;
  while (paidSequences.has(sequence + 1) && sequence + 1 < LIVE_FACE_SWAP_MAX_CHUNKS) {
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
    throw new LiveFaceSwapSessionConflictError('Renewal sequence must be consecutive');
  }

  const now = Date.now();
  const previousPaidUntil = paid.paidUntilMs;
  if (
    now < previousPaidUntil - LIVE_FACE_SWAP_RENEW_AHEAD_MS ||
    now > previousPaidUntil + LIVE_FACE_SWAP_RENEW_LATE_MS
  ) {
    throw new LiveFaceSwapSessionConflictError('Renewal is outside the allowed payment window');
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

/** Browser teardown marker, not a provider-side kill switch. */
export async function endLiveFaceSwapSession(params: {
  sessionId: string;
  userId: string;
}) {
  await db()
    .update(aiTask)
    .set({ status: 'ended' })
    .where(
      and(
        eq(aiTask.id, params.sessionId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, LIVE_FACE_SWAP_SCENE),
        eq(aiTask.status, 'active')
      )
    );
}
