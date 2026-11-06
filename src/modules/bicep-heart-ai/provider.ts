import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { BICEP_HEART_AI_MODE } from './constants';

export class BicepHeartAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BicepHeartAiProviderBindingError';
  }
}

/**
 * Homepage Genjutsu Light parity: ignore `GENJUTSU_PRODUCT_PROVIDER` and follow
 * `GENJUTSU_OBJECT_SWAP_PROVIDER` (production: higgsfield / genjutsu-light).
 */
export function resolveBicepHeartAiProviderTarget(): GenjutsuProviderTarget {
  return resolveGenjutsuProviderTarget(BICEP_HEART_AI_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Bicep Heart must stay on the homepage objects-swap target (Higgs Light).
 */
export function assertBicepHeartAiProviderBinding(
  provider: unknown,
  model: unknown
) {
  if (
    typeof provider !== 'string' ||
    !provider.trim() ||
    typeof model !== 'string' ||
    !model.trim()
  ) {
    throw new BicepHeartAiProviderBindingError(
      'Bicep Heart AI task is missing a provider/model binding'
    );
  }
  const expected = resolveGenjutsuProviderTarget(BICEP_HEART_AI_MODE);
  if (provider !== expected.provider || model !== expected.model) {
    throw new BicepHeartAiProviderBindingError(
      `Bicep Heart AI requires homepage objects-swap provider/model (${expected.provider} / ${expected.model})`
    );
  }
}
