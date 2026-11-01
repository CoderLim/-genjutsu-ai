# Live Face Swap — Lucy 2.5 functional pilot (2026-11-01)

## Scope

- New route: /live-face-swap with existing dark/warm Genjutsu theme, SiteHeader and SiteFooter.
- Frontend: upload a portrait (JPG/PNG/WebP, at least 512x512, <=8 MiB), request webcam permission, local camera preview, WebRTC Lucy output, up to 30 seconds of client-timed processing, optional 10-second MediaRecorder capture and local download.
- Provider: fal \`decart/lucy-2-5/realtime\`, explicit face-preservation prompt with prompt expansion off.
- Backend: /api/live-face-swap/token, minted with the server-only \`FAL_KEY\`, scoped to \`lucy-2-5\`, short-lived token, requires authentication and authorized pilot tester.
- No SEO body/FAQ/schema/sitemap additions. Page temporarily has \`noindex,nofollow\`.
- No edits to existing video-face-swap, Genjutsu workflows, R2 paths or credit tables.

## Enabling a local or staging pilot

1. Install dependencies: \`pnpm install --frozen-lockfile\` (requires Node 22 and pnpm 10).
2. Set \`FAL_KEY\` with a funded fal account.
3. Set \`LIVE_FACE_SWAP_ENABLED=true\`.
4. Sign in with a user granted \`admin.*\` or set \`LIVE_FACE_SWAP_ALLOWED_EMAILS=your-email@example.com\`.
5. Run \`pnpm dev\` and visit \`/live-face-swap\` in a browser with camera access (localhost or HTTPS).
6. Upload an authorized 512x512+ portrait, enable the camera, confirm consent, start the live session, record and download a test clip.

## Important rollout restrictions

This is **pilot-only**, NOT a public billing implementation.

- fal currently charges **$0.04 per processed second** (check live pricing before launch).
- The page's 30-second cutoff is a **client-side best effort** and can be bypassed. Temporary JWT expiry also does **not** shut down an established WebRTC session.
- Do not make the token endpoint public, link as a paid tool, or remove the admin/allowlist gate until server-side session leases, bounded active-concurrency, provider usage reconciliation, and website credit billing/refund have been implemented and tested.
- The current min-interval limiter uses process-local memory and is insufficient on its own for public distributed rate limiting.
- The \`@fal-ai/client/realtime\` protocol-aware extension is experimental; pin and retest on upgrades.
- Lucy is a generative character swap model; precise face-only identity replacement, hair/scene preservation and real-person consistency are not guaranteed.
- Images are passed directly to fal as data URIs from the browser, and raw camera video is sent to the provider via WebRTC. Reference images and recordings are not stored by our app in this pilot.
- MediaRecorder output varies by browser (WebM / MP4), and some browsers do not support recording.
- Close/tab hide/navigation stops local resources and requests WebRTC teardown, but cannot be treated as an enforceable upstream spending cap.

## Verification checklist

- [ ] \`pnpm install --frozen-lockfile\`, \`pnpm test\`, \`pnpm build\`, \`pnpm cf:build\`.
- [ ] Confirm fal token API response and WebRTC offer/answer with real pilot credentials.
- [ ] Test desktop Chrome, desktop Safari, iOS Safari, Android Chrome.
- [ ] Test no camera, denied permission, invalid/small portrait, disconnected network, slow ICE negotiation, failed token mint, tab close during connection and after session starts.
- [ ] Verify server denies anonymous, unlisted and feature-disabled users.
- [ ] Verify stop, 30-second timeout, navigation and tab hide stop provider usage according to fal billing records.
- [ ] Inspect actual downloaded recording formats and playback.
- [ ] Before a public release, implement billing and hard usage caps; add approved SEO content, canonical/hreflang/sitemap and page discovery.

No authenticated provider smoke test or local build is asserted by this implementation.
