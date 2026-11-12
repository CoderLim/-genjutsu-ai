import type { GenjutsuMode, GenjutsuProductId } from './types';

/**
 * Higgsfield Genjutsu endpoints. Both variants share the same Higgsfield
 * transport and task lifecycle; select a model, not a different provider.
 */
export const HIGGSFIELD_GENJUTSU_MODELS = {
  standard: {
    'objects-swap': 'higgsfield/genjutsu/object-swap/v1.0',
    'motion-transfer': 'higgsfield/genjutsu/motion-transfer/v1.0',
  },
  light: {
    'objects-swap': 'higgsfield/genjutsu-light/object-swap/v1.0',
    'motion-transfer': 'higgsfield/genjutsu-light/motion-transfer/v1.0',
  },
} as const satisfies Record<string, Record<GenjutsuMode, string>>;

export type HiggsfieldGenjutsuProfile = keyof typeof HIGGSFIELD_GENJUTSU_MODELS;

/**
 * Only product pages explicitly listed here are pinned to a model.
 * Other products and the homepage continue to use their existing env routing.
 *
 * These five templates previously followed the homepage's Genjutsu Light
 * configuration. Pinning them makes it safe to change the homepage later.
 * Review each product's output quality before choosing Standard or Light.
 */
export const PRODUCT_GENJUTSU_MODEL_PROFILES: Partial<
  Record<GenjutsuProductId, HiggsfieldGenjutsuProfile>
> = {
  'glow-stick': 'light',
  'tiny-desk-ai': 'light',
  'chipmunks-dance': 'light',
  'bicep-heart': 'light',
  'wassup-in-a-minute-ai': 'light',
};

export function getProductGenjutsuModelProfile(
  product: string | null | undefined
): HiggsfieldGenjutsuProfile | undefined {
  if (
    !product ||
    !Object.prototype.hasOwnProperty.call(
      PRODUCT_GENJUTSU_MODEL_PROFILES,
      product
    )
  ) {
    return undefined;
  }
  return PRODUCT_GENJUTSU_MODEL_PROFILES[product as GenjutsuProductId];
}

export function isHiggsfieldGenjutsuLightModel(model: string | null | undefined) {
  return (
    typeof model === 'string' &&
    model.startsWith('higgsfield/genjutsu-light/')
  );
}

export function isKnownHiggsfieldGenjutsuModel(
  model: string,
  mode: GenjutsuMode
) {
  return (
    model === HIGGSFIELD_GENJUTSU_MODELS.standard[mode] ||
    model === HIGGSFIELD_GENJUTSU_MODELS.light[mode]
  );
}
