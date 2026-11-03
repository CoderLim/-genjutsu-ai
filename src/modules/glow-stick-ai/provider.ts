import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { GLOW_STICK_AI_MODE } from './constants';

export class GlowStickAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlowStickAiProviderBindingError';
  }
}

/**
 * Homepage Genjutsu Light parity: ignore `GENJUTSU_PRODUCT_PROVIDER` and follow
 * `GENJUTSU_OBJECT_SWAP_PROVIDER` (production: higgsfield / genjutsu-light).
 */
export function resolveGlowStickAiProviderTarget(): GenjutsuProviderTarget {
  return resolveGenjutsuProviderTarget(GLOW_STICK_AI_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Glow Stick must stay on the homepage objects-swap target (Higgs Light).
 */
export function assertGlowStickAiProviderBinding(
  provider: unknown,
  model: unknown
) {
  if (
    typeof provider !== 'string' ||
    !provider.trim() ||
    typeof model !== 'string' ||
    !model.trim()
  ) {
    throw new GlowStickAiProviderBindingError(
      'Glow Stick AI task is missing a provider/model binding'
    );
  }
  const expected = resolveGenjutsuProviderTarget(GLOW_STICK_AI_MODE);
  if (provider !== expected.provider || model !== expected.model) {
    throw new GlowStickAiProviderBindingError(
      `Glow Stick AI requires homepage objects-swap provider/model (${expected.provider} / ${expected.model})`
    );
  }
}
