import type {
  GenjutsuMode,
  GenjutsuResolution,
} from '@/modules/genjutsu/types';
import { TINY_DESK_AI_PRODUCT } from '@/modules/genjutsu/workflow';

export const TINY_DESK_AI_PRODUCT_ID = TINY_DESK_AI_PRODUCT;

export const TINY_DESK_AI_MODE: GenjutsuMode = 'objects-swap';

/** R2-backed URL used by seal/generate (and optional diagnostics). */
export const TINY_DESK_AI_TEMPLATE_PATH = `/api/genjutsu/template?product=${TINY_DESK_AI_PRODUCT_ID}`;
/**
 * Same-origin page demo — do not gate Generate on the R2 redirect player.
 * Seal/generate still use the R2 key via /api/genjutsu/*.
 */
export const TINY_DESK_AI_TEMPLATE_DISPLAY_PATH =
  '/videos/tiny-desk-ai-tpl.mp4';
export const TINY_DESK_AI_TEMPLATE_POSTER_PATH =
  '/videos/tiny-desk-ai-tpl-poster.jpg';
/**
 * Pre-trimmed 4s clip for paid Preview uploads.
 * Avoids client ffmpeg.wasm re-encode of the full ~15s template when available.
 */
export const TINY_DESK_AI_PREVIEW_CLIP_PATH =
  '/videos/tiny-desk-ai-preview-4s.mp4';

/** ffprobe duration of public/videos/tiny-desk-ai-tpl.mp4 (first 15s of IG reel De3d3xJR_vL). */
export const TINY_DESK_AI_TEMPLATE_DURATION_SECONDS = 15;

/**
 * Stored on the task for product lock / admin. Higgs Light object-swap does
 * not take Seedance aspectRatio — generate may leave aspect undefined for
 * the provider body while the task still records 9:16.
 */
export const TINY_DESK_AI_ASPECT_RATIO = '9:16' as const;

export const TINY_DESK_AI_RESOLUTIONS = ['480p', '720p'] as const;
export type TinyDeskAiResolution = (typeof TINY_DESK_AI_RESOLUTIONS)[number];
export const TINY_DESK_AI_DEFAULT_RESOLUTION: GenjutsuResolution = '480p';

export function isTinyDeskAiResolution(
  value: unknown
): value is TinyDeskAiResolution {
  return value === '480p' || value === '720p';
}

/** Contiguous uploads from lead → sax. Max five people in the desk scene. */
export const TINY_DESK_AI_MIN_IMAGES = 1 as const;
export const TINY_DESK_AI_MAX_IMAGES = 5 as const;

/**
 * Upload / prompt order (contiguous fill):
 * 1 lead · 2 backing L · 3 backing R · 4 harmony close-up · 5 sax
 */
export const TINY_DESK_AI_SLOT_IDS = [
  'lead',
  'backingLeft',
  'backingRight',
  'harmony',
  'sax',
] as const;
export type TinyDeskAiSlotId = (typeof TINY_DESK_AI_SLOT_IDS)[number];

/**
 * UI layout (stage positions): Back L · Lead · Back R on row 1,
 * then Harmony · Sax — matches the wide band framing.
 */
export const TINY_DESK_AI_SLOT_DISPLAY_IDS = [
  'backingLeft',
  'lead',
  'backingRight',
  'harmony',
  'sax',
] as const satisfies readonly TinyDeskAiSlotId[];

/**
 * Short Higgs Light mapping lines. Cues locate ORIGINAL performers only.
 * Full five-person prompt matches the homepage-safe Light wording
 * (well under the 2000-char Genjutsu Light cap).
 */
const ROLE_LINES = [
  'Center lead at red keyboard (brown hair, black suit, thin black tie) → @Image1',
  'Backing left (shaved head, navy suit, blue patterned tie) → @Image2',
  'Backing right (shaved head, grey pinstripe, often sunglasses) → @Image3',
  'Silver-haired close-up vocalist (windowpane jacket, striped tie) → @Image4 — different from the center lead',
  'Sax player (glasses, red-black scarf) → @Image5',
] as const;

function buildPromptForImageCount(count: number): string {
  const n = Math.min(
    TINY_DESK_AI_MAX_IMAGES,
    Math.max(TINY_DESK_AI_MIN_IMAGES, Math.floor(count))
  );
  const lines = [
    'Replace these performers with the reference images (one-to-one):',
    ...ROLE_LINES.slice(0, n).map((line) => `- ${line}`),
    'Keep mapping across cuts. Do not merge identities. Keep desk, band motion, camera, and lighting.',
  ];
  if (n < TINY_DESK_AI_MAX_IMAGES) {
    lines.push('Leave other performers unchanged.');
  }
  return lines.join('\n');
}

/**
 * Fixed prompts for each allowed cast size (1–5 contiguous slots from lead).
 * Client must send the prompt that matches the uploaded image count.
 */
export const TINY_DESK_AI_PROMPTS_BY_COUNT = {
  1: buildPromptForImageCount(1),
  2: buildPromptForImageCount(2),
  3: buildPromptForImageCount(3),
  4: buildPromptForImageCount(4),
  5: buildPromptForImageCount(5),
} as const;

export type TinyDeskAiImageCount = keyof typeof TINY_DESK_AI_PROMPTS_BY_COUNT;

export function isTinyDeskAiImageCount(
  value: unknown
): value is TinyDeskAiImageCount {
  return (
    value === 1 || value === 2 || value === 3 || value === 4 || value === 5
  );
}

export function buildTinyDeskAiPrompt(imageCount: number): string {
  if (!isTinyDeskAiImageCount(imageCount)) {
    throw new Error('Tiny Desk AI requires 1–5 reference images');
  }
  return TINY_DESK_AI_PROMPTS_BY_COUNT[imageCount];
}

/** Full five-person cast — default for docs / UI copy. */
export const TINY_DESK_AI_DEFAULT_PROMPT = TINY_DESK_AI_PROMPTS_BY_COUNT[5];

/**
 * Earlier solo prompt (silver-hair-as-lead). Still accepted so in-flight
 * attempts are not rejected. Must stay under Genjutsu Light's 2000-char cap.
 */
export const LEGACY_TINY_DESK_AI_PROMPTS = [
  [
    'In the original source video, identify the lead singer: the older man with silver-white hair, a grey checkered or windowpane suit jacket, a white dress shirt, and a pink-black-white striped necktie. He appears in the mid-clip close-up / profile performance shots (singing, fist pump, laughing).',
    '',
    'Replace that lead singer completely with Reference 1 (@Image 1) wherever he appears — face, hair, body, and clothing.',
    '',
    'Do NOT replace anyone else:',
    '- the keyboard player at the red keyboard (brown hair, black suit, thin black tie, mic in front);',
    '- the saxophone player (glasses, red-and-black scarf);',
    '- the backing performers behind the desk.',
    '',
    'Preserve the Tiny Desk office shelves, desk edge, microphones, instruments, lighting, camera cuts, framing, motion, and timing throughout the clip.',
  ].join('\n'),
] as const;
