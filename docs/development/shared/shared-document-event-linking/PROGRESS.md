# Progress — F0-23 Link uploaded documents to a new event

Status: MERGED TO DEV (merged to `main` in #200, 2026-10-02)
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-document-event-linking`
PR target: `main`
Last updated: 2026-10-02

## Blockers
- None.

## Dependencies status
- F0-11, F0-13, FAM-08 — MERGED

## Acceptance criteria status
- 8 / 8 MET

## Next action
- None. Real-browser check done (below); merged in #200.

## Ready for PR
- Done: merged in #200.

## Tests written first
- 2026-10-02: T-01, T-02 (`supabase/tests/document_event_linking.test.sql`, 24 assertions). Run against the local stack: fail because `link_document_to_event` does not exist (the script stops at the first `has_function_privilege` call). 
- 2026-10-02: T-03 (`src/server/documents/link-documents.test.ts`, 9 tests), T-04 (`src/features/family-event-form/event-form-add-documents.test.tsx`, 8 tests), T-05 (`tests/integration/document-event-linking.test.ts`, 4 tests, run against the local stack). All fail for the right reason: `linkDocumentsToEvent` does not exist and Add event neither uploads without an event id nor links. Typecheck errors are the same missing export.

## Checks run locally (CI down)
Run after merging `main` (up to date at 09c54f7) in this worktree, local Supabase stack, 2026-10-02:
- `supabase test db` (all 21 files, 682 assertions): pass, including `document_event_linking.test.sql` (24).
- `npm run verify` (lint, typecheck, prettier, `vitest run`): lint 0 errors / 2 existing warnings; typecheck clean; prettier clean; 195 files / 2408 tests passed, 33 files skipped (integration, no local env in that run).
- `vitest run tests/integration` with the local env from `npx supabase status -o env`: 37 files passed, 1 failed. The failure is `shared-dev-seed-data.test.ts` ([F0-16][AC-01] and [AC-03]): the seed test finds extra `documents` rows in the local database. `documents` rows cannot be deleted (append-only), so every documents integration run, including this feature's, leaves rows behind. Same failure F0-22 recorded; not caused by changed code. Not re-run on `main`.
- Migration: `20261002005045_document_event_linking.sql`, created with `supabase migration new`, applied locally with `supabase migration up --local`. Adds one function; no table, column, grant or policy change, so no other feature's reads change.
- `database.types.ts`: one entry added by hand. `npm run db:types` was not used because it reorders and adds unrelated tables (budget thresholds) from other branches.

## Real-browser check and re-merge (2026-10-02)
- Merged `origin/main` again (62e61ed, includes the FAM-08 AC-01 fix, PR #199) with no conflicts; `npm run verify` re-run after the merge: 195 files / 2408 tests passed, 33 skipped.
- Real browser (Playwright, Chromium) against the local stack with `DATA_SOURCE=supabase`, signed in as Helen on Margaret:
  - Add event with two files (`care-plan.pdf`, `photo.png`) then Save: both `documents` rows linked to the new event; Edit event shows both tiles.
  - Forced failure (one uploaded file detached in the database before Save): the event is saved once, the form is replaced by the "didn't attach" alert with Continue, and Save is gone, so the event cannot be created twice.
  - Edit event at 1920, 1440, 1280, 1024 and 768 px: no horizontal overflow.
- The owner also tried the flow by hand and found it fine.
