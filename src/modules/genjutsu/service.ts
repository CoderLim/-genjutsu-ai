import { envConfigs } from '@/config';

import {
  createGenjutsuE2ERequestId,
  isGenjutsuE2EMockEnabled,
} from './e2e-mock';
import {
  getHiggsfieldStatus,
  HiggsfieldHttpError,
  HiggsfieldPreflightError,
  higgsfieldProviderFetch,
} from './higgsfield-client';
import { estimateGenjutsuListCost } from './pricing';
import {
  estimateSeedanceProviderCost,
  getSeedanceStatus,
  isSeedanceLikenessRejection,
  SeedanceHttpError,
  SeedancePreflightError,
  submitSeedance,
} from './seedance';
import {
  estimateHiggsfieldSeedanceProviderCost,
  submitHiggsfieldSeedance,
  type HiggsfieldSeedanceAspectRatio,
} from './seedance-higgsfield';
import {
  assertSeeapiSeedanceConfigured,
  estimateSeeapiSeedanceProviderCost,
  getSeeapiSeedanceStatus,
  SeeapiSeedanceHttpError,
  submitSeeapiSeedance,
} from './seedance-seeapi';
import {
  assertVolcengineSeedanceConfigured,
  estimateVolcengineSeedanceProviderCost,
  getVolcengineSeedanceStatus,
  submitVolcengineSeedance,
  VolcengineSeedanceHttpError,
} from './seedance-volcengine';
import {
  assertWavespeedSeedanceConfigured,
  estimateWavespeedSeedanceProviderCost,
  getWavespeedSeedanceStatus,
  submitWavespeedSeedance,
  WavespeedSeedanceHttpError,
} from './seedance-wavespeed';
import type {
  GenjutsuMode,
  GenjutsuProvider,
  GenjutsuResolution,
} from './types';
import { probeSeedanceSourceDurationSeconds } from './video-metadata';
import {
  isSeedanceFamilyProvider,
  resolveGenjutsuProviderTarget,
  resolveProductProviderTarget,
} from './workflow';

export type {
  GenjutsuMode,
  GenjutsuProvider,
  GenjutsuResolution,
} from './types';
export {
  HiggsfieldHttpError,
  HiggsfieldPreflightError,
  isSeedanceLikenessRejection,
  SeedanceHttpError,
  SeedancePreflightError,
  SeeapiSeedanceHttpError,
  VolcengineSeedanceHttpError,
  WavespeedSeedanceHttpError,
  resolveGenjutsuProviderTarget,
  resolveProductProviderTarget,
};

const VALID_RESOLUTIONS = new Set<GenjutsuResolution>([
  '480p',
  '720p',
  '1080p',
]);

/** Free estimate must not stall generation if Higgsfield is slow. */
const ESTIMATE_TIMEOUT_MS = 8_000;

/**
 * When estimate returns a pricing description (or fails), bill against the
 * published list rate. Cap at Genjutsu's 30s source limit; prefer a
 * conservative upper bound when duration is unknown so we do not under-reserve.
 */
const FALLBACK_DURATION_SECONDS = 30;

export function getGenjutsuModel(mode: GenjutsuMode) {
  if (mode === 'motion-transfer') {
    return (
      envConfigs.higgsfield_genjutsu_motion_model?.trim() ||
      'higgsfield/genjutsu/motion-transfer/v1.0'
    );
  }

  return (
    envConfigs.higgsfield_genjutsu_object_swap_model?.trim() ||
    'higgsfield/genjutsu/object-swap/v1.0'
  );
}

function parseEstimateUsd(payload: any): number | null {
  const usdRaw =
    payload?.usd ??
    payload?.cost_usd ??
    payload?.cost?.usd ??
    payload?.estimate?.usd;
  const providerCostUsd = Number(usdRaw);
  if (!Number.isFinite(providerCostUsd) || providerCostUsd <= 0) return null;
  return providerCostUsd;
}

function normalizeFallbackDurationSeconds(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return FALLBACK_DURATION_SECONDS;
  }
  return Math.min(FALLBACK_DURATION_SECONDS, Math.max(1, value));
}

export async function createHiggsfieldUploadUrl(contentType: string) {
  const normalized = contentType.trim().toLowerCase();
  if (
    !normalized ||
    (!normalized.startsWith('image/') && !normalized.startsWith('video/'))
  ) {
    throw new Error('Only image and video uploads are supported');
  }

  const payload = await higgsfieldProviderFetch('/files/generate-upload-url', {
    method: 'POST',
    body: JSON.stringify({ content_type: normalized }),
  });

  const uploadUrl = payload?.upload_url;
  const publicUrl = payload?.public_url;
  if (typeof uploadUrl !== 'string' || typeof publicUrl !== 'string') {
    throw new Error('Higgsfield did not return a valid upload URL');
  }

  const rawHeaders = payload?.upload_headers;
  const uploadHeaders: Record<string, string> = {};
  if (
    rawHeaders &&
    typeof rawHeaders === 'object' &&
    !Array.isArray(rawHeaders)
  ) {
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (typeof value === 'string') uploadHeaders[key] = value;
    }
  }

  return {
    uploadUrl,
    uploadHeaders,
    publicUrl,
  };
}

function buildGenjutsuPayload(input: {
  mode: GenjutsuMode;
  model?: string;
  resolution: GenjutsuResolution;
  prompt?: string;
  videoUrl: string;
  imageUrls: string[];
}) {
  if (input.mode !== 'motion-transfer' && input.mode !== 'objects-swap') {
    throw new HiggsfieldPreflightError('Unsupported Genjutsu mode');
  }
  if (!VALID_RESOLUTIONS.has(input.resolution)) {
    throw new HiggsfieldPreflightError('Unsupported resolution');
  }

  const prompt = (input.prompt || '').trim();
  if (prompt.length > 2000) {
    throw new HiggsfieldPreflightError('Prompt is too long');
  }
  if (!isHttpUrl(input.videoUrl)) {
    throw new HiggsfieldPreflightError(
      'A valid uploaded video URL is required'
    );
  }
  if (
    !Array.isArray(input.imageUrls) ||
    input.imageUrls.length < 1 ||
    input.imageUrls.length > 8 ||
    input.imageUrls.some((url) => !isHttpUrl(url))
  ) {
    throw new HiggsfieldPreflightError(
      'Provide between 1 and 8 valid reference image URLs'
    );
  }

  return {
    model: input.model?.trim() || getGenjutsuModel(input.mode),
    body: {
      prompt,
      video_url: input.videoUrl,
      image_urls: input.imageUrls,
      resolution: input.resolution,
    },
  };
}

export type GenjutsuCostEstimate = {
  providerCostUsd: number;
  customerPriceBasisUsd?: number;
  providerCredits: unknown;
  payload: unknown;
  source:
    | 'estimate'
    | 'list_fallback'
    | 'seedance_list_estimate'
    | 'volcengine_seedance_estimate'
    | 'seeapi_seedance_estimate'
    | 'wavespeed_seedance_estimate'
    | 'higgsfield_seedance_token_estimate';
  sourceDurationSeconds?: number;
};

/**
 * Best-effort Higgsfield estimate. Returns null when the response has no
 * usable USD figure (e.g. Genjutsu's `pricing_description` shape).
 */
export async function estimateGenjutsuProviderCost(input: {
  mode: GenjutsuMode;
  model?: string;
  resolution: GenjutsuResolution;
  prompt?: string;
  videoUrl: string;
  imageUrls: string[];
}): Promise<GenjutsuCostEstimate | null> {
  const { model, body } = buildGenjutsuPayload(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ESTIMATE_TIMEOUT_MS);

  try {
    // Estimate is free preflight pricing — always hit the real endpoint.
    const payload = await higgsfieldProviderFetch(
      `/estimate/${model.replace(/^\/+/, '')}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    const providerCostUsd = parseEstimateUsd(payload);
    if (providerCostUsd == null) return null;

    return {
      providerCostUsd,
      providerCredits: payload?.credits ?? null,
      payload,
      source: 'estimate',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Prefer live `/estimate` USD; on timeout, HTTP error, or description-only
 * payloads, fall back to published list rates so generation can proceed.
 */
async function resolveHiggsfieldProviderCost(input: {
  mode: GenjutsuMode;
  model?: string;
  resolution: GenjutsuResolution;
  prompt?: string;
  videoUrl: string;
  imageUrls: string[];
  durationSeconds?: number;
}): Promise<GenjutsuCostEstimate> {
  if (isGenjutsuE2EMockEnabled()) {
    const durationSeconds = normalizeFallbackDurationSeconds(
      input.durationSeconds ?? 4
    );
    const providerCostUsd = estimateGenjutsuListCost({
      durationSeconds,
      resolution: input.resolution,
      model: input.model,
    });
    return {
      providerCostUsd,
      providerCredits: null,
      payload: {
        source: 'e2e_list_estimate',
        durationSeconds,
        resolution: input.resolution,
      },
      source: 'list_fallback',
    };
  }

  try {
    const estimate = await estimateGenjutsuProviderCost(input);
    if (estimate) return estimate;
    console.warn(
      'genjutsu estimate returned no usable USD; using list-rate fallback'
    );
  } catch (error) {
    if (error instanceof HiggsfieldPreflightError) throw error;
    console.warn(
      'genjutsu estimate unavailable, using list-rate fallback:',
      error instanceof Error ? error.message : error
    );
  }

  let fallbackDurationSeconds = input.durationSeconds;
  if (
    typeof fallbackDurationSeconds !== 'number' ||
    !Number.isFinite(fallbackDurationSeconds) ||
    fallbackDurationSeconds <= 0
  ) {
    try {
      fallbackDurationSeconds = await probeSeedanceSourceDurationSeconds(
        input.videoUrl
      );
    } catch (error) {
      console.warn(
        'genjutsu source duration probe unavailable, using conservative fallback:',
        error instanceof Error ? error.message : error
      );
    }
  }

  const durationSeconds = normalizeFallbackDurationSeconds(
    fallbackDurationSeconds
  );
  const providerCostUsd = estimateGenjutsuListCost({
    durationSeconds,
    resolution: input.resolution,
    model: input.model,
  });

  return {
    providerCostUsd,
    providerCredits: null,
    payload: {
      source: 'list_fallback',
      durationSeconds,
      resolution: input.resolution,
      reason: 'estimate_unavailable_or_non_numeric',
    },
    source: 'list_fallback',
  };
}

function getGenjutsuWebhookUrl() {
  const appUrl = envConfigs.app_url?.trim();
  if (!appUrl || !appUrl.startsWith('https://')) return null;
  try {
    return new URL('/api/genjutsu/webhook', appUrl).toString();
  } catch {
    return null;
  }
}

async function submitHiggsfield(input: {
  mode: GenjutsuMode;
  model?: string;
  resolution: GenjutsuResolution;
  prompt?: string;
  videoUrl: string;
  imageUrls: string[];
}) {
  const { model, body } = buildGenjutsuPayload(input);

  if (isGenjutsuE2EMockEnabled()) {
    return {
      requestId: createGenjutsuE2ERequestId(),
      status: 'queued',
    };
  }
  const modelPath = model.replace(/^\/+/, '');
  const webhookUrl = getGenjutsuWebhookUrl();
  const path = webhookUrl
    ? `/${modelPath}?hf_webhook=${encodeURIComponent(webhookUrl)}`
    : `/${modelPath}`;

  const payload = await higgsfieldProviderFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (typeof payload?.request_id !== 'string' || !payload.request_id) {
    throw new Error('Higgsfield did not return a request ID');
  }

  return {
    requestId: payload.request_id as string,
    status: typeof payload.status === 'string' ? payload.status : 'queued',
  };
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export type GenjutsuProviderCostInput = {
  provider: GenjutsuProvider;
  model: string;
  mode: GenjutsuMode;
  resolution: GenjutsuResolution;
  prompt?: string;
  videoUrl: string;
  imageUrls: string[];
  durationSeconds?: number;
  aspectRatio?: HiggsfieldSeedanceAspectRatio;
};

export async function resolveGenjutsuProviderCost(
  input: GenjutsuProviderCostInput
): Promise<GenjutsuCostEstimate> {
  if (isSeedanceFamilyProvider(input.provider)) {
    const sourceDurationSeconds = await probeSeedanceSourceDurationSeconds(
      input.videoUrl
    );

    if (input.provider === 'seedance-volcengine') {
      // Fail configuration errors before reserving user credits or claiming a
      // submission slot. This is a pure preflight and does not call Ark.
      assertVolcengineSeedanceConfigured(input.model);
      return {
        ...estimateVolcengineSeedanceProviderCost({
          mode: input.mode,
          resolution: input.resolution,
          sourceDurationSeconds,
        }),
        sourceDurationSeconds,
      };
    }

    if (input.provider === 'seedance-seeapi') {
      await assertSeeapiSeedanceConfigured(input.model);
      return {
        ...estimateSeeapiSeedanceProviderCost({
          mode: input.mode,
          resolution: input.resolution,
          sourceDurationSeconds,
        }),
        sourceDurationSeconds,
      };
    }

    if (input.provider === 'seedance-wavespeed') {
      await assertWavespeedSeedanceConfigured(input.mode, input.model);
      return {
        ...estimateWavespeedSeedanceProviderCost({
          mode: input.mode,
          resolution: input.resolution,
          sourceDurationSeconds,
        }),
        sourceDurationSeconds,
      };
    }

    if (input.provider === 'seedance-higgsfield') {
      return {
        ...estimateHiggsfieldSeedanceProviderCost({
          resolution: input.resolution,
          aspectRatio: input.aspectRatio || '3:4',
          sourceDurationSeconds,
        }),
        sourceDurationSeconds,
      };
    }

    return {
      ...estimateSeedanceProviderCost({
        resolution: input.resolution,
        sourceDurationSeconds,
      }),
      sourceDurationSeconds,
    };
  }

  return resolveHiggsfieldProviderCost(input);
}

export async function submitGenjutsu(input: {
  provider: GenjutsuProvider;
  model: string;
  mode: GenjutsuMode;
  resolution: GenjutsuResolution;
  prompt?: string;
  videoUrl: string;
  imageUrls: string[];
  endUserId: string;
  sourceDurationSeconds?: number;
  aspectRatio?: HiggsfieldSeedanceAspectRatio;
}) {
  if (isSeedanceFamilyProvider(input.provider)) {
    if (
      typeof input.sourceDurationSeconds !== 'number' ||
      !Number.isFinite(input.sourceDurationSeconds) ||
      input.sourceDurationSeconds <= 0
    ) {
      throw new SeedancePreflightError(
        'Seedance submission is missing the server-validated source duration'
      );
    }

    if (input.provider === 'seedance-volcengine') {
      return submitVolcengineSeedance({
        ...input,
        sourceDurationSeconds: input.sourceDurationSeconds,
      });
    }

    if (input.provider === 'seedance-seeapi') {
      return submitSeeapiSeedance({
        ...input,
        sourceDurationSeconds: input.sourceDurationSeconds,
      });
    }

    if (input.provider === 'seedance-wavespeed') {
      return submitWavespeedSeedance({
        ...input,
        sourceDurationSeconds: input.sourceDurationSeconds,
      });
    }

    if (input.provider === 'seedance-higgsfield') {
      return submitHiggsfieldSeedance({
        ...input,
        aspectRatio: input.aspectRatio || '3:4',
        sourceDurationSeconds: input.sourceDurationSeconds,
      });
    }

    return submitSeedance({
      ...input,
      sourceDurationSeconds: input.sourceDurationSeconds,
    });
  }

  return submitHiggsfield(input);
}

export async function getGenjutsuStatus(input: {
  provider: GenjutsuProvider | string;
  model?: string | null;
  requestId: string;
}) {
  if (input.provider === 'seedance-volcengine') {
    return getVolcengineSeedanceStatus({
      requestId: input.requestId,
    });
  }

  if (input.provider === 'seedance-seeapi') {
    return getSeeapiSeedanceStatus({
      requestId: input.requestId,
    });
  }

  if (input.provider === 'seedance-wavespeed') {
    return getWavespeedSeedanceStatus({
      requestId: input.requestId,
    });
  }

  if (input.provider === 'seedance') {
    const model =
      input.model?.trim() ||
      envConfigs.seedance_genjutsu_model?.trim() ||
      'bytedance/seedance-2.5/us/reference-to-video';

    return getSeedanceStatus({
      model,
      requestId: input.requestId,
    });
  }

  // higgsfield Genjutsu + seedance-higgsfield share the same status API.
  return getHiggsfieldStatus(input.requestId);
}
