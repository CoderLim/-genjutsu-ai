import {
  CHIPMUNKS_DANCE_ASPECT_RATIO,
  CHIPMUNKS_DANCE_DEFAULT_PROMPT,
  CHIPMUNKS_DANCE_MODE,
  CHIPMUNKS_DANCE_PRODUCT_ID,
  isChipmunksDanceResolution,
  LEGACY_CHIPMUNKS_DANCE_PROMPTS,
} from './constants';

const ALLOWED_PROMPTS = new Set<string>([
  CHIPMUNKS_DANCE_DEFAULT_PROMPT,
  ...LEGACY_CHIPMUNKS_DANCE_PROMPTS,
]);

export class ChipmunksDancePreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChipmunksDancePreflightError';
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

export function isAllowedChipmunksDancePrompt(value: unknown): value is string {
  return typeof value === 'string' && ALLOWED_PROMPTS.has(value);
}

export function assertChipmunksDanceInputs(options: TaskOptions | null) {
  if (!options || options.product !== CHIPMUNKS_DANCE_PRODUCT_ID) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance generation is missing its product binding'
    );
  }

  if (options.mode != null && options.mode !== CHIPMUNKS_DANCE_MODE) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance only supports objects-swap'
    );
  }

  if (!isAllowedChipmunksDancePrompt(options.prompt)) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance prompt does not match the fixed product prompt'
    );
  }

  if (options.aspectRatio !== CHIPMUNKS_DANCE_ASPECT_RATIO) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance requires a fixed 9:16 aspect ratio'
    );
  }

  if (
    options.resolution != null &&
    !isChipmunksDanceResolution(options.resolution)
  ) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance only supports 480p and 720p'
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
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance preview must upload a trimmed template clip'
      );
    }
    if (typeof options.videoKey !== 'string' || !options.videoKey) {
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance preview is missing the trimmed template video'
      );
    }
    if (options.resolution != null && options.resolution !== '480p') {
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance preview must use 480p resolution'
      );
    }
    if (imageKeys.length !== 3) {
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance preview requires exactly three reference images'
      );
    }
    if (contentTypes.length !== 4 || contentLengths.length !== 4) {
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance preview expects one trimmed video plus three reference images'
      );
    }
    const videoType = contentTypes[0];
    if (typeof videoType !== 'string' || !videoType.startsWith('video/')) {
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance preview source must be a video'
      );
    }
    for (let i = 1; i < 4; i += 1) {
      const type = contentTypes[i];
      if (typeof type !== 'string' || !type.startsWith('image/')) {
        throw new ChipmunksDancePreflightError(
          'Chipmunks Dance preview references must be images'
        );
      }
    }
    return;
  }

  if (options.useDefaultTemplate !== true) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance requires the fixed server template'
    );
  }
  if (typeof options.videoKey === 'string' && options.videoKey.length > 0) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance does not accept a custom reference video'
    );
  }
  if (imageKeys.length !== 3) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance requires exactly three reference images'
    );
  }
  if (contentTypes.length !== 3 || contentLengths.length !== 3) {
    throw new ChipmunksDancePreflightError(
      'Chipmunks Dance expects exactly three reference images'
    );
  }
  for (let i = 0; i < 3; i += 1) {
    const type = contentTypes[i];
    if (typeof type !== 'string' || !type.startsWith('image/')) {
      throw new ChipmunksDancePreflightError(
        'Chipmunks Dance references must be images'
      );
    }
  }
}
