# Test Plan — F0-28 Client personal details

## Approach
Tests first (TESTING.md §2). Titles start `[F0-28][AC-xx]`. Run, confirm they fail for the right reason, then implement.

| Test ID | Covers | Level | File | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-04, AC-09, AC-15 | unit | `src/server/clients/client-details-schema.test.ts` | ☑ | passing |
| T-02 | AC-08, AC-10, AC-15 | unit (action, faked Supabase + mock) | `src/server/clients/client-details-actions.test.ts` | ☑ | passing |
| T-03 | AC-02, AC-03, AC-05 | unit (signUp action) | `src/server/auth/sign-up-client-details.test.ts` | ☑ | passing |
| T-04 | AC-13 | database (pgTAP) | `supabase/tests/client_details.test.sql` | ☑ | passing |
| T-05 | AC-01, AC-04, AC-16 | component | `src/app/(auth)/sign-up/sign-up-client-details.test.tsx` | ☑ | passing |
| T-06 | AC-06–AC-10, AC-16 | component | `src/features/family-settings/client-details-card.test.tsx` | ☑ | passing |
| T-07 | AC-11, AC-12, AC-16 | component | `src/features/client-profile-details/personal-details-card.test.tsx` | ☑ | passing |
| T-08 | AC-03, AC-07, AC-12, AC-13, AC-14 | integration (local Supabase) | `tests/integration/shared-client-profile-details.test.ts` | ☑ | passing |

## Regression scope
F0-17 sign-up, FAM-12/FAM-13 Settings, FAM-09/CAR-04/ADM-11/F0-26 Client Details, F0-22 header. Suite: Vitest full (`DATA_SOURCE=mock`), typecheck, lint, prettier, `supabase test db`, integration, build.

## Results
- 2026-10-14, tests first: all eight written and run before any code. Every one fails for the right reason: the modules `client-details-schema`, `client-details`, `client-details-actions`, `client-details-card` and `personal-details-card` do not exist, sign-up has no 'More about them' group and does not call `save_client_details`, and pgTAP stops at `function save_client_details(...) does not exist`.
- 2026-10-15, after implementation (local Supabase running, `supabase db reset`):
  - `DATA_SOURCE=mock npx vitest run --exclude 'tests/integration/**'`: 255 files, 2888 tests, all pass.
  - `tests/integration/shared-client-profile-details.test.ts`: 3/3 pass.
  - Full `tests/integration`: 15 failures, all in files that fail the same way on `main` today (FAM-07 AC-02, F0-11, FAM-05, FAM-02, FAM-15, ADM-11, cross-role sync ×3 'the task is listed for today', F0-16 seed, F0-17 AC-04), plus `budget-thresholds`, which failed once in the full run and passed alone. None touches client details.
  - `npx supabase test db`: 36 files, 998 tests, PASS (27 new).
  - `npx playwright test tests/e2e/sign-up.spec.ts`: 7/7 pass (FD-08 selector change).
  - `npm run lint` 0 errors (3 warnings in files this PR does not touch), `npm run typecheck` clean, prettier on changed files clean, `npm run build` clean (its `[carer-settings]` prerender log also appears on `main`).
  - Not run: a real-browser visual check of the three screens, and the rest of the e2e suite.

