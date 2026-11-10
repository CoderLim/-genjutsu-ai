import type {
  GenjutsuMode,
  GenjutsuResolution,
} from '@/modules/genjutsu/types';
import { WASSUP_IN_A_MINUTE_AI_PRODUCT } from '@/modules/genjutsu/workflow';

export const WASSUP_IN_A_MINUTE_AI_PRODUCT_ID = WASSUP_IN_A_MINUTE_AI_PRODUCT;

export const WASSUP_IN_A_MINUTE_AI_MODE: GenjutsuMode = 'objects-swap';

/** R2-backed URL used by seal/generate (and optional diagnostics). */
export const WASSUP_IN_A_MINUTE_AI_TEMPLATE_PATH = `/api/genjutsu/template?product=${WASSUP_IN_A_MINUTE_AI_PRODUCT_ID}`;

/**
 * Same-origin page demo — do not gate Generate on the R2 redirect player.
 * Seal/generate still use the R2 key via /api/genjutsu/*.
 */
export const WASSUP_IN_A_MINUTE_AI_TEMPLATE_DISPLAY_PATH =
  '/videos/wassup-in-a-minute-ai-tpl.mp4';
export const WASSUP_IN_A_MINUTE_AI_TEMPLATE_POSTER_PATH =
  '/videos/wassup-in-a-minute-ai-tpl-poster.jpg';
/**
 * Pre-trimmed 4s clip for paid Preview uploads when available.
 * Falls back to client trim of the full template if this asset is missing.
 */
export const WASSUP_IN_A_MINUTE_AI_PREVIEW_CLIP_PATH =
  '/videos/wassup-in-a-minute-ai-preview-4s.mp4';

/** ffprobe duration of public/videos/wassup-in-a-minute-ai-tpl.mp4 */
export const WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS = 15.022993;

/**
 * Stored on the task for product lock / admin. Higgs Light object-swap does
 * not take Seedance aspectRatio — generate may leave aspect undefined.
 */
export const WASSUP_IN_A_MINUTE_AI_ASPECT_RATIO = '16:9' as const;

export const WASSUP_IN_A_MINUTE_AI_RESOLUTIONS = ['480p', '720p'] as const;
export type WassupInAMinuteAiResolution =
  (typeof WASSUP_IN_A_MINUTE_AI_RESOLUTIONS)[number];
export const WASSUP_IN_A_MINUTE_AI_DEFAULT_RESOLUTION: GenjutsuResolution =
  '480p';

export function isWassupInAMinuteAiResolution(
  value: unknown
): value is WassupInAMinuteAiResolution {
  return value === '480p' || value === '720p';
}

/** UI + prompt order for display: left | center | right. */
export const WASSUP_IN_A_MINUTE_AI_SLOT_IDS = [
  'left',
  'center',
  'right',
] as const;
export type WassupInAMinuteAiSlotId =
  (typeof WASSUP_IN_A_MINUTE_AI_SLOT_IDS)[number];

export const WASSUP_IN_A_MINUTE_AI_MIN_IMAGES = 1 as const;
export const WASSUP_IN_A_MINUTE_AI_MAX_IMAGES = 3 as const;

/**
 * UI slots map to stable cast identities (first-screen L|C|R lineup), not to
 * screen coordinates. Positions change across cuts — identify by look only.
 */
const SLOT_IDENTITY: Record<
  WassupInAMinuteAiSlotId,
  { name: string; cue: string }
> = {
  left: {
    name: 'Person A',
    cue: 'dark curly hair, plain black t-shirt, dark pants, red sneakers when feet are visible',
  },
  center: {
    name: 'Person B',
    cue: 'wavy brown hair, light beard, sage/grey-green crewneck sweatshirt, light sweatpants',
  },
  right: {
    name: 'Person C',
    cue: 'short blonde hair, beige/tan fuzzy knit sweater, plaid trousers or plaid shorts',
  },
};

export function isWassupInAMinuteAiSlotId(
  value: unknown
): value is WassupInAMinuteAiSlotId {
  return value === 'left' || value === 'center' || value === 'right';
}

/**
 * Normalize filled slots: unique, only valid ids, ordered left → center → right
 * (matches upload `images[]` and `@ImageN` numbering).
 */
export function normalizeWassupInAMinuteAiFilledSlots(
  filled: readonly unknown[]
): WassupInAMinuteAiSlotId[] {
  const seen = new Set<WassupInAMinuteAiSlotId>();
  for (const slot of filled) {
    if (!isWassupInAMinuteAiSlotId(slot)) {
      throw new Error('Wassup in a Minute AI slot id is invalid');
    }
    if (seen.has(slot)) {
      throw new Error('Wassup in a Minute AI slot ids must be unique');
    }
    seen.add(slot);
  }
  if (seen.size < WASSUP_IN_A_MINUTE_AI_MIN_IMAGES) {
    throw new Error('Wassup in a Minute AI requires at least one photo slot');
  }
  if (seen.size > WASSUP_IN_A_MINUTE_AI_MAX_IMAGES) {
    throw new Error('Wassup in a Minute AI accepts at most three photo slots');
  }
  return WASSUP_IN_A_MINUTE_AI_SLOT_IDS.filter((id) => seen.has(id));
}

/**
 * Fixed prompt for a sparse subset of L/C/R slots.
 * `@ImageN` follows left → center → right among filled slots only.
 *
 * Multi-shot: cast blocking changes between cuts (wide / close-up / diagonal).
 * Map by identity cues, then keep that mapping in every shot — never by
 * momentary left/center/right screen position.
 */
export function buildWassupInAMinuteAiPrompt(
  filled: readonly WassupInAMinuteAiSlotId[]
): string {
  const slots = normalizeWassupInAMinuteAiFilledSlots(filled);
  const lines = [
    'The source video has multiple camera cuts. Standing order and who is closest to camera change between shots — do NOT identify people by left/center/right screen position.',
    'Identify each original cast member by appearance only, then replace them one-to-one with the matching reference wherever they appear (wide shots, close-ups, foreground, background, any framing).',
    '',
    'ORIGINAL CAST CUES (identify who to replace; do not copy these looks onto the replacements):',
  ];
  for (const slot of WASSUP_IN_A_MINUTE_AI_SLOT_IDS) {
    const { name, cue } = SLOT_IDENTITY[slot];
    lines.push(`- ${name}: ${cue}.`);
  }
  lines.push('', 'ROLE MAPPING (same identity through every cut):');
  slots.forEach((slot, index) => {
    const { name } = SLOT_IDENTITY[slot];
    lines.push(`- ${name} → @Image${index + 1} in every shot.`);
  });
  for (const slot of WASSUP_IN_A_MINUTE_AI_SLOT_IDS) {
    if (!slots.includes(slot)) {
      const { name } = SLOT_IDENTITY[slot];
      lines.push(
        `- Keep the original ${name} unchanged in every shot (do not replace them).`
      );
    }
  }
  lines.push(
    '',
    'Keep the grassy hillside, lake, mountains, overcast outdoor lighting, synchronized sway, camera path, framing, cuts, and timing from the source clip.',
    'Preserve each reference identity — face, hair, body, clothing, and proportions — across all cuts. Do not merge, swap, or blend identities. Do not invent extra people.'
  );
  const prompt = lines.join('\n');
  if (prompt.length > 2000) {
    throw new Error(
      'Wassup in a Minute AI prompt exceeds Genjutsu Light 2000-char cap'
    );
  }
  return prompt;
}

/** All non-empty subsets in stable key order for allowlists / docs. */
function allNonEmptySlotSubsets(): WassupInAMinuteAiSlotId[][] {
  const ids = WASSUP_IN_A_MINUTE_AI_SLOT_IDS;
  const out: WassupInAMinuteAiSlotId[][] = [];
  for (let mask = 1; mask < 1 << ids.length; mask += 1) {
    const subset: WassupInAMinuteAiSlotId[] = [];
    for (let i = 0; i < ids.length; i += 1) {
      if (mask & (1 << i)) subset.push(ids[i]!);
    }
    out.push(subset);
  }
  return out;
}

export const WASSUP_IN_A_MINUTE_AI_PROMPTS_BY_SLOTS = Object.fromEntries(
  allNonEmptySlotSubsets().map((slots) => {
    const key = slots.join('+');
    return [key, buildWassupInAMinuteAiPrompt(slots)] as const;
  })
) as Record<string, string>;

export const WASSUP_IN_A_MINUTE_AI_ALLOWED_PROMPTS = Object.values(
  WASSUP_IN_A_MINUTE_AI_PROMPTS_BY_SLOTS
);

/** Full three-person cast — default for docs / UI copy when all slots filled. */
export const WASSUP_IN_A_MINUTE_AI_DEFAULT_PROMPT =
  WASSUP_IN_A_MINUTE_AI_PROMPTS_BY_SLOTS['left+center+right']!;

export const LEGACY_WASSUP_IN_A_MINUTE_AI_PROMPTS = [] as const;

export function resolveWassupInAMinuteAiSlotsFromPrompt(
  prompt: string
): WassupInAMinuteAiSlotId[] | null {
  for (const [key, value] of Object.entries(
    WASSUP_IN_A_MINUTE_AI_PROMPTS_BY_SLOTS
  )) {
    if (value === prompt) {
      return key.split('+') as WassupInAMinuteAiSlotId[];
    }
  }
  return null;
}
