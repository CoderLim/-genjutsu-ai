# Wassup in a Minute AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship `/wassup-in-a-minute-ai/` — sparse left/center/right photo slots against a fixed outdoor sway template, on homepage Genjutsu Light objects-swap (`/api/genjutsu/*`), with rewritten SEO.

**Architecture:** Clone tiny-desk / glow-stick product pattern: module (`constants` / `assert` / `provider` / `seo-pricing`) + generator panel with optional L/C/R slots + SEO sections + thin route. Register product on Genjutsu allowlist. Full runs: server R2 template + 1–3 images; preview: trimmed ≤4s + filled images @ 480p.

**Tech Stack:** TanStack Start, genjutsu modules, Paraglide i18n, `node --import tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-10-wassup-in-a-minute-ai-design.md`

---

## File map

| File                                                                   | Responsibility                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/modules/genjutsu/workflow.ts` / `types.ts`                        | Product id + allowlist                                                 |
| `src/modules/wassup-in-a-minute-ai/*`                                  | Constants, sparse prompt builder, assert, provider, seo-pricing, tests |
| `src/config/index.ts`                                                  | Optional R2 template key env                                           |
| `src/modules/genjutsu/storage.ts`                                      | Template key + ensure cases                                            |
| `src/routes/api/genjutsu/{attempt,upload-url,seal-inputs,generate}.ts` | Product branches                                                       |
| `public/videos/wassup-in-a-minute-ai-tpl.mp4` (+ poster, preview-4s)   | Local assets                                                           |
| `WassupInAMinuteGeneratorPanel.tsx` / `WassupInAMinuteSeoSections.tsx` | UI + SEO                                                               |
| `src/routes/wassup-in-a-minute-ai.tsx`                                 | Page                                                                   |
| `motion-templates.ts`, sitemap, llms, trend-page footers               | Discovery + backlinks                                                  |
| `messages/*.json`                                                      | `site.wassup.*` + template title keys                                  |

---

### Task 1: Assets

- [x] Re-encode source to `public/videos/wassup-in-a-minute-ai-tpl.mp4` (~5–12MB, keep 16:9)
- [x] Poster from early frame; optional `wassup-in-a-minute-ai-preview-4s.mp4`
- [x] Record ffprobe duration for constants

### Task 2: Module + tests

- [x] `constants.ts` — product lock, slot ids, `buildWassupInAMinutePrompt`, all 7 subset prompts
- [x] `assert.ts` / `provider.ts` / `seo-pricing.ts` + unit tests
- [x] Run module tests

### Task 3: Genjutsu wiring

- [x] workflow + types + storage + config env key
- [x] attempt / upload-url / seal-inputs / generate branches (mirror glow-stick + tiny-desk image-count flexibility)
- [x] product-provider + product-template-key tests

### Task 4: Panel + route + SEO

- [x] Generator panel (glow-stick 3-slot UI, slots optional ≥1)
- [x] SeoSections + route + JSON-LD
- [x] en SEO strings; all locales template title/CTA

### Task 5: Discovery + backlinks

- [x] MOTION_TEMPLATES href card
- [x] sitemap / llms
- [x] Explore-more / footer links on listed trend pages + homepage block if needed

### Task 6: R2 + verify + build

- [x] `pnpm r2:put` + `pnpm r2:verify-templates` (user creds if needed)
- [x] `pnpm build`
- [x] Commit in logical chunks
