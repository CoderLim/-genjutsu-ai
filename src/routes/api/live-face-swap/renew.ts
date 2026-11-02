import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getBalance } from '@/modules/credits/service';
import {
  LiveFaceSwapInsufficientCreditsError,
  LiveFaceSwapSessionConflictError,
  renewLiveFaceSwapSession,
} from '@/modules/live-face-swap/billing';
import { isSameOriginLiveFaceSwapRequest } from '@/modules/live-face-swap/origin';
import {
  assertLiveFaceSwapSequence,
  assertLiveFaceSwapSessionId,
} from '@/modules/live-face-swap/pricing';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr, respJson } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  if (!isSameOriginLiveFaceSwapRequest(request)) {
    return respErr('Origin not allowed', { status: 403 });
  }
  const limit = enforceMinIntervalRateLimit(request, {
    intervalMs: 500,
    keyPrefix: 'live-face-swap-renew',
  });
  if (limit) return limit;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });

    const body = await request.json().catch(() => ({}));
    const sessionId = assertLiveFaceSwapSessionId(body.sessionId);
    const sequence = assertLiveFaceSwapSequence(body.sequence);
    const result = await renewLiveFaceSwapSession({
      sessionId,
      sequence,
      userId: session.user.id,
      userEmail: session.user.email,
    });
    return respData(
      {
        ...result,
        balance: await getBalance(session.user.id),
      },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  } catch (error) {
    if (error instanceof LiveFaceSwapInsufficientCreditsError) {
      return respJson(
        -1,
        'Insufficient credits to continue',
        { requiredCredits: error.requiredCredits, balance: error.balance },
        { status: 402 }
      );
    }
    if (error instanceof LiveFaceSwapSessionConflictError) {
      return respErr(error.message, { status: 409 });
    }
    return respErr('Could not renew the live session', { status: 502 });
  }
}

export const Route = createFileRoute('/api/live-face-swap/renew')({
  server: { handlers: { POST } },
});
