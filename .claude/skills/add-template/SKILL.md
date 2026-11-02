---
name: add-template
description: >-
  Add a homepage Genjutsu motion template (gallery Apply entry) from a display
  name + template video URL. Downloads the clip, probes aspect, extracts frames,
  writes an objects-swap prompt from the video, prepends MOTION_TEMPLATES, and
  adds i18n titles. Use when the user says add template / 加模版 / homepage
  template / motion template, or provides a template name plus a video/Reel URL
  for the homepage generator gallery.
argument-hint: "<template name> <video-url>"
user-invocable: true
---

# Add homepage motion template — $ARGUMENTS

Add a **homepage Apply** template (fills GeneratorPanel). Default: no dedicated product page, no R2 template key, no `/api/<preset>/` fork. Higgsfield Genjutsu stays on `/api/genjutsu/*`.

## Inputs

From `$ARGUMENTS` or the user message, require:

1. **Template name** — display title (e.g. `Closing Door Prank`, `Having It All`)
2. **Video URL** — direct `.mp4` preferred; Instagram Reel URL allowed (see Download)

Optional (ask only if ambiguous after watching frames):

- Reference mapping (`@Image 1` / `@Image 2` roles)
- Mode override (`objects-swap` default; `motion-transfer` only if user asks)

## Naming

| Field | Rule | Example |
|-------|------|---------|
| `id` / slug | kebab-case from name | `closing-door-prank` |
| `titleKey` | `site.templates.` + slug with `_` | `site.templates.closing_door_prank` |
| mp4 | `public/videos/<slug>-tpl.mp4` | |
| poster | `public/videos/<slug>-tpl-poster.jpg` | |
| paths in TS | `/videos/<slug>-tpl.mp4` + poster | |

Newest templates go **first** in `MOTION_TEMPLATES`.

## Workflow

### 1. Prepare assets

From repo root:

```bash
python3 .claude/skills/add-template/scripts/prepare_assets.py \
  --name "<Template Name>" \
  --url "<direct-mp4-url>"
```

Script prints JSON: `slug`, `titleKey`, `aspect`, `frames`, paths, defaults (`objects-swap` / `480p`).

**Instagram / non-direct URL:** try `opencli instagram download "<url>" --output public/videos/<slug>-tpl.mp4 -f json`. If that fails, capture via browser (MediaRecorder / CDP export), write mp4, then run prepare with a `file://` path or skip download and only extract frames/poster from the local mp4 (extend command: copy file into place, then re-run probe/frames by calling ffmpeg as in the script).

### 2. Analyze frames → prompt

Read the frame JPEGs under `framesDir` from the script output (use the Read tool on images).

Write the prompt from the clip — roles, beats, what to preserve. Patterns: [references/prompt-patterns.md](references/prompt-patterns.md).

If the poster frame is weak, replace poster with a clearer still (`cp` a frame or `ffmpeg -ss …`).

### 3. Prepend `MOTION_TEMPLATES`

Edit `src/components/landing/motion-templates.ts`. Insert at the **top** of the array:

```ts
{
  id: '<slug>',
  titleKey: 'site.templates.<slug_with_underscores>',
  poster: '/videos/<slug>-tpl-poster.jpg',
  sourceVideo: '/videos/<slug>-tpl.mp4',
  prompt: [ /* lines joined with \\n */ ].join('\\n'),
  mode: 'objects-swap',
  resolution: DEFAULT_OBJECTS_RESOLUTION,
  aspect: 'portrait' | 'landscape', // from probe: height>width → portrait
},
```

Do **not** set `href` (that makes a link-only card). Dedicated landings are out of scope for this skill unless the user explicitly asks.

### 4. i18n

Add to **every** `messages/*.json` (currently: `en`, `de`, `es`, `fr`, `ja`, `ko`, `pt-BR`):

```json
"site.templates.<slug_with_underscores>": "<Template Name>",
```

Insert near other `site.templates.*` keys (e.g. before the previous newest template). Keep titles trend/product-facing — no upstream model/provider names.

Validate JSON parses after edits.

### 5. Verify

- Files exist under `public/videos/`
- Entry is first Apply template in `MOTION_TEMPLATES`
- Lint clean on the TS file
- Tell the user to refresh the homepage and Use template

## Out of scope (unless user asks)

- Dedicated product page (`href`, SEO route, module under `src/modules/…`)
- R2 `pnpm r2:put` / `verify-templates` for fixed server templates
- Parallel `/api/<preset>/upload-url|generate` chains

## Checklist

- [ ] Video + poster in `public/videos/`
- [ ] Aspect matches probe
- [ ] Prompt matches frame analysis + mapping
- [ ] `MOTION_TEMPLATES` prepended (Apply, not href)
- [ ] All locale JSON keys added
- [ ] No provider names in customer-facing title/prompt copy
