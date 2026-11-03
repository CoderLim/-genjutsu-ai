import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { CHIPMUNKS_DANCE_MODE } from './constants';

export class ChipmunksDanceProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChipmunksDanceProviderBindingError';
  }
}

/**
 * Homepage Genjutsu Light parity: ignore `GENJUTSU_PRODUCT_PROVIDER` and follow
 * `GENJUTSU_OBJECT_SWAP_PROVIDER` (production: higgsfield / genjutsu-light).
 */
export function resolveChipmunksDanceProviderTarget(): GenjutsuProviderTarget {
  return resolveGenjutsuProviderTarget(CHIPMUNKS_DANCE_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Chipmunks Dance must stay on the homepage objects-swap target (Higgs Light).
 */
export function assertChipmunksDanceProviderBinding(
  provider: unknown,
  model: unknown
) {
  if (
    typeof provider !== 'string' ||
    !provider.trim() ||
    typeof model !== 'string' ||
    !model.trim()
  ) {
    throw new ChipmunksDanceProviderBindingError(
      'Chipmunks Dance task is missing a provider/model binding'
    );
  }
  const expected = resolveGenjutsuProviderTarget(CHIPMUNKS_DANCE_MODE);
  if (provider !== expected.provider || model !== expected.model) {
    throw new ChipmunksDanceProviderBindingError(
      `Chipmunks Dance requires homepage objects-swap provider/model (${expected.provider} / ${expected.model})`
    );
  }
}
