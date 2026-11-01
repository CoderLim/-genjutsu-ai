import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { hasPermission } from '@/modules/rbac/service';
import { getBalance } from '@/modules/credits/service';
import {
  activateLiveFaceSwapSession,
  getLiveFaceSwapPaidState,
  getLiveFaceSwapSession,
  LiveFaceSwapInsufficientCreditsError,
  LiveFaceSwapSessionConflictError,
  refundLiveFaceSwapBeforeToken,
  reserveLiveFaceSwapSession,
} from '@/modules/live-face-swap/billing';
import {
  assertLiveFaceSwapSessionId,
  LIVE_FACE_SWAP_CREDITS,
  LIVE_FACE_SWAP_MODEL,
  LIVE_FACE_SWAP_TOKEN_SECONDS,
} from '@/modules/live-face-swap/pricing';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr, respJson } from '@/lib/resp';

const TOKEN_URL = 'https://rest.fal.ai/tokens/';

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function readFalToken(raw: string) {
  let token: unknown = raw.trim();
  try {
    const parsed = JSON.parse(raw);
    token =
      typeof parsed === 'string'
        ? parsed
        : typeof parsed?.detail === 'string'
          ? parsed.detail
          : typeof parsed?.token === 'string'
            ? parsed.token
            : null;
  } catch {
    // Plain JWT response.
  }
  return typeof token === 'string' && token.length > 20 ? token : null;
}

/**
 * Only a PILOT endpoint. A JWT can authorize an unbounded WebRTC connection
 * and can be replayed. Prepaid chunks + heartbeat do not force upstream
 * termination. Keep gated until provider-side leases / enforced media relays
 * and verified usage reconciliation are available.
 */
async function POST({ request }: { request: Request }) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 800,
    keyPrefix: 'live-face-swap-token',
  });
  if (limited) return limited;
  if (!sameOrigin(request)) return respErr('Origin not allowed', { status: 403 });

  let reservedNewSession = false;
  let sessionId: string | null = null;
  let userId: string | null = null;
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Please sign in', { status: 401 });
    userId = session.user.id;

    if (process.env.LIVE_FACE_SWAP_ENABLED !== 'true') {
      return respErr('Live Face Swap is not enabled yet', { status: 503 });
    }
    const emails = (process.env.LIVE_FACE_SWAP_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const permitted =
      emails.includes(session.user.email.toLowerCase()) ||
      (await hasPermission(userId, 'admin.*'));
    if (!permitted) {
      return respErr('Live Face Swap is in limited testing', { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.app !== LIVE_FACE_SWAP_MODEL) {
      return respErr('Unsupported live model', { status: 400 });
    }
    sessionId = assertLiveFaceSwapSessionId(body.sessionId);

    const apiKey = process.env.FAL_KEY?.trim();
    if (!apiKey) return respErr('Live Face Swap is not configured', { status: 503 });

    const existing = await getLiveFaceSwapSession({ sessionId, userId });
    if (!existing) {
      await reserveLiveFaceSwapSession({
        sessionId,
        userId,
        userEmail: session.user.email,
      });
      reservedNewSession = true;
    } else if (existing.status !== 'active') {
      return respErr('This session ID cannot be used again', { status: 409 });
    } else {
      const paid = await getLiveFaceSwapPaidState({ sessionId, userId });
      if (Date.now() > paid.paidUntilMs) {
        return respErr('Prepaid live time expired', { status: 402 });
      }
    }

    // Do not expose the master FAL_KEY to browsers.
    const upstream = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Key ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        allowed_apps: ['lucy-2-5'],
        token_expiration: LIVE_FACE_SWAP_TOKEN_SECONDS,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      throw new Error('Could not authorize live provider');
    }
    const token = readFalToken(await upstream.text());
    if (!token) throw new Error('Invalid live service response');

    const issuedAtMs = reservedNewSession
      ? await activateLiveFaceSwapSession({ sessionId, userId })
      : undefined;
    const paid = await getLiveFaceSwapPaidState({ sessionId, userId });
    if (Date.now() > paid.paidUntilMs) {
      throw new Error('Live authorization expired');
    }

    return respData(
      {
        token,
        sessionId,
        issuedAtMs: issuedAtMs ?? paid.issuedAtMs,
        paidUntilMs: paid.paidUntilMs,
        chargedCredits: paid.chargedCredits,
        creditsPerChunk: LIVE_FACE_SWAP_CREDITS,
        balance: await getBalance(userId),
      },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  } catch (cause) {
    if (cause instanceof LiveFaceSwapInsufficientCreditsError) {
      return respJson(
        -1,
        'Insufficient credits',
        { requiredCredits: cause.requiredCredits, balance: cause.balance },
        { status: 402 }
      );
    }
    if (cause instanceof LiveFaceSwapSessionConflictError) {
      return respErr(cause.message, { status: 409 });
    }

    // If no JWT was ever handed to the caller, refund the INITIAL chunk.
    // Once a JWT is delivered, no client-reported timing can trigger refunds.
    if (reservedNewSession && sessionId && userId) {
      try {
        await refundLiveFaceSwapBeforeToken({ sessionId, userId });
      } catch {
        // Leave the row in refunding state for reconciliation.
      }
    }
    return respErr('Could not start live service', { status: 502 });
  }
}

export const Route = createFileRoute('/api/live-face-swap/token')({
  server: { handlers: { POST } },
});
