# Test Plan — ADM-10 Admin — Settings

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit (action)** → `src/server/admin/*.test.ts` (Supabase client faked)
- **integration** → `tests/integration/admin-settings.test.ts` (local Supabase; skipped on hosted)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed data, when Settings renders, then 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072' are shown. | ☑ | GREEN |
| T-02 | AC-02 | component | Given ABN '123', when saved, then an ABN error is shown and the action is not called. | ☑ | GREEN |
| T-03 | AC-03 | db | Priya updates Banksia; she cannot update another organisation (no id parameter; Wattle unchanged); a carer and a signed-out caller are refused (42501); no direct table update. Blank name/ABN not 11 digits raise 22023. | ☑ | GREEN |
| T-04 | AC-02 | unit | `updateOrganisationSettings` refuses bad ABN/blank fields with per-field messages and does not call Supabase. | ☑ | GREEN |
| T-05 | AC-04 | unit | It calls `admin_update_organisation` once with trimmed values and ABN grouped `XX XXX XXX XXX`, returns the saved row; an RPC error is a failure. | ☑ | GREEN |
| T-06 | AC-04 | component | Save calls `updateOrganisationSettings` once, then shows 'Saved.'. | ☑ | GREEN |
| T-07 | AC-05 | component | A failed save keeps typed values, announces the error, no 'Saved.'. | ☑ | GREEN |
| T-08 | AC-06 | component | Reset calls `requestOwnPasswordReset` and shows the sent message; on failure shows the error, not the sent message. | ☑ | GREEN |
| T-09 | AC-01, AC-04 | integration | `getAdminSettings` returns the admin's own organisation; after `updateOrganisationSettings` the change reads back; a signed-out save refuses. | ☑ | GREEN |

## Existing tests affected
- `src/features/admin-settings/settings-screen.test.tsx` (ADM-UI-05 local Save/Reset behaviour) and `queries.test.ts` ('rejects unwired live mode'). Changed in the implementation session: the screen now mocks the actions, the preview notices go, live mode no longer throws. Record in DECISIONS.md and flag **HUMAN REVIEW: test expectation changed**. Not touched in the tests-first session.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Playwright e2e for the admin dashboard with `--grep-invert "F0-07"` (hosted project), before the PR.

## Test data
- F0-16 seed data is not merged; pgTAP and integration tests create their own users and organisations (Banksia Home Care, Priya Nair). Synthetic only.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
