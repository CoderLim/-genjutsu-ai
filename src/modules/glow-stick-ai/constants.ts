import type {
  GenjutsuMode,
  GenjutsuResolution,
} from '@/modules/genjutsu/types';
import { GLOW_STICK_PRODUCT } from '@/modules/genjutsu/workflow';

export const GLOW_STICK_AI_PRODUCT_ID = GLOW_STICK_PRODUCT;

export const GLOW_STICK_AI_MODE: GenjutsuMode = 'objects-swap';

/** R2-backed URL used by seal/generate (and optional diagnostics). */
export const GLOW_STICK_AI_TEMPLATE_PATH = `/api/genjutsu/template?product=${GLOW_STICK_AI_PRODUCT_ID}`;

/**
 * Same-origin page demo — do not gate Generate on the R2 redirect player.
 * Seal/generate still use the R2 key via /api/genjutsu/*.
 */
export const GLOW_STICK_AI_TEMPLATE_DISPLAY_PATH = '/videos/glow-stick-tpl.mp4';
export const GLOW_STICK_AI_TEMPLATE_POSTER_PATH =
  '/videos/glow-stick-tpl-poster.jpg';
/**
 * Pre-trimmed 4s clip for paid Preview uploads when available.
 * Falls back to client trim of the full template if this asset is missing.
 */
export const GLOW_STICK_AI_PREVIEW_CLIP_PATH =
  '/videos/glow-stick-ai-preview-4s.mp4';

/** ffprobe duration of public/videos/glow-stick-tpl.mp4 */
export const GLOW_STICK_AI_TEMPLATE_DURATION_SECONDS = 10.030998;

/**
 * Stored on the task for product lock / admin. Higgs Light object-swap does
 * not take Seedance aspectRatio — generate may leave aspect undefined.
 */
export const GLOW_STICK_AI_ASPECT_RATIO = '9:16' as const;

/** First ship: hide 1080p — credit cost exceeds the largest single pack. */
export const GLOW_STICK_AI_RESOLUTIONS = ['480p', '720p'] as const;
export type GlowStickAiResolution = (typeof GLOW_STICK_AI_RESOLUTIONS)[number];
export const GLOW_STICK_AI_DEFAULT_RESOLUTION: GenjutsuResolution = '480p';

export function isGlowStickAiResolution(
  value: unknown
): value is GlowStickAiResolution {
  return value === '480p' || value === '720p';
}

/**
 * Target mapping only. Complete replacement / preservation live in
 * `buildSeedanceWorkflowPrompt` (and Higgs Light wrappers). Slot order:
 * left → center → right (@Image 1/2/3).
 */
export const GLOW_STICK_AI_DEFAULT_PROMPT = [
  'Replace all three dancers in the source video with the people from the reference images.',
  '',
  'Reference 1 replaces the left dancer (leftmost person holding glow sticks).',
  'Reference 2 replaces the center dancer (adult woman in the middle with long dark free-flowing hair, light blue button-down shirt, and light jeans, holding two glow sticks) — do not keep her face, hair, shirt, jeans, or body.',
  'Reference 3 replaces the right dancer (rightmost person holding glow sticks).',
  '',
  'Preserve each reference identity — face, hair, body, clothing, and proportions — throughout the clip.',
  'Do not leave the original center woman. Do not swap or blend the three identities.',
  '',
  'Keep the glow sticks, light trails, wall, floor reflections, camera path, dance moves, and sync timing from the source video.',
].join('\n');

export const LEGACY_GLOW_STICK_AI_PROMPTS = [] as const;
