import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import {
  isPersistedProductProviderTarget,
  resolveProductProviderTarget,
} from '@/modules/genjutsu/workflow';

import { CHIPMUNKS_DANCE_MODE, CHIPMUNKS_DANCE_PRODUCT_ID } from './constants';

export class ChipmunksDanceProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChipmunksDanceProviderBindingError';
  }
}

/** Resolve this product's server-owned model pin (independent of homepage env). */
export function resolveChipmunksDanceProviderTarget(): GenjutsuProviderTarget {
  return resolveProductProviderTarget(CHIPMUNKS_DANCE_PRODUCT_ID, CHIPMUNKS_DANCE_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Accept previous Standard jobs as well as the current product-scoped Light pin.
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
  if (!isPersistedProductProviderTarget(provider, model, CHIPMUNKS_DANCE_MODE)) {
    throw new ChipmunksDanceProviderBindingError(
      `Chipmunks Dance does not support persisted provider/model (${String(provider)} / ${String(model)})`
    );
  }
}
