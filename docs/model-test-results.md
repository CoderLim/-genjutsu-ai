# Model test results

Running log of provider/model qualitative tests for Genjutsu AI workflows.
Append new entries at the top of the **Log** section. Do not overwrite history.

Related:

- Seedance rollout matrix: [seedance-workflow.md](./seedance-workflow.md)
- Volcengine migration smoke fields: [seedance-volcengine-migration-plan.md](./seedance-volcengine-migration-plan.md)
- Internal H3 lab UI: `/h3-lab` (noindex)

## What to record

| Field            | Notes                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Date             | Local calendar date of the run                                               |
| Model / endpoint | Fal or Ark model id + docs link                                              |
| Surface          | e.g. `/h3-lab`, Genjutsu generator, Hotel Lobby                              |
| Scenario         | Short name + what Genjutsu workflow it approximates                          |
| Inputs           | Source video + reference count; asset nicknames if useful                    |
| Prompt style     | Raw user prompt vs Genjutsu-style system wrapper (and which provider tokens) |
| Verdict          | `pass` / `fail` / `mixed`                                                    |
| Findings         | Motion fidelity, identity, unintended edits, latency/cost if known           |
| Evidence         | Fal/Ark request id + dashboard URL; local generation id if any               |

## Log

### 2026-11-03 — Kling O3 standard — Glow Stick 3-Element center swap fails

Product smoke on `/glow-stick-ai` (Hotel Lobby preset `glow-stick`). Left and right dancers swapped to uploaded Elements; **center dancer repeatedly stayed the original** (adult woman, light blue button-down, long dark hair, light jeans).

|                  |                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Model**        | [`fal-ai/kling-video/o3/standard/video-to-video/edit`](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/edit)  |
| **Surface**      | `/glow-stick-ai` → `HotelLobbyGeneratorPanel` / `/api/hotel-lobby/*` (`presetId=glow-stick`)                                      |
| **Scenario**     | Three-person glow-stick sync dance — `@Element1` left, `@Element2` center, `@Element3` right                                      |
| **Inputs**       | Fixed template `hotel-lobby/templates/glow-stick-v1.mp4` (~10s · 720×1280) + **3** frontal reference photos (one per dancer)      |
| **Prompt style** | Short Kling-style imperatives (`@Video1` / `@ElementN`); first ship named left/center/right without original-look cues for center |
| **Verdict**      | **fail** (center); left/right **pass** on the same run                                                                            |

**Findings**

1. With **three Elements**, Kling O3 standard often **fails to replace the middle subject** while correctly swapping the side subjects.
2. Center original is the strongest visual anchor in this template (largest motion, distinctive blue shirt / long hair / jeans) — soft “change the center dancer” wording is not enough.
3. Same class of risk as Hotel Lobby’s old “second Element sticks” issue: multi-subject edits leave the most salient original performer in place unless the prompt **names original cues** and says **do not keep** face/hair/clothes/body.

**Mitigation tried (code)**

- Hardened `buildGlowStickPrompt` (preset `version: 2`): name center original look explicitly; “replace all three / never original cast”; “do not leave the original center woman”; put center swap before left/right.
- Prefer a clear frontal `@Element2` photo for the center slot.
- Follow-up: re-run after prompt v2; if still fail, consider Kling O3 pro, or product UX that reduces to 1–2 Elements / different staging.

**Evidence**

- Qualitative product run; user screenshot of output with center original boxed. Fal request id not recorded for this session.

**Follow-up (same day):** `/glow-stick-ai` migrated off Kling O3 / `/api/hotel-lobby/*` onto homepage Genjutsu Light (`/api/genjutsu/*`, `higgsfield/genjutsu-light/object-swap`, product `glow-stick`, 3 refs). Re-test center swap on Light before judging the Kling failure fixed.

### 2026-10-11 — Wan 2.2 Animate / Wan VACE / Kling O3 — character identity bake-off

Comparative qualitative test focused on **人物保持** (identity / face consistency) for Genjutsu-style character swap / reference-driven edit. Exact Fal request ids not recorded.

|                  |                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Models**       | Wan 2.2 Animate; Wan VACE; Kling O3 standard; Kling O3 pro (not run)                                                      |
| **Surface**      | Ad-hoc / lab comparison (not tied to a single product page)                                                               |
| **Scenario**     | Character identity preservation under reference-image Elements                                                            |
| **Inputs**       | Per-model reference Element images; Kling path stressed single vs multi-angle Element framing                             |
| **Prompt style** | Not recorded                                                                                                              |
| **Verdict**      | Wan 2.2 Animate / Wan VACE: **fail**; Kling O3 standard: **mixed** (usable under constraints); Kling O3 pro: **untested** |

**Findings**

1. **Wan 2.2 Animate — fail:** character identity preservation poorest among models tried; not usable for Genjutsu-style person keep.
2. **Wan VACE — fail:** same class of failure — **人物保持最差** tier with Wan 2.2 Animate; reject for identity-critical workflows.
3. **Kling O3 standard — mixed / usable with constraints:** overall identity quality acceptable **if each Element has only one image**, preferably a **single frontal portrait**. Do **not** put multiple angles of the same person into one Element image (collage / multi-view sheet) — that hurts consistency.
4. **Kling O3 pro — untested:** expected to beat O3 standard on identity, but no run in this bake-off.

**Implication**

- Drop Wan 2.2 Animate and Wan VACE as candidates for Genjutsu / Hotel Lobby–style person swap until a stronger identity result appears.
- Prefer Kling O3 standard with **one frontal ref per Element**; keep multi-angle refs as separate Elements (or skip) rather than one collage.
- Next: run Kling O3 pro on the same inputs to confirm the expected gain.

**Evidence**

- Qualitative only — no Fal/Ark request ids attached for this session.

### 2026-10-07 — MiniMax H3 reference-to-video — fail (request `01a11461…`)

|                  |                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model**        | [`minimax/h3/reference-to-video`](https://fal.ai/models/minimax/h3/reference-to-video) (Fal dashboard endpoint id: `fal-ai/minimax_h3/reference-to-video`) |
| **Surface**      | H3 Lab (`/h3-lab`) (assumed; same Fal endpoint as other lab runs)                                                                                          |
| **Scenario**     | User-reported fail — qualitative details not specified in chat                                                                                             |
| **Inputs**       | Not recorded; same session prepared `香水-5s.mp4` and `cat-fight-commit-5s.mp4` as candidate sources                                                       |
| **Prompt style** | Not recorded                                                                                                                                               |
| **Verdict**      | **fail**                                                                                                                                                   |

**Findings**

User marked this generation as a fail for Genjutsu-style expectations. Specific defects (motion / identity / unintended edits) were not described; treat as a second negative sample on H3, separate from the running-man baseline.

**Evidence**

- Fal request: [dashboard](https://fal.ai/dashboard?s_requestId=01a11461-f15d-7372-88a8-613f6c79da33&s_endpointId=fal-ai%2Fminimax_h3%2Freference-to-video)
- `requestId`: `01a11461-f15d-7372-88a8-613f6c79da33`

### 2026-10-07 — MiniMax H3 reference-to-video — running man — fail

|                  |                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model**        | [`minimax/h3/reference-to-video`](https://fal.ai/models/minimax/h3/reference-to-video) (Fal dashboard endpoint id: `fal-ai/minimax_h3/reference-to-video`)                       |
| **Surface**      | H3 Lab (`/h3-lab`)                                                                                                                                                               |
| **Scenario**     | Running-man acrobat stunt — multi-person character swap + full environment replace (Genjutsu objects-swap / environment stress)                                                  |
| **Inputs**       | Source: running-man stunt clip; multiple character refs + one environment ref (Image 1–N / Video 1)                                                                              |
| **Prompt style** | Long Genjutsu-style instruction (character map + environment restage + motion/camera preserve). App prompt cap raised to Fal OpenAPI `maxLength` 50000 (`H3_MAX_PROMPT_LENGTH`). |
| **Verdict**      | **fail**                                                                                                                                                                         |

**Findings**

1. **Unintended scene edit:** source-video obstacles were removed instead of being preserved or restaged as specified.
2. **Motion fidelity broken on the backflip:** tumble appears to start, then the subject **snaps face-up** — landing/roll does not match the source choreography.

**Evidence**

- Fal request: [dashboard](https://fal.ai/dashboard?s_requestId=01a11445-0c0b-7513-8c5b-28bfab307504&s_endpointId=fal-ai%2Fminimax_h3%2Freference-to-video)
- `requestId`: `01a11445-0c0b-7513-8c5b-28bfab307504`

**Implication**

Not ready as a drop-in for Genjutsu motion-preserving character/environment edits on this class of stunt clip. Re-test only after prompt/provider changes; keep this run as the baseline fail.
