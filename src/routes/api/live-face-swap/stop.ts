import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { isSameOriginLiveFaceSwapRequest } from '@/modules/live-face-swap/origin';
import { endLiveFaceSwapSession } from '@/modules/live-face-swap/billing';
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
  } catch {
    // Fail closed: an uncertain partial refund/charge is NEVER guessed from
    // a client timer. The task remains for audit and stop can be retried.
    return respErr('Live settlement is pending reconciliation', { status: 409 });
  }
}

export const Route = createFileRoute('/api/live-face-swap/stop')({
  server: { handlers: { POST } },
});
