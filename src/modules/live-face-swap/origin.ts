/**
 * Sensitive live-token and billing endpoints accept only same-origin browser
 * POSTs. We intentionally reject missing Origin rather than trusting a
 * request's cookies alone (e.g. a cross-site form or non-browser request).
 */
export function isSameOriginLiveFaceSwapRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
