# Live Face Swap — Lucy 2.5 INTERNAL pilot (2026-11-01)

## Scope and integration

- New route: `/live-face-swap`. Uses existing Genjutsu theme, SiteHeader, SiteFooter; no SEO prose, nav or sitemap. `noindex,nofollow` remains in place.
- Browser: portrait upload, camera permission, side-by-side WebRTC preview, optional 10s recording/download, and auto-renewable prepaid credits.
- fal model: `decart/lucy-2-5/realtime`. This is generative character editing; hair, face identity or scene preservation is not guaranteed.
- API routes: `/api/live-face-swap/token`, `/renew`, `/stop`. Each requires an authenticated, same-origin POST (requests with missing or invalid `Origin` are rejected with 403).
- The token endpoint resolves the **existing site Fal key** using `(await getConfig('fal_api_key'))?.trim()`. Set it through **Admin → Settings → AI → Fal**; the global config layer also supports the existing `FAL_KEY` environment fallback. Never pass the master key to the browser.
- The token endpoint requires `LIVE_FACE_SWAP_ENABLED === 'true'` AND a matching email in `LIVE_FACE_SWAP_ALLOWED_EMAILS`. **Admin roles do not bypass the allowlist.**
- Only English customer copy is currently implemented. This is an **English-only internal pilot**: follow-up i18n work must extract `site.live_face_swap.*` and translate all enabled locales before any public/localized launch.

## Non-negotiable cost / rollout boundary

**Keep `LIVE_FACE_SWAP_ENABLED=false` in production and in the committed `.env.example`. Do not make this pilot public, even for paid users, until a server-enforceable media/session lifetime and provider usage reconciliation are available.**

- Provider list price used for budgeting: **$0.04 per processed second**, equivalent to **$1.20 for 30s**, **$2.40 per minute**, **$144 per continuous hour** (pricing can change; verify the provider account). This is actual upstream spending exposure, regardless of customer wallet state.
- The customer-facing benchmark is **3.6 credits/second**, matching the Lucy 2.5 row at https://livefaceswap.ai/pricing (checked 2026-11-01). With the current prepaid-chunk architecture we **charge 108 credits for 30 seconds** and auto-renew before expiration. The server records deterministic chunk IDs to avoid double-charging a single chunk. This matches the *effective published credits-per-second rate*, but **NOT** the competitor's actual-output 0.1s metering; unused prepaid time is not prorated.
- This is a **product tariff override** (`LIVE_FACE_SWAP_CREDITS_PER_SECOND = 3.6`), not the shared `calculateProviderCredits` 1.7x cost conversion. Pricing version: `lucy25-chunk30-v2-benchmark`. Existing paid-order pack values and other generators remain unchanged.
- **Margin warning:** at the site's Studio package ($39.99 / 3,600 credits), 108 credits nominally earn **$1.1997 per 30 seconds** before processing fees, chargebacks, tax, free promotional credits, etc. At a $0.04/s upstream rate, model costs already reach **$1.20/30s**: this is breakeven/slightly negative even before fees; smaller packs have only thin gross margins. Do not open this rate to public usage without verified provider billing and revised unit economics.
- **Conflicting upstream public prices (2026-11-01):** https://fal.ai/lucy-2.5 still lists **$0.04/second**, while https://fal.ai/models/decart/lucy-2-5/realtime currently displays **$0.02/second** in its playground. Keep the **conservative $0.04/s budget** until actual account charges confirm which one applies. Do not infer a lower cost from the model page alone.
- **This is NOT real-time upstream usage settlement.** There is no reconciliation against the actual provider stream duration or invoice and no server-enforced WebRTC lease. A customer running out of credits stops the browser *in normal use*, but does not terminate a malicious or stuck provider session.
- The **browser's 30s prepaid timer**, **JWT expiration of 120 seconds**, the **per-session 120-chunk billing ceiling** and the **5 new sessions per user in a rolling 24h pilot quota** are **not hard provider cost caps**. Neither JWT expiry nor ending the task record can revoke an already established WebRTC stream. The 5-session check is DB-based but is not a distributed lock.
- The feature flag and explicit allowlist are the only deployment controls in this PR. Token replay and unlimited established WebRTC duration are unresolved. Do **not** switch on the flag for public traffic.
- Refunds are attempted if initial token minting fails before token issuance; once the token is issued, prepaid intervals are not prorated. D1's compatibility layer is not an atomic transaction; `charging`/`refunding` rows require reconciliation after failures.
- The process-local rate limiter is not cross-Worker protection. Before a public launch implement a server-enforced lease or controllable media relay, distributed one-active-session limits, safe token consumption/replay protection and provider billing reconciliation.

## Local / staging-only opt-in verification

1. `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`.
2. Configure the existing Fal key via **Admin → Settings → AI → Fal** (or existing environment fallback).
3. Set `LIVE_FACE_SWAP_ENABLED=true` **only in an isolated, budgeted development/staging environment**; set `LIVE_FACE_SWAP_ALLOWED_EMAILS=your-tester@example.com`. **Never enable this flag in production.**
4. Sign in *as an explicitly listed tester*. An admin not in the allowlist should receive 403.
5. Visit `/live-face-swap` on localhost or HTTPS, upload an authorized portrait, consent, start, record and stop.

### Acceptance checklist

- [ ] `pnpm build` and the project unit tests pass for this branch. Existing unrelated i18n/redirect failures should be tracked separately, not silently patched here.
- [ ] Rendered customer UI contains no `Lucy`, `fal`, `Decart`, or other upstream model/vendor name.
- [ ] Token API resolves `getConfig('fal_api_key')`, never a new standalone credential source.
- [ ] Token/renew success uses `respData({ token, ...billingState })`; client tokenProvider uses `apiPost`, and errors use `respErr`/`respJson` via the shared API client.
- [ ] Missing, malformed or foreign `Origin` receives 403 on token, renew and stop.
- [ ] Feature flag default-off and allowlist-only gate, including rejection of unlisted admins.
- [ ] Five new-session quota per tester per rolling 24 hours; repeat session/chunk attempts do not cause duplicate debit.
- [ ] Test camera permissions, portrait validation, network/ICE failures, remote failure, insufficient credits, auto-renew, stop, navigation, tab hide, duplicated renewal, and clip download on real browsers.
- [ ] Verify 3.6 credits/s equivalent: 108 credits per initial or renewal 30s block; no changes to other generators' tariffs. Compare provider billed duration to the website credit ledger; no assertion of accurate usage settlement without real provider records.
- [ ] Confirm upstream disconnection and session stop behavior with live test credentials, with a strict account budget; do not assume browser cleanup enforces upstream billing.

## Rollout status

Internal feature behind a disabled flag and explicit allowlist. No production key changes, account funding, public traffic or provider smoke test is authorized by this PR. SEO, full localization, provider-enforceable leases and reliable spend reconciliation remain follow-up work.
