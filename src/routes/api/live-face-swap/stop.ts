import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { isSameOriginLiveFaceSwapRequest } from '@/modules/live-face-swap/origin';
import { endLiveFaceSwapSession, LiveFaceSwapSessionConflictError } from '@/modules/live-face-swap/billing';
import { assertLiveFaceSwapSessionId } from '@/modules/live-face-swap/pricing';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  if (!isSameOriginLiveFaceSwapRequest(request)) {
    return respErr('Origin not allowed', { status: 403 });
  }
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });
    const body = await request.json().catch(() => ({}));
    const sessionId = assertLiveFaceSwapSessionId(body.sessionId);
    const settlement = await endLiveFaceSwapSession({
      sessionId, userId: session.user.id,
    });
    return respData(settlement, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch (cause) {
    // Keep the customer response generic while retaining useful operator
    // diagnostics. Never log uploaded references, auth headers or session IDs.
    const conflict = cause instanceof LiveFaceSwapSessionConflictError;
    console.error('[live-face-swap] stop failed', {
      reason: conflict ? cause.message : 'unexpected-settlement-error',
    });
    // Fail closed: an uncertain partial refund/charge is NEVER guessed from
    // client timing. Unresolved tasks remain for manual audit.
    return respErr('Live settlement is pending reconciliation', {
      status: conflict ? 409 : 502,
    });
  }
}

export const Route = createFileRoute('/api/live-face-swap/stop')({
  server: { handlers: { POST } },
});
