# Genjutsu Standard / Light: product-scoped model routing

## Goal

Allow Genjutsu Standard and Genjutsu Light to coexist on the same deployment without changing the provider used by unrelated pages.

## Routing priority

1. Explicit product model profile in `src/modules/genjutsu/model-config.ts`.
2. Existing `GENJUTSU_PRODUCT_PROVIDER` override for allowlisted, **unpinned** products.
3. Existing `GENJUTSU_OBJECT_SWAP_PROVIDER` or `GENJUTSU_MOTION_PROVIDER` and corresponding model env for unpinned pages and the homepage.

Both Standard and Light use `provider: 'higgsfield'` and different model IDs. The shared submission, status, webhook, R2, and credit-task flow stays intact.

The initial product pins select Light for four templates and Standard for Wassup in a Minute:

- Light: `glow-stick`, `tiny-desk-ai`, `chipmunks-dance`, `bicep-heart`
- Standard: `wassup-in-a-minute-ai`

No other product is pinned as part of this change. Change an individual product to `'standard'` or remove its entry to return to env routing. Do not pin an unrelated Seedance-only product to Higgsfield Genjutsu without first validating its required API workflow.

## Task stability

`/api/genjutsu/attempt` resolves `provider + model` server-side and stores both on `aiTask`. Subsequent generation and status processing use the stored pair. For Light-pinned product pages, the preflight validator accepts persisted Standard and Light model IDs, so changing a product's model does not invalidate an existing Higgsfield job. Unknown providers and models are rejected.

No DB schema migration is required.

## Pricing

Use the exact model for both live `/estimate/<model>` calls and fallback estimates.

- Standard: current list-rate fallback and 30-second source cap.
- Light: API list-rate fallback $0.05 / $0.10 / $0.20 per billed second at 480p / 720p / 1080p; input + output seconds, with source capped at 15 seconds.
- Frontend and SEO estimates pass the actual selected product model for all five pinned pages, including the Standard-priced Wassup in a Minute page.
- Homepage `/api/config/public` returns the resolved `provider` **and** `model` for both `motion-transfer` and `objects-swap`; `GeneratorPanel` uses both for full/preview quotes. If either is missing, no speculative quote is shown.
- Live provider estimate takes precedence. The Light fallback assumes the generated duration matches the trimmed source and rounds seconds upward.

Source for Light pricing: https://open.higgsfield.ai/models/higgsfield/genjutsu-light/object-swap/v1.0/playground (checked 2026-11-12).

## Validation before merge

- Run `pnpm test`, `pnpm exec tsc --noEmit` (if supported by current project config), and formatting checks in a fully installed checkout.
- Create jobs for a Light-pinned product and an unpinned Standard product concurrently and verify the stored `provider/model` pairs.
- Start a Standard task, change that product's pin to Light, then submit the saved Standard task and confirm completion.
- Check the server-reserved credits and client/SEO preview for both full and 4-second previews.
- Set homepage motion and objects-swap to different Standard/Light models under the same `higgsfield` provider. Verify `/api/config/public` returns two different `model` fields, and that switching modes changes the browser quote. Check the expected Light 15s@720p list estimate ($3 provider cost) versus Standard ($10.215 provider cost).
- Exercise a 15-second (and >15-second source) Light request for billing and trimming.
- Verify no live deployment until production API behavior and costs are confirmed.
