import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { hasPermission } from '@/modules/rbac/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respErr } from '@/lib/resp';

const ENDPOINT = 'decart/lucy-2-5/realtime';
const TOKEN_URL = 'https://rest.fal.ai/tokens/';
const TOKEN_EXPIRATION_SECONDS = 120;

/**
 * Pilot-only token minting endpoint. A short-lived JWT authenticates the fal
 * signaling connection; it does NOT terminate an already-open paid WebRTC
 * session or enforce a usage budget. Never enable this for everyone without
 * server-enforced session leases and real usage settlement.
 */
async function POST({ request }: { request: Request }) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 2_000,
    keyPrefix: 'live-face-swap-token',
  });
  if (limited) return limited;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return respErr('Origin not allowed', { status: 403 });
      }
    } catch {
      return respErr('Origin not allowed', { status: 403 });
    }
  }

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Please sign in', { status: 401 });
    if (process.env.LIVE_FACE_SWAP_ENABLED !== 'true') {
      return respErr('Live Face Swap is not enabled yet', { status: 503 });
    }

    // No public, free-for-all realtime sessions: each connected second
    // accrues provider costs. The UI duration timer is NOT a security cap.
    const emails = (process.env.LIVE_FACE_SWAP_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const permitted =
      emails.includes(session.user.email.toLowerCase()) ||
      (await hasPermission(session.user.id, 'admin.*'));
    if (!permitted) {
      return respErr('Live Face Swap is in limited testing', { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.app !== ENDPOINT) {
      return respErr('Unsupported live model', { status: 400 });
    }

    const apiKey = process.env.FAL_KEY?.trim();
    if (!apiKey) {
      return respErr('Live Face Swap is not configured', { status: 503 });
    }

    // Match @fal-ai/client's getTemporaryAuthToken: the endpoint alias
    // (lucy-2-5), not the full realtime path, is the allowed_apps scope.
    const upstream = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Key ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        allowed_apps: ['lucy-2-5'],
        token_expiration: TOKEN_EXPIRATION_SECONDS,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return respErr('Could not start the live service', { status: 502 });
    }
    const raw = await upstream.text();
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
      // Support a plain JWT response as well as JSON-encoded token.
    }
    if (typeof token !== 'string' || !token.trim()) {
      return respErr('Invalid live session response', { status: 502 });
    }
    return new Response(token, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    // Avoid logging the user's identity, token, or image inputs.
    return respErr('Live service temporarily unavailable', { status: 502 });
  }
}

export const Route = createFileRoute('/api/live-face-swap/token')({
  server: { handlers: { POST } },
});
