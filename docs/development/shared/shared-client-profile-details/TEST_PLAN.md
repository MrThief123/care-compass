# Test Plan — F0-28 Client personal details

## Approach
Tests first (TESTING.md §2). Titles start `[F0-28][AC-xx]`. Run, confirm they fail for the right reason, then implement.

| Test ID | Covers | Level | File | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-04, AC-09, AC-15 | unit | `src/server/clients/client-details-schema.test.ts` | ☐ | |
| T-02 | AC-08, AC-10, AC-15 | unit (action, faked Supabase + mock) | `src/server/clients/client-details-actions.test.ts` | ☐ | |
| T-03 | AC-02, AC-03, AC-05 | unit (signUp action) | `src/server/auth/sign-up-client-details.test.ts` | ☐ | |
| T-04 | AC-13 | database (pgTAP) | `supabase/tests/client_details.test.sql` | ☐ | |
| T-05 | AC-01, AC-04, AC-16 | component | `src/app/(auth)/sign-up/sign-up-client-details.test.tsx` | ☐ | |
| T-06 | AC-06–AC-10, AC-16 | component | `src/features/family-settings/client-details-card.test.tsx` | ☐ | |
| T-07 | AC-11, AC-12, AC-16 | component | `src/features/client-profile-details/personal-details-card.test.tsx` | ☐ | |
| T-08 | AC-03, AC-07, AC-12, AC-13, AC-14 | integration (local Supabase) | `tests/integration/shared-client-profile-details.test.ts` | ☐ | |

## Regression scope
F0-17 sign-up, FAM-12/FAM-13 Settings, FAM-09/CAR-04/ADM-11/F0-26 Client Details, F0-22 header. Suite: Vitest full (`DATA_SOURCE=mock`), typecheck, lint, prettier, `supabase test db`, integration, build.
