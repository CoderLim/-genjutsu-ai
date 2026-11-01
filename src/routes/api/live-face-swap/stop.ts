import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { endLiveFaceSwapSession } from '@/modules/live-face-swap/billing';
import { assertLiveFaceSwapSessionId } from '@/modules/live-face-swap/pricing';
import { respErr, respOk } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const origin = request.headers.get('origin');
  try {
    if (origin && new URL(origin).origin !== new URL(request.url).origin) {
      return respErr('Origin not allowed', { status: 403 });
    }
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });
    const body = await request.json().catch(() => ({}));
    const sessionId = assertLiveFaceSwapSessionId(body.sessionId);
    await endLiveFaceSwapSession({ sessionId, userId: session.user.id });
    return respOk({ headers: { 'Cache-Control': 'no-store, private' } });
  } catch {
    return respErr('Could not close live session', { status: 400 });
  }
}

export const Route = createFileRoute('/api/live-face-swap/stop')({
  server: { handlers: { POST } },
});
