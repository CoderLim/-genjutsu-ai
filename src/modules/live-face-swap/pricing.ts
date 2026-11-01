export const LIVE_FACE_SWAP_SCENE = 'live-face-swap';
export const LIVE_FACE_SWAP_MODEL = 'decart/lucy-2-5/realtime';

// A billing CHUNK, not a maximum session duration. A continuing session buys
// the next chunk shortly before its currently prepaid time expires.
export const LIVE_FACE_SWAP_SECONDS = 30;
// Competitor benchmark: livefaceswap.ai/pricing — Lucy 2.5, 3.6 credits/s.
// This is a product tariff, deliberately independent of other generators'
// generic 1.7x cost-to-credits conversion. Do not silently change wallet pricing.
export const LIVE_FACE_SWAP_CREDITS_PER_SECOND = 3.6;

// Conservative budgeting rate: fal.ai/lucy-2.5 advertises $0.04/s.
// The model's playground also shows $0.02/s, so confirm actual invoices
// before public launch. No end-to-end provider billing reconciliation exists.
export const LIVE_FACE_SWAP_USD_PER_SECOND = 0.04;
export const LIVE_FACE_SWAP_PRICING_VERSION = 'lucy25-chunk30-v2-benchmark';
export const LIVE_FACE_SWAP_TOKEN_SECONDS = 120;
export const LIVE_FACE_SWAP_RENEW_AHEAD_MS = 8_000;
export const LIVE_FACE_SWAP_RENEW_LATE_MS = 5_000;
// Safety valve for an individual test connection (not a 30-second cap).
export const LIVE_FACE_SWAP_MAX_CHUNKS = 120; // 60 minutes

export const LIVE_FACE_SWAP_PROVIDER_COST_USD = Number(
  (LIVE_FACE_SWAP_SECONDS * LIVE_FACE_SWAP_USD_PER_SECOND).toFixed(4)
);
/** Exact 30-second prepaid amount at the published 3.6 credits/s rate. */
export const LIVE_FACE_SWAP_CREDITS = Math.round(
  LIVE_FACE_SWAP_SECONDS * LIVE_FACE_SWAP_CREDITS_PER_SECOND
);

export function assertLiveFaceSwapSessionId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9-]{16,64}$/i.test(value)) {
    throw new Error('Invalid live session ID');
  }
  return value;
}

export function assertLiveFaceSwapSequence(value: unknown): number {
  if (!Number.isSafeInteger(value) || value < 1 || value >= LIVE_FACE_SWAP_MAX_CHUNKS) {
    throw new Error('Invalid billing chunk');
  }
  return value;
}

export function liveFaceSwapPaidUntil(startedAtMs: number, sequence: number): number {
  return startedAtMs + (sequence + 1) * LIVE_FACE_SWAP_SECONDS * 1000;
}
