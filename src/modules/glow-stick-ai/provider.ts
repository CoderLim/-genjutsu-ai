import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import {
  isPersistedProductProviderTarget,
  resolveProductProviderTarget,
} from '@/modules/genjutsu/workflow';

import { GLOW_STICK_AI_MODE, GLOW_STICK_AI_PRODUCT_ID } from './constants';

export class GlowStickAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlowStickAiProviderBindingError';
  }
}

/** Resolve this product's server-owned model pin (independent of homepage env). */
export function resolveGlowStickAiProviderTarget(): GenjutsuProviderTarget {
  return resolveProductProviderTarget(GLOW_STICK_AI_PRODUCT_ID, GLOW_STICK_AI_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Accept previous Standard jobs as well as the current product-scoped Light pin.
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
  if (!isPersistedProductProviderTarget(provider, model, GLOW_STICK_AI_MODE)) {
    throw new GlowStickAiProviderBindingError(
      `Glow Stick AI does not support persisted provider/model (${String(provider)} / ${String(model)})`
    );
  }
}
