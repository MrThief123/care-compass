# Test Plan — F0-29 Tags on events and documents

## Approach
Tests first (TESTING.md §2). Titles start `[F0-29][AC-xx]`. Run, confirm they fail for the right reason, then implement.

| Test ID | Covers | Level | File | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-03, AC-14 | unit | `src/server/tags/tag-input.test.ts` | ☑ | failing (right reason) |
| T-02 | AC-01, AC-02, AC-06, AC-07, AC-09, AC-14 | unit (contracts, mock + faked Supabase) | `src/server/tags/tags.test.ts` | ☑ | failing (right reason) |
| T-03 | AC-05, AC-14 | database (pgTAP) | `supabase/tests/tags.test.sql` | ☑ | failing (right reason) |
| T-04 | AC-01, AC-03, AC-16 | component | `src/features/tags/tag-picker.test.tsx` | ☑ | failing (right reason) |
| T-05 | AC-01, AC-02, AC-04, AC-06 | component | `src/features/family-event-form/event-form-tags.test.tsx` | ☑ | failing (right reason) |
| T-06 | AC-07, AC-08, AC-09, AC-15, AC-16 | unit + component | `src/features/family-task-log/task-log-tags.test.tsx` | ☑ | failing (right reason) |
| T-07 | AC-10–AC-13, AC-15, AC-16 | component | `src/features/client-documents/client-documents-tags.test.tsx` | ☑ | failing (right reason) |
| T-08 | AC-01, AC-05, AC-07 | integration (local Supabase) | `tests/integration/shared-event-document-tags.test.ts` | ☑ | failing (right reason) |

## Regression scope
FAM-06/FAM-07/CAR-07 event form, FAM-UI-07/CAR-06 Task log, F0-25 Documents. Suite: Vitest full (`DATA_SOURCE=mock`), typecheck, lint, prettier, `supabase test db`, integration, build.

## Results
- 2026-10-19, tests first: T-01–T-08 written and run before any code. 33 of 39 unit/component tests fail for the right reason: `tag-input`, `tag-picker`, `tag-list`, `src/server/tags/queries` and `actions` do not exist; the event form has no Tags field; the Task log has no Tag select or `tag` param; the Documents page has no Tags column, Tag filter or Edit tags. The 6 that pass already are the "behaves as before" checks (carer form sends no `tags`, no Tag select or Tags column without tags, `createEvent` without tags makes no tag call), which must stay green. T-03 (pgTAP) and T-08 (integration) not run: Docker is not running, so there is no local Supabase stack (T-08 fails with `fetch failed`).
