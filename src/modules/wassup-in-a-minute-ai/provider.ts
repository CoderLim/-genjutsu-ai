import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import {
  isPersistedProductProviderTarget,
  resolveProductProviderTarget,
} from '@/modules/genjutsu/workflow';

import { WASSUP_IN_A_MINUTE_AI_MODE, WASSUP_IN_A_MINUTE_AI_PRODUCT_ID } from './constants';

export class WassupInAMinuteAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WassupInAMinuteAiProviderBindingError';
  }
}

/** Resolve this product's server-owned model pin (independent of homepage env). */
export function resolveWassupInAMinuteAiProviderTarget(): GenjutsuProviderTarget {
  return resolveProductProviderTarget(WASSUP_IN_A_MINUTE_AI_PRODUCT_ID, WASSUP_IN_A_MINUTE_AI_MODE);
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
  if (!isPersistedProductProviderTarget(provider, model, WASSUP_IN_A_MINUTE_AI_MODE)) {
    throw new WassupInAMinuteAiProviderBindingError(
      `Wassup in a Minute AI requires homepage objects-swap provider/model (${String(provider)} / ${String(model)})`
    );
  }
}
