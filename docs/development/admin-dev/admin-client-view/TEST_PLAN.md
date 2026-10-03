# Test Plan — ADM-11 Admin — Client view

## Approach
Tests are written before production code (TESTING.md §2). Run them and confirm they fail for the expected reason before implementing.

## Test levels used
- **component** → `src/**/<name>.test.tsx`
- **unit** → `src/**/<name>.test.ts`
- **db** → `supabase/tests/admin_client_view.test.sql` (pgTAP) and `care_events.test.sql` (two flipped assertions, FD-01)
- **integration** → `tests/integration/admin-client-view.test.ts` (local Supabase, real server actions as an admin session)
- **e2e** → `tests/e2e/admin-client-view.spec.ts` (local Supabase, `E2E_DATA_SOURCE=supabase`)

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | A client's name in the Clients list is a link to `/admin/clients/<id>/home`; Remove still works; ids with odd characters are encoded | ☑ | FAIL (expected: no link yet) |
| T-02 | AC-01 | unit | `adminClientBase` / `adminClientRoutes` build the five screen paths and encode the id | ☑ | FAIL (module missing) |
| T-03 | AC-01, AC-02 | component | The client bar shows the name (long names wrap), "Back to clients" → `/admin/clients`, five nav links with the current one `aria-current`; axe clean | ☑ | FAIL (component missing) |
| T-04 | AC-05 | unit | `assertAdminClientAccess` calls `notFound()` for no row, malformed id and a database error; returns for a readable client; no-op in mock mode | ☑ | FAIL (module missing) |
| T-05 | AC-05 | component | The client layout calls the guard first and renders the bar plus children when allowed | ☑ | FAIL (layout missing) |
| T-06 | AC-02, AC-03 | component | Budget and Edit budget links stay under a given `basePath`; with none they stay under `/family/<id>` | ☑ | FAIL: 2 of 4 (the basePath cases); the 2 default-path cases pass |
| T-07 | AC-04, AC-05 | db | An admin of the client's organisation can insert and update events, add an override, tick and untick (including another's tick), edit client info, insert a document row, add funds; every row names the admin; another organisation's admin and an AAL1 admin are refused everywhere | ☑ | FAIL: 11 of 31 (events, overrides, tick, untick refused until the migration; the other 20 pass already) |
| T-08 | AC-04 | db | `care_events.test.sql`: the two admin-refused assertions now expect success (HUMAN REVIEW) | ☑ | FAIL: 2 of 69 (the two flipped assertions) |
| T-09 | AC-03 | integration | Admin session: `saveBudgetEdit` adds $500 to a bucket; `getFundHistory` shows the entry recorded by the admin's full name | ☑ | PASS already (regression guard: admin budget writes shipped in F0-12) |
| T-10 | AC-04 | integration | Admin session: `saveClientInfoSection`, `createEvent` with a cost, `setOccurrenceDone` and `setOccurrenceUndone` succeed and name the admin | ☑ | FAIL (expected: `createEvent` refused by RLS until the migration) |
| T-11 | AC-05 | integration | Other organisation's admin: `getClientHeaderSummary` throws, `saveBudgetEdit` / `createEvent` / `saveClientInfoSection` refused, nothing changes | ☑ | PASS already (regression guard: refusal holds before and after) |
| T-12 | AC-01, AC-02 | e2e | Click a client's name; Family Home shows in the admin layout with the bar and Back link; move through Home, Info, Calendar, Budget, Care log keeping that client; links never leave `/admin/clients/<id>/` | ☑ | WRITTEN, NOT RUN (needs a build on the local stack, see handoff) |
| T-13 | AC-03, AC-04 | e2e | In the browser: add $500 in Edit budget, History reads "Recorded by <admin>"; edit Description; add an event; tick a task, Care log reads "Done by <admin>" | ☑ | WRITTEN, NOT RUN (needs a build on the local stack, see handoff) |
| T-14 | AC-05 | e2e | Another organisation's admin, an unknown id and a malformed id each show the not-found page | ☑ | WRITTEN, NOT RUN (needs a build on the local stack, see handoff) |

Test titles start `[ADM-11][AC-xx]`.

## Regression scope
- `supabase test db` (all files, esp. care_events, budget, documents, family_client_info, access_control_regression).
- Family and carer component suites (the two views gain a prop) and the Family e2e specs that run in mock mode.
- Admin component suite and `tests/integration/admin-clients.test.ts`, `admin-client-remove.test.ts`.
- Width sweep 1920 to 768 on the client bar and each screen under the admin layout.

## Test data
- pgTAP and integration: their own two organisations, an admin each, one family member, one client with a bucket, an event and a pending task.
- e2e: a fresh organisation, admin (TOTP enrolled through the UI as in `admin-staff-panel.spec.ts`), family member and client per run, cleaned up after.

## Results
See PROGRESS.md.
