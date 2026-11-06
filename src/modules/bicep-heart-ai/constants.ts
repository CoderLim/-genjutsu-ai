import type { GenjutsuMode } from '@/modules/genjutsu/types';
import { BICEP_HEART_PRODUCT } from '@/modules/genjutsu/workflow';

export const BICEP_HEART_AI_PRODUCT_ID = BICEP_HEART_PRODUCT;

export const BICEP_HEART_AI_MODE: GenjutsuMode = 'objects-swap';

/** R2-backed URL used by seal/generate (and optional diagnostics). */
export const BICEP_HEART_AI_TEMPLATE_PATH = `/api/genjutsu/template?product=${BICEP_HEART_AI_PRODUCT_ID}`;

/**
 * Same-origin page demo — do not gate Generate on the R2 redirect player.
 * Seal/generate still use the R2 key via /api/genjutsu/*.
 */
export const BICEP_HEART_AI_TEMPLATE_DISPLAY_PATH =
  '/videos/bicep-heart-tpl.mp4';
export const BICEP_HEART_AI_TEMPLATE_POSTER_PATH =
  '/videos/bicep-heart-tpl-poster.jpg';
/**
 * Pre-trimmed 4s clip for paid Preview uploads when available.
 * Falls back to client trim of the full template if this asset is missing.
 */
export const BICEP_HEART_AI_PREVIEW_CLIP_PATH =
  '/videos/bicep-heart-ai-preview-4s.mp4';

/** ffprobe duration of public/videos/bicep-heart-tpl.mp4 */
export const BICEP_HEART_AI_TEMPLATE_DURATION_SECONDS = 7.041667;

/**
 * Stored on the task for product lock / admin. Higgs Light object-swap does
 * not take Seedance aspectRatio — generate may leave aspect undefined.
 */
export const BICEP_HEART_AI_ASPECT_RATIO = '9:16' as const;

/** First ship: hide 1080p — credit cost exceeds the largest single pack. */
export const BICEP_HEART_AI_RESOLUTIONS = ['480p', '720p'] as const;
export type BicepHeartAiResolution =
  (typeof BICEP_HEART_AI_RESOLUTIONS)[number];
export const BICEP_HEART_AI_DEFAULT_RESOLUTION: BicepHeartAiResolution = '480p';

export function isBicepHeartAiResolution(
  value: unknown
): value is BicepHeartAiResolution {
  return value === '480p' || value === '720p';
}

/**
 * Target mapping only. Complete replacement / preservation live in
 * `buildSeedanceWorkflowPrompt` (and Higgs Light wrappers).
 * @Image 1 = the bicep-heart performer.
 *
 * Match the template beat: sleeve down at first, then roll it up and reveal
 * the flexed bicep for the heart pose — do not demand bicep visibility in
 * every early frame.
 */
export const BICEP_HEART_AI_DEFAULT_PROMPT = [
  'Replace the young woman in the bedroom — long wavy reddish-brown hair, white t-shirt, who rolls up a sleeve then flexes and forms a heart on the bicep — with @Image 1.',
  "Use @Image 1 for that person's complete face, hair, body, and clothing throughout the clip.",
  'Keep the source timing: start with the T-shirt sleeve covering the arm, then roll the sleeve up, flex so the bicep is visibly peaked, and form a heart with both hands on that flexed bicep (the bicep is the bottom of the heart).',
  'Do not skip the sleeve-roll or the bicep reveal. Do not change the bedroom, bed, lighting, or camera path.',
].join('\n\n');

export const LEGACY_BICEP_HEART_AI_PROMPTS = [] as const;
