import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { WASSUP_IN_A_MINUTE_AI_MODE } from './constants';

export class WassupInAMinuteAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WassupInAMinuteAiProviderBindingError';
  }
}

/**
 * Homepage Genjutsu Light parity: ignore `GENJUTSU_PRODUCT_PROVIDER` and follow
 * `GENJUTSU_OBJECT_SWAP_PROVIDER` (production: higgsfield / genjutsu-light).
 */
export function resolveWassupInAMinuteAiProviderTarget(): GenjutsuProviderTarget {
  return resolveGenjutsuProviderTarget(WASSUP_IN_A_MINUTE_AI_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Wassup must stay on the homepage objects-swap target (Higgs Light).
 */
export function assertWassupInAMinuteAiProviderBinding(
  provider: unknown,
  model: unknown
) {
  if (
    typeof provider !== 'string' ||
    !provider.trim() ||
    typeof model !== 'string' ||
    !model.trim()
  ) {
    throw new WassupInAMinuteAiProviderBindingError(
      'Wassup in a Minute AI task is missing a provider/model binding'
    );
  }
  const expected = resolveGenjutsuProviderTarget(WASSUP_IN_A_MINUTE_AI_MODE);
  if (provider !== expected.provider || model !== expected.model) {
    throw new WassupInAMinuteAiProviderBindingError(
      `Wassup in a Minute AI requires homepage objects-swap provider/model (${expected.provider} / ${expected.model})`
    );
  }
}
