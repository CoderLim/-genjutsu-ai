import {
  BICEP_HEART_AI_ASPECT_RATIO,
  BICEP_HEART_AI_DEFAULT_PROMPT,
  BICEP_HEART_AI_MODE,
  BICEP_HEART_AI_PRODUCT_ID,
  isBicepHeartAiResolution,
  LEGACY_BICEP_HEART_AI_PROMPTS,
} from './constants';

const ALLOWED_PROMPTS = new Set<string>([
  BICEP_HEART_AI_DEFAULT_PROMPT,
  ...LEGACY_BICEP_HEART_AI_PROMPTS,
]);

export class BicepHeartAiPreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BicepHeartAiPreflightError';
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

export function isAllowedBicepHeartAiPrompt(value: unknown): value is string {
  return typeof value === 'string' && ALLOWED_PROMPTS.has(value);
}

/**
 * Server-side product lock.
 *
 * Full run: fixed server R2 template (`useDefaultTemplate`), exactly one
 * reference image, fixed prompt + 9:16 aspect.
 *
 * Preview: same prompt/aspect/product, but client uploads a trimmed ≤4s
 * template clip at 480p plus the one image — `preview: true`,
 * `useDefaultTemplate` must be false.
 */
export function assertBicepHeartAiInputs(options: TaskOptions | null) {
  if (!options || options.product !== BICEP_HEART_AI_PRODUCT_ID) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI generation is missing its product binding'
    );
  }

  if (options.mode != null && options.mode !== BICEP_HEART_AI_MODE) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI only supports objects-swap'
    );
  }

  if (!isAllowedBicepHeartAiPrompt(options.prompt)) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI prompt does not match the fixed product prompt'
    );
  }

  if (options.aspectRatio !== BICEP_HEART_AI_ASPECT_RATIO) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI requires a fixed 9:16 aspect ratio'
    );
  }

  if (
    options.resolution != null &&
    !isBicepHeartAiResolution(options.resolution)
  ) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI only supports 480p and 720p'
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
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI preview must upload a trimmed template clip'
      );
    }
    if (typeof options.videoKey !== 'string' || !options.videoKey) {
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI preview is missing the trimmed template video'
      );
    }
    if (options.resolution != null && options.resolution !== '480p') {
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI preview must use 480p resolution'
      );
    }
    if (imageKeys.length !== 1) {
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI preview requires exactly one reference image'
      );
    }
    if (contentTypes.length !== 2 || contentLengths.length !== 2) {
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI preview expects one trimmed video plus one reference image'
      );
    }
    const videoType = contentTypes[0];
    if (typeof videoType !== 'string' || !videoType.startsWith('video/')) {
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI preview source must be a video'
      );
    }
    const imageType = contentTypes[1];
    if (typeof imageType !== 'string' || !imageType.startsWith('image/')) {
      throw new BicepHeartAiPreflightError(
        'Bicep Heart AI reference must be an image'
      );
    }
    return;
  }

  if (options.useDefaultTemplate !== true) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI must use the server-controlled template'
    );
  }

  if (typeof options.videoKey === 'string' && options.videoKey.length > 0) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI does not accept a custom reference video'
    );
  }

  if (imageKeys.length !== 1) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI requires exactly one reference image'
    );
  }

  if (contentTypes.length !== 1 || contentLengths.length !== 1) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI expects exactly one reference image (template is server-owned)'
    );
  }

  const type = contentTypes[0];
  if (typeof type !== 'string' || !type.startsWith('image/')) {
    throw new BicepHeartAiPreflightError(
      'Bicep Heart AI reference must be an image'
    );
  }
}
