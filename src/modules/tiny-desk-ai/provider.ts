import type { GenjutsuProviderTarget } from '@/modules/genjutsu/types';
import { resolveGenjutsuProviderTarget } from '@/modules/genjutsu/workflow';

import { TINY_DESK_AI_MODE } from './constants';

export class TinyDeskAiProviderBindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TinyDeskAiProviderBindingError';
  }
}

/**
 * Homepage Genjutsu Light parity: ignore `GENJUTSU_PRODUCT_PROVIDER` and follow
 * `GENJUTSU_OBJECT_SWAP_PROVIDER` (production: higgsfield / genjutsu-light).
 */
export function resolveTinyDeskAiProviderTarget(): GenjutsuProviderTarget {
  return resolveGenjutsuProviderTarget(TINY_DESK_AI_MODE);
}

/**
 * Persisted attempts keep the provider/model they were created with.
 * Tiny Desk must stay on the homepage objects-swap target (Higgs Light).
 */
export function assertTinyDeskAiProviderBinding(
  provider: unknown,
  model: unknown
) {
  if (
    typeof provider !== 'string' ||
    !provider.trim() ||
    typeof model !== 'string' ||
    !model.trim()
  ) {
    throw new TinyDeskAiProviderBindingError(
      'Tiny Desk AI task is missing a provider/model binding'
    );
  }
  const expected = resolveGenjutsuProviderTarget(TINY_DESK_AI_MODE);
  if (provider !== expected.provider || model !== expected.model) {
    throw new TinyDeskAiProviderBindingError(
      `Tiny Desk AI requires homepage objects-swap provider/model (${expected.provider} / ${expected.model})`
    );
  }
}
