import {
  GLOW_STICK_AI_ASPECT_RATIO,
  GLOW_STICK_AI_DEFAULT_PROMPT,
  GLOW_STICK_AI_MODE,
  GLOW_STICK_AI_PRODUCT_ID,
  isGlowStickAiResolution,
  LEGACY_GLOW_STICK_AI_PROMPTS,
} from './constants';

const ALLOWED_PROMPTS = new Set<string>([
  GLOW_STICK_AI_DEFAULT_PROMPT,
  ...LEGACY_GLOW_STICK_AI_PROMPTS,
]);

export class GlowStickAiPreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlowStickAiPreflightError';
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

export function isAllowedGlowStickAiPrompt(value: unknown): value is string {
  return typeof value === 'string' && ALLOWED_PROMPTS.has(value);
}

export function assertGlowStickAiInputs(options: TaskOptions | null) {
  if (!options || options.product !== GLOW_STICK_AI_PRODUCT_ID) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI generation is missing its product binding'
    );
  }

  if (options.mode != null && options.mode !== GLOW_STICK_AI_MODE) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI only supports objects-swap'
    );
  }

  if (!isAllowedGlowStickAiPrompt(options.prompt)) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI prompt does not match the fixed product prompt'
    );
  }

  if (options.aspectRatio !== GLOW_STICK_AI_ASPECT_RATIO) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI requires a fixed 9:16 aspect ratio'
    );
  }

  if (
    options.resolution != null &&
    !isGlowStickAiResolution(options.resolution)
  ) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI only supports 480p and 720p'
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

  if (isPreview) {
    if (options.useDefaultTemplate === true) {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI preview must upload a trimmed template clip'
      );
    }
    if (typeof options.videoKey !== 'string' || !options.videoKey) {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI preview is missing the trimmed template video'
      );
    }
    if (options.resolution != null && options.resolution !== '480p') {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI preview must use 480p resolution'
      );
    }
    if (imageKeys.length !== 3) {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI preview requires exactly three reference images'
      );
    }
    if (contentTypes.length !== 4 || contentLengths.length !== 4) {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI preview expects one trimmed video plus three reference images'
      );
    }
    const videoType = contentTypes[0];
    if (typeof videoType !== 'string' || !videoType.startsWith('video/')) {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI preview source must be a video'
      );
    }
    for (let i = 1; i < 4; i += 1) {
      const type = contentTypes[i];
      if (typeof type !== 'string' || !type.startsWith('image/')) {
        throw new GlowStickAiPreflightError(
          'Glow Stick AI preview references must be images'
        );
      }
    }
    return;
  }

  if (options.useDefaultTemplate !== true) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI requires the fixed server template'
    );
  }
  if (typeof options.videoKey === 'string' && options.videoKey.length > 0) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI does not accept a custom reference video'
    );
  }
  if (imageKeys.length !== 3) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI requires exactly three reference images'
    );
  }
  if (contentTypes.length !== 3 || contentLengths.length !== 3) {
    throw new GlowStickAiPreflightError(
      'Glow Stick AI expects exactly three reference images'
    );
  }
  for (let i = 0; i < 3; i += 1) {
    const type = contentTypes[i];
    if (typeof type !== 'string' || !type.startsWith('image/')) {
      throw new GlowStickAiPreflightError(
        'Glow Stick AI references must be images'
      );
    }
  }
}
