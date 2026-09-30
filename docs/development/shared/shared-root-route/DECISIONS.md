# Decisions — F0-19 Root route and production guard for dev previews

## Open decisions affecting this feature
None.

## Feature decisions log
- FD-01 (2026-09-30): showcase path `/dev-preview` (matches the existing `dev-preview-*` names). Guard is 404 in production rather than deleting the pages, so local UI-kit work is unaffected. Non-blocking; confirm at START FEATURE.
- FD-02 (2026-09-30): T-04 is a Vitest render test (`src/app/dev-preview/page.test.tsx`), not e2e. The Playwright webServer is `npm run start` (production build), where the guard returns 404, so an e2e run cannot show the showcase. T-05 stays e2e. Test-plan level change only; AC-04 coverage unchanged.
- FD-03 (2026-09-30): landing logic is `evaluateLanding` in `src/server/auth/guard.ts`, sharing the profile/inactive/MFA steps with `evaluateRoleGuard` (no second pattern). Under `DATA_SOURCE=mock`, `/` redirects to the mock family user's first client home.
