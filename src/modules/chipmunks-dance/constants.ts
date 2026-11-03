import type { GenjutsuMode } from '@/modules/genjutsu/types';
import { CHIPMUNKS_DANCE_PRODUCT } from '@/modules/genjutsu/workflow';

export const CHIPMUNKS_DANCE_PRODUCT_ID = CHIPMUNKS_DANCE_PRODUCT;

export const CHIPMUNKS_DANCE_MODE: GenjutsuMode = 'objects-swap';

/** R2-backed URL used by seal/generate (and optional diagnostics). */
export const CHIPMUNKS_DANCE_TEMPLATE_PATH = `/api/genjutsu/template?product=${CHIPMUNKS_DANCE_PRODUCT_ID}`;

/**
 * Same-origin page demo — do not gate Generate on the R2 redirect player.
 * Seal/generate still use the R2 key via /api/genjutsu/*.
 */
export const CHIPMUNKS_DANCE_TEMPLATE_DISPLAY_PATH =
  '/videos/chipmunks-dance-tpl.mp4';
export const CHIPMUNKS_DANCE_TEMPLATE_POSTER_PATH =
  '/videos/chipmunks-dance-tpl-poster.jpg';
/**
 * Pre-trimmed 4s clip for paid Preview uploads when available.
 * Falls back to client trim of the full template if this asset is missing.
 */
export const CHIPMUNKS_DANCE_PREVIEW_CLIP_PATH =
  '/videos/chipmunks-dance-preview-4s.mp4';

/** ffprobe duration of public/videos/chipmunks-dance-tpl.mp4 */
export const CHIPMUNKS_DANCE_TEMPLATE_DURATION_SECONDS = 15;

/**
 * Stored on the task for product lock / admin. Higgs Light object-swap does
 * not take Seedance aspectRatio — generate may leave aspect undefined.
 */
export const CHIPMUNKS_DANCE_ASPECT_RATIO = '9:16' as const;

/** First ship: hide 1080p — credit cost exceeds the largest single pack. */
export const CHIPMUNKS_DANCE_RESOLUTIONS = ['480p', '720p'] as const;
export type ChipmunksDanceResolution =
  (typeof CHIPMUNKS_DANCE_RESOLUTIONS)[number];
export const CHIPMUNKS_DANCE_DEFAULT_RESOLUTION: ChipmunksDanceResolution =
  '480p';

export function isChipmunksDanceResolution(
  value: unknown
): value is ChipmunksDanceResolution {
  return value === '480p' || value === '720p';
}

/**
 * Target mapping only. Complete replacement / preservation live in
 * `buildSeedanceWorkflowPrompt` (and Higgs Light wrappers). Slot order:
 * left → center → right (@Image 1/2/3) from the opening line-up.
 *
 * Opening cast cues (identity across handoffs):
 * - Left: boy in black Adidas hoodie
 * - Center/front: girl in bright green "LUCKY" shirt (opens the routine)
 * - Right: girl in dark graphic sweatshirt
 */
export const CHIPMUNKS_DANCE_DEFAULT_PROMPT = [
  'Replace all three dancers in the source video with the people from the reference images.',
  '',
  'Reference 1 replaces the left dancer in the opening line-up (boy in the black Adidas hoodie, standing slightly behind on the left).',
  'Reference 2 replaces the center / front dancer who opens the routine (girl in the bright green "LUCKY" shirt with a shamrock, grey sweatpants, hands on hips at the start).',
  'Reference 3 replaces the right dancer in the opening line-up (girl in the dark graphic sweatshirt, standing slightly behind on the right).',
  '',
  'Keep each reference identity — face, hair, body, clothing, and proportions — on its assigned dancer through every handoff, even when someone steps to the front or slides back.',
  'Always show three different people: never put one reference on two dancers, and never clone or blend identities.',
  '',
  'Preserve the wooden deck, white railing, trees, sky, camera framing, choreography, handoff timing, and the final rush toward the camera.',
].join('\n');

export const LEGACY_CHIPMUNKS_DANCE_PROMPTS = [] as const;
