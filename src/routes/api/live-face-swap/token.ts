import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getConfig } from '@/modules/config/service';
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
import { isSameOriginLiveFaceSwapRequest } from '@/modules/live-face-swap/origin';
import {
  assertLiveFaceSwapSessionId,
  LIVE_FACE_SWAP_CREDITS,
  LIVE_FACE_SWAP_MODEL,
  LIVE_FACE_SWAP_TOKEN_SECONDS,
} from '@/modules/live-face-swap/pricing';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr, respJson } from '@/lib/resp';

const TOKEN_URL = 'https://rest.fal.ai/tokens/';

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
  if (!isSameOriginLiveFaceSwapRequest(request)) {
    return respErr('Origin not allowed', { status: 403 });
  }
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 800,
    keyPrefix: 'live-face-swap-token',
  });
  if (limited) return limited;

  let reservedNewSession = false;
  let sessionId: string | null = null;
  let userId: string | null = null;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Please sign in', { status: 401 });
    userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    if (body?.app !== LIVE_FACE_SWAP_MODEL) {
      return respErr('Unsupported live model', { status: 400 });
    }
    sessionId = assertLiveFaceSwapSessionId(body.sessionId);

    const apiKey = (await getConfig('fal_api_key'))?.trim();
    if (!apiKey)
      return respErr('Live Face Swap is not configured', { status: 503 });

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

    // Do not expose the server-configured Fal API key to browsers.
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

    // Do the final potentially-failing balance read BEFORE changing the
    // reservation into 'active'. That keeps a pre-delivery failure refundable.
    const balance = await getBalance(userId);
    const paid = reservedNewSession
      ? null
      : await getLiveFaceSwapPaidState({ sessionId, userId });
    const issuedAtMs = reservedNewSession
      ? await activateLiveFaceSwapSession({ sessionId, userId })
      : paid!.issuedAtMs;
    const paidUntilMs = paid?.paidUntilMs ?? issuedAtMs + 30_000;
    if (Date.now() > paidUntilMs) {
      throw new Error('Live authorization expired');
    }

    return respData(
      {
        token,
        sessionId,
        issuedAtMs,
        paidUntilMs,
        sequence: paid?.sequence ?? 0,
        chargedCredits: paid?.chargedCredits ?? LIVE_FACE_SWAP_CREDITS,
        creditsPerChunk: LIVE_FACE_SWAP_CREDITS,
        balance,
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
