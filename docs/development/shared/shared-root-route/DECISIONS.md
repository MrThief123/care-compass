# Decisions — F0-19 Root route and production guard for dev previews

## Open decisions affecting this feature
None.

## Feature decisions log
- FD-01 (2026-09-30): showcase path `/dev-preview` (matches the existing `dev-preview-*` names). Guard is 404 in production rather than deleting the pages, so local UI-kit work is unaffected. Non-blocking; confirm at START FEATURE.
- FD-02 (2026-09-30): T-04 is a Vitest render test (`src/app/dev-preview/page.test.tsx`), not e2e. The Playwright webServer is `npm run start` (production build), where the guard returns 404, so an e2e run cannot show the showcase. T-05 stays e2e. Test-plan level change only; AC-04 coverage unchanged.
- FD-03 (2026-09-30): landing logic is `evaluateLanding` in `src/server/auth/guard.ts`, sharing the profile/inactive/MFA steps with `evaluateRoleGuard` (no second pattern). 
- FD-04 (2026-09-30, human): `/` always resolves through the real session, including under `DATA_SOURCE=mock`, so a fresh visitor starts at `/sign-in`. Supersedes the PRD edge case line about the mock current-user path (sign-in itself is always Supabase auth).
- FD-04 (2026-09-30, human): `/` always resolves through the real session, including under `DATA_SOURCE=mock`, so a fresh visitor starts at `/sign-in`. Supersedes the PRD edge case line about the mock current-user path (sign-in itself is always Supabase auth).
- FD-05 (2026-09-30, found in manual testing, not fixed here): `src/app/(family)/family/[clientId]/layout.tsx` runs `getCurrentUser("family")` and `getClientHeaderSummary(clientId)` in one `Promise.all`. Under `DATA_SOURCE=supabase` the unimplemented data call throws first, so the role redirect is lost: a signed-in carer opening a family URL stays on it and sees the error instead of going to `/carer/home`. F0-07 territory (role guard) and the Phase 3 wiring of `clients.getClientHeaderSummary`. Should resolve when the data function exists; if not, run the guard before the data call. Route redirects for `/admin/home`, `/carer/home` and `/` were verified in a real browser for family and carer.
