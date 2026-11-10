import {
  buildWassupInAMinuteAiPrompt,
  isWassupInAMinuteAiResolution,
  LEGACY_WASSUP_IN_A_MINUTE_AI_PROMPTS,
  resolveWassupInAMinuteAiSlotsFromPrompt,
  WASSUP_IN_A_MINUTE_AI_ALLOWED_PROMPTS,
  WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO,
  WASSUP_IN_A_MINUTE_AI_MAX_IMAGES,
  WASSUP_IN_A_MINUTE_AI_MIN_IMAGES,
  WASSUP_IN_A_MINUTE_AI_MODE,
  WASSUP_IN_A_MINUTE_AI_PRODUCT_ID,
} from './constants';

const ALLOWED_PROMPTS = new Set<string>([
  ...WASSUP_IN_A_MINUTE_AI_ALLOWED_PROMPTS,
  ...LEGACY_WASSUP_IN_A_MINUTE_AI_PROMPTS,
]);

export class WassupInAMinuteAiPreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WassupInAMinuteAiPreflightError';
  }
}

type TaskOptions = {
  product?: unknown;
  mode?: unknown;
  prompt?: unknown;
  imageKeys?: unknown;
  contentTypes?: unknown;
  contentLengths?: unknown;
  useDefaultTemplate?: unknown;
  aspectRatio?: unknown;
  resolution?: unknown;
  preview?: unknown;
  videoKey?: unknown;
};

export function isAllowedWassupInAMinuteAiPrompt(
  value: unknown
): value is string {
  return typeof value === 'string' && ALLOWED_PROMPTS.has(value);
}

function assertImageTypes(contentTypes: unknown[], startIndex: number) {
  for (let i = startIndex; i < contentTypes.length; i += 1) {
    const type = contentTypes[i];
    if (typeof type !== 'string' || !type.startsWith('image/')) {
      throw new WassupInAMinuteAiPreflightError(
        'Wassup in a Minute AI references must be images'
      );
    }
  }
}

/**
 * Server-side product lock.
 *
 * Full run: fixed server R2 template (`useDefaultTemplate`), 1–3 sparse
 * reference images (left / center / right), prompt must match
 * `buildWassupInAMinuteAiPrompt(filledSlots)`, fixed 16:9 aspect.
 *
 * Preview: trimmed ≤4s clip at 480p + the same 1–3 images.
 */
export function assertWassupInAMinuteAiInputs(options: TaskOptions | null) {
  if (!options || options.product !== WASSUP_IN_A_MINUTE_AI_PRODUCT_ID) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI generation is missing its product binding'
    );
  }

  if (options.mode != null && options.mode !== WASSUP_IN_A_MINUTE_AI_MODE) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI only supports objects-swap'
    );
  }

  if (!isAllowedWassupInAMinuteAiPrompt(options.prompt)) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI prompt does not match the fixed product prompt'
    );
  }

  if (options.aspectRatio !== WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI requires a fixed 16:9 aspect ratio'
    );
  }

  if (
    options.resolution != null &&
    !isWassupInAMinuteAiResolution(options.resolution)
  ) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI only supports 480p and 720p'
    );
  }

  const imageKeys = Array.isArray(options.imageKeys) ? options.imageKeys : [];
  const contentTypes = Array.isArray(options.contentTypes)
    ? options.contentTypes
    : [];
  const contentLengths = Array.isArray(options.contentLengths)
    ? options.contentLengths
    : [];
  const isPreview = options.preview === true;

  if (
    imageKeys.length < WASSUP_IN_A_MINUTE_AI_MIN_IMAGES ||
    imageKeys.length > WASSUP_IN_A_MINUTE_AI_MAX_IMAGES
  ) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI requires between 1 and 3 reference images'
    );
  }

  const filledSlots = resolveWassupInAMinuteAiSlotsFromPrompt(
    options.prompt as string
  );
  if (!filledSlots || filledSlots.length !== imageKeys.length) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI prompt does not match the uploaded slot set'
    );
  }
  const expectedPrompt = buildWassupInAMinuteAiPrompt(filledSlots);
  if (options.prompt !== expectedPrompt) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI prompt does not match the uploaded slot set'
    );
  }

  if (isPreview) {
    if (options.useDefaultTemplate === true) {
      throw new WassupInAMinuteAiPreflightError(
        'Wassup in a Minute AI preview must upload a trimmed template clip'
      );
    }
    if (typeof options.videoKey !== 'string' || !options.videoKey) {
      throw new WassupInAMinuteAiPreflightError(
        'Wassup in a Minute AI preview is missing the trimmed template video'
      );
    }
    if (options.resolution != null && options.resolution !== '480p') {
      throw new WassupInAMinuteAiPreflightError(
        'Wassup in a Minute AI preview must use 480p resolution'
      );
    }
    const expectedLen = imageKeys.length + 1;
    if (
      contentTypes.length !== expectedLen ||
      contentLengths.length !== expectedLen
    ) {
      throw new WassupInAMinuteAiPreflightError(
        'Wassup in a Minute AI preview expects one trimmed video plus 1–3 reference images'
      );
    }
    const videoType = contentTypes[0];
    if (typeof videoType !== 'string' || !videoType.startsWith('video/')) {
      throw new WassupInAMinuteAiPreflightError(
        'Wassup in a Minute AI preview source must be a video'
      );
    }
    assertImageTypes(contentTypes, 1);
    return;
  }

  if (options.useDefaultTemplate !== true) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI must use the server-controlled template'
    );
  }

  if (typeof options.videoKey === 'string' && options.videoKey.length > 0) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI does not accept a custom reference video'
    );
  }

  if (
    contentTypes.length !== imageKeys.length ||
    contentLengths.length !== imageKeys.length
  ) {
    throw new WassupInAMinuteAiPreflightError(
      'Wassup in a Minute AI expects 1–3 reference images (template is server-owned)'
    );
  }

  assertImageTypes(contentTypes, 0);
}
