# Test Plan — CAR-09 Carer — Settings

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Same layers as FAM-12, so the structure of its tests is the model.

## Test levels used
- **component** → `src/features/carer-settings/*.test.tsx` (Vitest + Testing Library)
- **unit (action)** → `src/server/profiles/*.test.ts` (Supabase client faked)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase; skipped on a hosted project)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | A signed-in carer's `getCarerContactDetails` returns 'Aisha Rahman', her phone, email and Role from `job_title` | ☑ | GREEN (guard: passes on existing code) |
| T-02 | AC-02 | db | Aisha updates her own phone (1 row) but job_title, role, organisation_id, is_active are rejected (42501); another carer's row is unchanged | ☑ | GREEN (guard: FAM-12 grant already covers carers) |
| T-03 | AC-03 | unit | `requestOwnPasswordReset` sends to the session's login email, not the contact email (existing FAM-12 action, asserted for a carer session) | ☑ | GREEN (guard) |
| T-04 | AC-03 | component | Reset calls `requestOwnPasswordReset`, then shows the sent message; on failure it shows the error and not the sent message | ☑ | RED |
| T-05 | AC-04 | component | Save calls `updateCarerContactDetails` once with trimmed name, phone, email, then shows 'Saved.' and locks the fields | ☑ | RED |
| T-06 | AC-05 | component | A failed save keeps the fields editable with what was typed and announces the error; no 'Saved.' | ☑ | RED |
| T-07 | AC-05 | unit | `updateCarerContactDetails` refuses a bad name/phone/email with per-field messages and does not touch the database | ☑ | RED |
| T-08 | AC-04, AC-02 | unit | It writes only first_name, last_name, phone, email to the session user's own row (no address, job_title, role, id from the caller); a hidden row (no data back) is a failure | ☑ | RED |
| T-09 | AC-04 | integration | A saved phone and name read back through the contract; login email and job_title unchanged; contact email may differ from login | ☑ | RED (missing action) |
| T-10 | AC-02 | integration | Through the real API, Aisha cannot change her job_title or role; a signed-out reset/save refuses | ☑ | GREEN (guard) for the API job-title/role checks; RED for the signed-out save (missing action) |

## Where each test lives
T-01, T-09, T-10: `tests/integration/carer-settings-profile.test.ts` (T-10's signed-out case is under AC-05). T-02: `supabase/tests/carer_profile_update.test.sql`. T-03, T-07, T-08: `src/server/profiles/carer-actions.test.ts`. T-04 to T-06: `src/features/carer-settings/carer-settings-wiring.test.tsx`.

Guard tests (T-01, T-02, T-03, and the API half of T-10) pass before implementation because the behaviour already exists from FAM-12 and CAR-UI-04. They are here so the carer case is proved and cannot regress; the red ones drive the work: 18 of 20 in the unit/component files, and 2 of 4 integration cases.

## Existing tests affected
- `src/features/carer-settings/carer-settings.test.tsx` T-09/T-10 (CAR-UI-04, local Save and Reset). Once the view calls the actions they must mock `@/server/profiles/actions`, as FAM-12 did for `family-settings.test.tsx` (FAM-12 FD-06). Record as a test change and flag **HUMAN REVIEW: test expectation changed** at that point. Not touched in the tests-first session.

## Regression scope
- Full unit/component suite, `supabase test db`, and the integration suite against local Supabase (see `local_supabase_image_pulls`; do not point at the hosted project).
- Playwright e2e for the carer dashboard before the PR. Use `--grep-invert "F0-07"`; do not run auth specs against the hosted project.

## Test data
- F0-16 seed data is not merged. Integration and pgTAP tests create their own users (Aisha Rahman, Registered Nurse, Banksia Home Care), as FAM-12 does. Synthetic only.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
