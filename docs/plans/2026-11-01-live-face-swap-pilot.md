# Live Face Swap — Lucy 2.5 INTERNAL pilot (2026-11-01)

## Scope and integration

- New route: `/live-face-swap`. Uses existing Genjutsu theme, SiteHeader, SiteFooter; no SEO prose, nav or sitemap. `noindex,nofollow` remains in place.
- Browser: portrait upload, camera permission, side-by-side WebRTC preview (no video recording or download in this pilot), and auto-renewable 30s credit reservations with server-time estimated settlement and unused-credit refund.
- fal model: `decart/lucy-2-5/realtime`. This is generative character editing; hair, face identity or scene preservation is not guaranteed.
- API routes: `/api/live-face-swap/token`, `/renew`, `/stop`. Each requires an authenticated, same-origin POST (requests with missing or invalid `Origin` are rejected with 403).
- The token endpoint resolves the **existing site Fal key** using `(await getConfig('fal_api_key'))?.trim()`. Set it through **Admin → Settings → AI → Fal**; the global config layer also supports the existing `FAL_KEY` environment fallback. Never pass the master key to the browser.
- The token endpoint requires `LIVE_FACE_SWAP_ENABLED === 'true'` AND a matching email in `LIVE_FACE_SWAP_ALLOWED_EMAILS`. **Admin roles do not bypass the allowlist.**
- Only English customer copy is currently implemented. This is an **English-only internal pilot**: follow-up i18n work must extract `site.live_face_swap.*` and translate all enabled locales before any public/localized launch.

## Non-negotiable cost / rollout boundary

**Keep `LIVE_FACE_SWAP_ENABLED=false` in production and in the committed `.env.example`. Do not make this pilot public, even for paid users, until a server-enforceable media/session lifetime and provider usage reconciliation are available.**

- Provider list price used for budgeting: **$0.04 per processed second**, equivalent to **$1.20 for 30s**, **$2.40 per minute**, **$144 per continuous hour** (pricing can change; verify the provider account). This is actual upstream spending exposure, regardless of customer wallet state.
- The customer-facing benchmark is **3.6 credits/second**, matching the Lucy 2.5 row at https://livefaceswap.ai/pricing (checked 2026-11-01). The server **reserves 108 credits per 30s** and auto-renews before expiration. When the browser closes WebRTC and calls `/stop`, the server computes **ceil(seconds from token issuance to stop receipt) × 3.6**, rounded up to a whole credit for the *entire session*. It issues a single deterministic unused-credit refund GRANT and reports the net charge. Example: 10s uses 36 credits, returns 72; 38s reserves 216, charges 137, returns 79. This is **NOT** verified fal billed output duration or the competitor's 0.1s precision.
- This is a **product tariff override** (`LIVE_FACE_SWAP_CREDITS_PER_SECOND = 3.6`), not the shared `calculateProviderCredits` 1.7x cost conversion. Pricing version: `lucy25-second-settlement-v3-pilot`. Existing paid-order pack values and other generators remain unchanged.
- **Margin warning:** at the site's Studio package ($39.99 / 3,600 credits), 108 credits nominally earn **$1.1997 per 30 seconds** before processing fees, chargebacks, tax, free promotional credits, etc. At a $0.04/s upstream rate, model costs already reach **$1.20/30s**: this is breakeven/slightly negative even before fees; smaller packs have only thin gross margins. Do not open this rate to public usage without verified provider billing and revised unit economics.
- **Conflicting upstream public prices (2026-11-01):** https://fal.ai/lucy-2.5 still lists **$0.04/second**, while https://fal.ai/models/decart/lucy-2-5/realtime currently displays **$0.02/second** in its playground. Keep the **conservative $0.04/s budget** until actual account charges confirm which one applies. Do not infer a lower cost from the model page alone.
- **This is NOT actual upstream-billed-duration settlement.** The server records token-to-stop **wall clock**, not video frames or a verified fal usage receipt. During normal browser use this approximates usage but can overcharge connection setup time or undercount a stream that outlives a malicious/aborted browser. There is no provider-enforced WebRTC lease. No public access.
- Stop workflow: close client WebRTC first, POST `/stop` with session ID, CAS root `active → settling` and freeze server stop timestamp, check contiguous paid chunks and uncovered duration, issue deterministic credit GRANT `live-face-swap-refund:<sessionId>` once, then store final settlement and `ended` status. Duplicate calls return the persisted record; ambiguous states stay `settling` for manual review. Pagehide sends a best-effort beacon; if neither request reaches the server, preauthorized credits remain held pending reconciliation.
- A token/authentication failure may occur before any task exists. `/stop` is therefore a successful no-op (`not-started`) for no task or a confirmed `insufficient` task, and idempotently returns the refund for a confirmed `refunded` task. Real `charging`/`refunding`/`settling` uncertainty is NOT treated as a no-op. The browser preserves the original token error rather than replacing it with a misleading billing warning. The screenshot's claim that billing starts when AI output appears is **not supported by this branch**: timer begins when the server issues the token.
- Refund GRANTs are new active credits (not restoration of individual original expiring credit lots). This difference must be reconciled with original expiry semantics before public launch.
- A forged early `/stop` can seek unused-credit refunds without actually tearing down an upstream peer-to-peer stream; this is a known abuse path. Before public rollout require server-controlled disconnect and invoice-level validation. Client timers and same-origin requests are not a security boundary against an authenticated malicious user.
- The **browser's 30s prepaid timer**, **JWT expiration of 120 seconds**, the **per-session 120-chunk billing ceiling** and the **5 new sessions per user in a rolling 24h pilot quota** are **not hard provider cost caps**. Neither JWT expiry nor ending the task record can revoke an already established WebRTC stream. The 5-session check is DB-based but is not a distributed lock.
- The feature flag and explicit allowlist are the only deployment controls in this PR. Token replay and unlimited established WebRTC duration are unresolved. Do **not** switch on the flag for public traffic.
- Full initial reservation is refunded when token minting fails before issuance. After issuance, unused portions are conditionally refunded on a successful server stop (not from a client-declared elapsed duration). D1's compatibility layer is non-atomic; `charging`, `refunding` and `settling` states require manual recovery/audit if interrupted.
- The process-local rate limiter is not cross-Worker protection. Before a public launch implement a server-enforced lease or controllable media relay, distributed one-active-session limits, safe token consumption/replay protection and provider billing reconciliation.

## Local / staging-only opt-in verification

1. `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`.
2. Configure the existing Fal key via **Admin → Settings → AI → Fal** (or existing environment fallback).
3. Set `LIVE_FACE_SWAP_ENABLED=true` **only in an isolated, budgeted development/staging environment**; set `LIVE_FACE_SWAP_ALLOWED_EMAILS=your-tester@example.com`. **Never enable this flag in production.**
4. Sign in *as an explicitly listed tester*. An admin not in the allowlist should receive 403.
5. Visit `/live-face-swap` on localhost or HTTPS, upload an authorized portrait, consent, start the live preview, and stop.

### Acceptance checklist

- [ ] `pnpm build` and the project unit tests pass for this branch. Existing unrelated i18n/redirect failures should be tracked separately, not silently patched here.
- [ ] Rendered customer UI contains no `Lucy`, `fal`, `Decart`, or other upstream model/vendor name.
- [ ] Token API resolves `getConfig('fal_api_key')`, never a new standalone credential source.
- [ ] Token/renew success uses `respData({ token, ...billingState })`; client tokenProvider uses `apiPost`, and errors use `respErr`/`respJson` via the shared API client.
- [ ] Missing, malformed or foreign `Origin` receives 403 on token, renew and stop.
- [ ] Feature flag default-off and allowlist-only gate, including rejection of unlisted admins.
- [ ] Five new-session quota per tester per rolling 24 hours; repeat session/chunk attempts do not cause duplicate debit.
- [ ] Test camera permissions, portrait validation, network/ICE failures, remote failure, insufficient credits, auto-renew, stop, navigation, tab hide, duplicated renewal, and continuous preview beyond 30 seconds on real browsers.
- [ ] On connection failure, inspect the browser's `[live-face-swap] negotiation phase`, `protocol failure`, and `realtime SDK error` console entries. The SDK delivers a terminal error through both `onState('failed')` and `onError`; do not clear the active operation before `onError` reports the cause. Share only redacted diagnostics. Verify `onMedia`/first playable output occurred before evaluating whether startup should count as chargeable usage.
- [ ] Verify 3.6 credits/s equivalent and **108-credit hold** per 30s; test 10s → 36 used/72 returned, 30s → 108/0, 38s → 137 used/79 returned. Test repeated stop, overlapping stop/renew, renewal charge uncertainty, and pagehide no-stop/manual reconciliation. No changes to other generators' tariffs.
- [ ] Compare fal invoice duration to server token-to-stop estimate and credit ledger; **do not assume they match** without signed upstream session usage data.
- [ ] Confirm upstream disconnection and session stop behavior with live test credentials, with a strict account budget; do not assume browser cleanup enforces upstream billing.

## Rollout status

Internal feature behind a disabled flag and explicit allowlist. No production key changes, account funding, public traffic or provider smoke test is authorized by this PR. SEO, full localization, provider-enforceable leases and reliable spend reconciliation remain follow-up work.
