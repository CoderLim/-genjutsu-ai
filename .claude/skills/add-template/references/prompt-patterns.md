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

```text
Replace the <adult/role A> in @Video 1 with the person in @Image 1 — face, hair, build, outfit, and accessories.
Replace the <child/role B> in @Video 1 with the person in @Image 2 — face, hair, build, outfit, and accessories.

REFERENCE MAPPING:
@Image 1 → <role A> (<where>).
@Image 2 → <role B> (<where>).

SHOT BEAT (same two people throughout):
1) ...
2) ...

Keep one continuous identity per reference across every cut. Do not swap assignments or invent extra people.

Preserve camera path, <key props>, lighting, and timing. Use only these authorized likenesses.
```

## Customer-facing copy

Template gallery titles may name the trend (`Closing Door Prank`). Do not expose upstream model/provider names in prompts or i18n titles.
