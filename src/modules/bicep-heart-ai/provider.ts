import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import {
  isPersistedProductProviderTarget,
  resolveProductProviderTarget,
} from '@/modules/genjutsu/workflow';

import { BICEP_HEART_AI_MODE, BICEP_HEART_AI_PRODUCT_ID } from './constants';

export class BicepHeartAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BicepHeartAiProviderBindingError';
  }
}

/** Resolve this product's server-owned model pin (independent of homepage env). */
export function resolveBicepHeartAiProviderTarget(): GenjutsuProviderTarget {
  return resolveProductProviderTarget(BICEP_HEART_AI_PRODUCT_ID, BICEP_HEART_AI_MODE);
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
  if (!isPersistedProductProviderTarget(provider, model, BICEP_HEART_AI_MODE)) {
    throw new BicepHeartAiProviderBindingError(
      `Bicep Heart AI requires homepage objects-swap provider/model (${String(provider)} / ${String(model)})`
    );
  }
}
