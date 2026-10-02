# Test Plan — ADM-05 Admin — Remove client

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/admin_client_remove.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/admin-client-remove.test.ts` (Vitest against local Supabase)
- **unit** → `src/server/admin/clients-actions.test.ts` (mock data source)
- **component** → `src/features/admin-clients/client-remove.test.tsx`, `src/features/family-settings/organisation-removed.test.tsx`, `src/features/family-home/organisation-removed-banner.test.tsx`

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | After removal, a carer on shift reads zero rows for the client (and none of its events); so does the removing admin. | ☑ | PASS (pgTAP, local stack) |
| T-02 | AC-02 | db | After removal, the family reads the client, all its events, its budget and its completions. | ☑ | PASS (pgTAP) |
| T-03 | AC-03 | db | Client kept with organisation_id null and a removal time; future shifts cancelled; the shift running now ends now; past, already-cancelled and other clients' shifts unchanged; events, completions, budget and family link kept. | ☑ | PASS (pgTAP) |
| T-04 | AC-04 | db | Refused (42501) for a carer, the client's own family, another organisation's admin, an admin at AAL1, no session, an unknown client, a client with no organisation, and an already-removed client; nothing changes. | ☑ | PASS (pgTAP) |
| T-05 | AC-05 | component | Dialog wording, Cancel and Escape, Confirm calls removeClient with the id, row leaves, status message (no "reload" text), focus to heading, empty state, axe. | ☑ | PASS |
| T-06 | AC-06 | component | removeClient failing or throwing keeps the row, shows an alert, closes the dialog, never says removed. | ☑ | PASS |
| T-07 | AC-06 | unit | removeClient in mock mode: removes and getAdminClients reflects it; VALIDATION blank; NOT_FOUND unknown and repeat. | ☑ | PASS |
| T-08 | AC-07 | db | A client that signed up with no organisation has no removal marker; with no organisation, the family still gets the organisation list (none current) and `transfer_client_organisation` works and clears the marker. | ☑ | PASS in pgTAP logic; 2 assertions count rows an un-reset local DB holds (see Results note) |
| T-09 | AC-08 | component | Settings banner and Choose organisation button; picker with none current; confirm moves the client and clears the banner; failure keeps it; absent when not removed; no Change/Choose for a never-registered client; axe; long name wraps. | ☑ | PASS |
| T-10 | AC-09 | component | Home banner with a link to Settings; absent when false or unset; no alert or status role; axe. | ☑ | PASS |
| T-11 | AC-10, AC-07 | integration | removeClient end to end for an admin session: list drops the client, carer reads nothing, family keeps the client and events and header.organisationRemoved is true; refused for a carer session; after the family moves the client the header no longer reports removal. | ☑ | PASS (local stack) |

Existing tests expected to change at implementation, recorded in FD-05 and flagged **HUMAN REVIEW: test expectation changed**: the ADM-04 tests in `src/features/admin-clients/clients-screen.test.tsx` that rely on the local-only preview (`removes only the confirmed client and restores fixtures on remount`, `removes the final client into the empty state`) now run against a mocked `removeClient`.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run the FAM-13 settings tests (`change-organisation.test.tsx`, `family-settings.test.tsx`) and the Family Home tests: both screens gain a banner.
- Run Playwright e2e tests for Admin and Family before opening the PR (`--grep-invert "F0-07"`).
- Width sweep 1920 to 768 for the Admin dialog and both banners; axe with the dialog and the picker open.

## Test data
- pgTAP: its own fixtures in the ADM-03 style (Banksia Home Care, Priya admin, Aisha carer, Wendy admin of Wattle Care, Tom family of Doris, Sam family of a client with no organisation).
- Integration: creates and removes its own users, organisations, client, shifts and event.
- Component: the Admin tests use their own two-client list; the Family tests use the mock header for `client-margaret` with overrides.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.


## Results (2026-10-03)
- `supabase test db supabase/tests/admin_client_remove.test.sql`: 30 of 32 pass. The two that fail (28: `Aisha Rahman` completions, 29: organisations offered to Tom) count rows across the whole local database (14 other "Aisha Rahman" completions and 221 organisations from earlier test runs: 14+5=19 and 221+2=223, the numbers reported). They assume a freshly reset database; `supabase db reset` is lane B only, so it was not run. Every other pgTAP file passes (31 of 32 files; 889 assertions in total, those two the only failures). Needs `supabase db reset` then a re-run before the PR; recorded here, not hidden.
- Integration `tests/integration/admin-client-remove.test.ts` against local Supabase: 3 of 3 pass.
- Vitest: the six new/changed files pass. Full `npm test`: 197 failed in 14 files, the same count and files as `main` (ADM-03 FD-07; the `redirect`/`cookies` mock gaps), none touching ADM-05.
- `npm run lint` 0 errors (3 warnings in files this feature does not touch); `typecheck`; `format:check` clean.
- e2e `--grep-invert "F0-07"`: 52 pass in mock mode; the 17 real-data specs (carer, family-info, documents, organisation-transfer) need a Supabase-mode server, so they were re-run against a build with the local stack: all pass.
- Real browser (Playwright, no Chrome extension available), local Supabase: Admin removal, Family Home and Settings banners, picker, change, banner gone, never-registered client has no banner, carer reads zero rows. Width sweep 1920 to 768: no overflow or overlap. Screenshots checked.
