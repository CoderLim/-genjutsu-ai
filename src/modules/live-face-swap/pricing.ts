import { calculateProviderCredits } from '@/lib/ai-credits';

export const LIVE_FACE_SWAP_SCENE = 'live-face-swap';
export const LIVE_FACE_SWAP_MODEL = 'decart/lucy-2-5/realtime';
export const LIVE_FACE_SWAP_SECONDS = 30;
export const LIVE_FACE_SWAP_USD_PER_SECOND = 0.04;
export const LIVE_FACE_SWAP_PRICING_VERSION = 'lucy25-30s-v1';
export const LIVE_FACE_SWAP_TOKEN_SECONDS = 120;

export const LIVE_FACE_SWAP_PROVIDER_COST_USD = Number(
  (LIVE_FACE_SWAP_SECONDS * LIVE_FACE_SWAP_USD_PER_SECOND).toFixed(4)
);
export const LIVE_FACE_SWAP_CREDITS = calculateProviderCredits(
  LIVE_FACE_SWAP_PROVIDER_COST_USD
);

/** Session ID is a one-time, caller-generated idempotency key, not a price input. */
export function assertLiveFaceSwapSessionId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[a-z0-9-]{16,64}$/i.test(value)
  ) {
    throw new Error('Invalid live session ID');
  }
  return value;
}
