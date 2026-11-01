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
export const LIVE_FACE_SWAP_PRICING_VERSION = 'lucy25-second-settlement-v3-pilot';
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

/**
 * A provisional billing estimate from server-observed token issuance through
 * server-received stop. This is NOT a verified fal provider usage receipt.
 * Customer credits are integer-valued, so fractional seconds round UP to
 * the nearest second and credits round UP for the full session.
 */
export function calculateLiveFaceSwapSettlement(params: {
  issuedAtMs: number;
  endedAtMs: number;
  reservedChunks: number;
}) {
  const { issuedAtMs, endedAtMs, reservedChunks } = params;
  if (
    !Number.isSafeInteger(issuedAtMs) || issuedAtMs <= 0 ||
    !Number.isSafeInteger(endedAtMs) || endedAtMs < issuedAtMs ||
    !Number.isSafeInteger(reservedChunks) ||
    reservedChunks < 1 || reservedChunks > LIVE_FACE_SWAP_MAX_CHUNKS
  ) {
    throw new Error('Invalid live settlement inputs');
  }
  const billedSeconds = Math.ceil((endedAtMs - issuedAtMs) / 1000);
  const reservedCredits = reservedChunks * LIVE_FACE_SWAP_CREDITS;
  const estimatedCredits = Math.ceil(billedSeconds * LIVE_FACE_SWAP_CREDITS_PER_SECOND);
  const chargedCredits = Math.min(reservedCredits, estimatedCredits);
  return {
    billedSeconds,
    reservedCredits,
    chargedCredits,
    refundedCredits: reservedCredits - chargedCredits,
    uncoveredCredits: Math.max(0, estimatedCredits - reservedCredits),
    billingBasis: 'server-token-wallclock' as const,
  };
}

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
