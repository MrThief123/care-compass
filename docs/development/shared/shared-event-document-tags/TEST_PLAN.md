# Test Plan — F0-29 Tags on events and documents

## Approach
Tests first (TESTING.md §2). Titles start `[F0-29][AC-xx]`. Run, confirm they fail for the right reason, then implement.

| Test ID | Covers | Level | File | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-03, AC-14 | unit | `src/server/tags/tag-input.test.ts` | ☑ | passing |
| T-02 | AC-01, AC-02, AC-06, AC-07, AC-09, AC-14 | unit (contracts, mock + faked Supabase) | `src/server/tags/tags.test.ts` | ☑ | passing |
| T-03 | AC-05, AC-14 | database (pgTAP) | `supabase/tests/tags.test.sql` | ☑ | passing |
| T-04 | AC-01, AC-03, AC-16 | component | `src/features/tags/tag-picker.test.tsx` | ☑ | passing |
| T-05 | AC-01, AC-02, AC-04, AC-06 | component | `src/features/family-event-form/event-form-tags.test.tsx` | ☑ | passing |
| T-06 | AC-07, AC-08, AC-09, AC-15, AC-16 | unit + component | `src/features/family-task-log/task-log-tags.test.tsx` | ☑ | passing |
| T-07 | AC-10–AC-13, AC-15, AC-16 | component | `src/features/client-documents/client-documents-tags.test.tsx` | ☑ | passing |
| T-08 | AC-01, AC-05, AC-07 | integration (local Supabase) | `tests/integration/shared-event-document-tags.test.ts` | ☑ | passing |

## Regression scope
FAM-06/FAM-07/CAR-07 event form, FAM-UI-07/CAR-06 Task log, F0-25 Documents. Suite: Vitest full (`DATA_SOURCE=mock`), typecheck, lint, prettier, `supabase test db`, integration, build.

## Results
- 2026-10-19, tests first: T-01–T-08 written and run before any code. 33 of 39 unit/component tests fail for the right reason: `tag-input`, `tag-picker`, `tag-list`, `src/server/tags/queries` and `actions` do not exist; the event form has no Tags field; the Task log has no Tag select or `tag` param; the Documents page has no Tags column, Tag filter or Edit tags. The 6 that pass already are the "behaves as before" checks (carer form sends no `tags`, no Tag select or Tags column without tags, `createEvent` without tags makes no tag call), which must stay green. T-03 (pgTAP) and T-08 (integration) not run: Docker is not running, so there is no local Supabase stack (T-08 fails with `fetch failed`).
- 2026-10-19, after implementation (mock data source; Docker not running, so no local Supabase):
  - `DATA_SOURCE=mock npx vitest run --exclude 'tests/integration/**'`: 265 files, 2963 tests, all pass (39 new for F0-29).
  - `npm run typecheck` clean; `npm run lint` 0 errors (3 warnings in files this branch does not touch); prettier on changed files clean; `npm run build` clean.
  - Dev server (`DATA_SOURCE=mock`): Family Task log `?tag=Medication`, Family Documents, Family Add event and Carer Care log `?tag=Doctors` all render (200) with the Tag select, Edit tags and Tags field as expected.
  - Not run: `npx supabase test db` (T-03), `tests/integration/shared-event-document-tags.test.ts` (T-08), and a real-browser visual check (the Chrome extension did not respond). `database.types.ts` was edited by hand for the three tables and two functions; regenerate with `npm run db:types` once the stack is up.
- 2026-10-20, after merging `main` (23 commits, incl. INT-06 and dependency bumps); local Supabase running, `supabase db reset` (migration and seed apply cleanly):
  - `DATA_SOURCE=mock npx vitest run --exclude 'tests/integration/**'`: 265 files, 2963 tests, all pass. Typecheck clean, lint 0 errors.
  - `npx supabase test db`: 37 files, 1028 tests, PASS (30 new). First run failed one of my own new checks (FD-08) and passed once it was fixed.
  - `tests/integration/shared-event-document-tags.test.ts`: 1/1 pass.
  - Full `tests/integration`: 12 failures in 9 files, the same 12 that fail on `origin/main` against the same database (admin-client-view, budget-thresholds, care-events ×2, family-calendar-tasks-log ×2, family-edit-event, family-home-overdue-activity, family-task-detail ×2, shared-cross-role-sync ×2, shared-dev-seed-data). One extra failure, F0-17 AC-04 sign-up, appeared once and then passed 3/3 run alone (flaky, as F0-28 also recorded).
  - `database.types.ts`: `npm run db:types` output matches the hand-written tag tables and functions; it also lists the internal `client_tag_ids`, now added. The rest of its diff is newer-CLI formatting, not committed.
  - Browser check (Playwright driving installed Chrome; the Chrome extension did not respond), `DATA_SOURCE=mock`, 1280px and 390px: Family Task log with and without `?tag=`, Carer Care log `?tag=Doctors`, Family and Carer Documents, Family Add event. No horizontal overflow and no console errors on any of them. Edit tags → Doctors → Save updated the row; Tag filter Doctors showed "2 of 7 documents". A chosen chip is deep teal (#07727D) with white text and a check mark.
