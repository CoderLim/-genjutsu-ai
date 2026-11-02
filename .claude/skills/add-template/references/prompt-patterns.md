# Prompt patterns for homepage apply templates

Write English prompts. Keep them specific to the clip after reading frames.

## Structure

1. **Replace lines** — one per swappable subject (`@Image N`)
2. **REFERENCE MAPPING** — who each image replaces (role + where they appear)
3. **SHOT BEAT / SHOT STRUCTURE** (optional) — ordered beats when cuts matter
4. **Identity continuity** — same people across cuts; no swaps / extras
5. **Preserve** — camera, set, lighting, timing, transitions

## Defaults

- Mode: `objects-swap`
- Resolution: `480p` (`DEFAULT_OBJECTS_RESOLUTION`)
- Mapping order: `@Image 1` = primary/adult/first subject unless user says otherwise
- Do not invent product-page `href` unless the user asked for a dedicated landing

## Examples (shape only)

### One subject

```text
Replace the <subject> in @Video 1 with the subject in @Image 1 — face, hair, build, outfit, and accessories.

Preserve camera path, lighting, and timing. Use only this authorized likeness.
```

### Two subjects

Generic COMPLETE replacement / identity priority / hard-visibility rules already live in `buildSeedanceWorkflowPrompt` (`REFERENCE IDENTITY` + `OBJECT SWAP`). Template prompts should stay **scene-specific**: original cues, role mapping, shot beats. Do not restate the system identity block.

Prefer explicit cues + mapping when either subject is small, far, motion-blurred, occluded, profile-only, or easy to miss in a short preview (first ~4s):

```text
ORIGINAL SUBJECT CUES (identify who to replace; do NOT copy these looks onto the replacements):
- Person A: <distinctive original cues / where they appear>.
- Person B: <distinctive original cues / where they appear>.

ROLE MAPPING (same two identities for the whole clip):
- Person A → @Image 1.
- Person B → @Image 2.

SHOT BEAT (optional):
1) ...

Preserve camera path, <key props>, lighting, and timing. Use only these authorized likenesses.
```

Light two-subject shape (only when both subjects stay large and clear throughout):

```text
Replace the <role A> in @Video 1 with the person in @Image 1 — face, hair, build, outfit, and accessories.
Replace the <role B> in @Video 1 with the person in @Image 2 — face, hair, build, outfit, and accessories.

REFERENCE MAPPING:
@Image 1 → <role A> (<where>).
@Image 2 → <role B> (<where>).

Preserve camera path, <key props>, lighting, and timing. Use only these authorized likenesses.
```

## Customer-facing copy

Template gallery titles may name the trend (`Closing Door Prank`). Do not expose upstream model/provider names in prompts or i18n titles.
