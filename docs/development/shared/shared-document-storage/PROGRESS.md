# Progress — F0-13 Client document storage

Status: MERGED TO DEV
Owner: MrThief123
Lane: B — Backend
Sprint: SPRINT · planned D6–D7
Branch: `feature/shared-document-storage`
PR target: `main` (merged in #131, 2026-09-27; CHG-036)
Last updated: 2026-09-30

## Blockers
- None — OQ-01, OQ-26 ANSWERED

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-11 — MERGED TO DEV

## Completed
- Claimed on `feature/shared-document-storage` (2026-09-27)
- Migration `20260927020000_documents.sql`: `documents` table, RLS, the append-only
  delete-reject trigger, `can_access_client_documents()`, the `client-documents` bucket and
  its own RLS (mirrors the row's)
- `src/lib/documents/validate-document.ts`: PD-051's type/size allowlist plus a
  file-signature check, pure and unit-tested
- `src/server/documents/actions.ts`: `uploadDocument`, `getDocumentUrl`, `detachDocument`
  (Server Actions), `src/server/documents/db.ts` (typed access to the new table, FD-04)
- `src/server/documents/queries.ts` (the existing `getEventDocuments`/`getClientDocuments`
  contract, UI-04/FAM-UI-04) is untouched — wiring its Supabase mode is a later feature
  (FAM-08, FAM-09, FAM-15, CAR-04), not this one (`src/server/data-source.ts`'s own
  convention: "each Phase 3 wiring feature adds the supabase branch for the functions it
  wires")
- All tests written and passing (see Tests)

## In progress
- None

## Remaining
- Human review of FD-01 (whether upload should be shift-restricted for carers, like
  `can_edit_care_events`, or general access as built)
- Push and open the PR to `main`, only with the human's approval

## Acceptance criteria status
- 5 / 5 MET

## Tests
- Written: 5 / 5 (T-01 to T-05), plus 11 unit tests for the file-validation module and
  several supplementary db/integration assertions (see TEST_PLAN.md "Added tests")
- Passing (2026-09-27): all of them.
  - `supabase test db`: whole suite PASS; `documents.test.sql` 43 assertions (T-04, plus
    the access-function matrix, the mime/size CHECK constraints, column-grant restriction,
    the delete-reject trigger for both an ordinary user and the table owner/service role,
    and `storage.objects` RLS in both directions)
  - `vitest run src/lib/documents/validate-document.test.ts`: 11 / 11
  - `vitest run tests/integration/documents.test.ts` (against local Supabase, `DATA_SOURCE=supabase`): 6 / 6 — including fetching the real signed URL and comparing bytes, and the AC-05 detach flow
  - Full suite: 1926 passed, 22 skipped, 0 failed
- Lint: 0 errors (one import-order warning, autofixed). Typecheck: clean. `npm run build`: succeeds.
- Two genuine test-writing mistakes found and fixed on first run — see DECISIONS.md FD-05.
- Process note: the migration, pgTAP tests, validation module and actions were all written
  in one pass before anything was run, not strictly tests-first (DECISIONS.md, "Process note").

## Files changed
- Migration: `supabase/migrations/20260927020000_documents.sql`
- Tests: `supabase/tests/documents.test.sql`, `src/lib/documents/validate-document.test.ts`,
  `tests/integration/documents.test.ts`
- Code: `src/lib/documents/validate-document.ts`, `src/server/documents/actions.ts`,
  `src/server/documents/db.ts` (all new)
- Docs: this folder

## Decisions
- See DECISIONS.md (FD-01 to FD-05). FD-01 wants human confirmation.

## Problems encountered
- Storage (a separate HTTP service) can't be reached from a Postgres function, so upload
  can't be one atomic `SECURITY DEFINER` function the way `transfer_client_organisation` is.
  `uploadDocument` does upload-then-insert instead, with the object removed if the row
  can't be created — exactly the flow ARCHITECTURE.md §7 (step 6) already documents, so
  this needed no ARCHITECTURE.md change.
- Same `database.types.ts` gap F0-12 and F0-17 hit (FD-04): not regenerated here either.
- Two test-writing mistakes on first run (FD-05): a `has_table` overload resolved to the
  wrong check, and two `throws_ok` assertions expected an exception that RLS doesn't raise
  for a filtered-out row.
- CI's `unit` job uses a hosted Supabase project without this migration (the same finding
  F0-17 made): `tests/integration/documents.test.ts` is gated on a local URL, the existing
  repo convention (F0-11, FAM-12, FAM-13, F0-17), so it skips in CI and was run locally
  against `supabase start` instead.

## Assumptions
- PROPOSED items in PRD.md (the 60-second signed URL, MIME-signature checking "where
  feasible") are built as written; flagged for review in the PR.
- `uploaded_by`/`event_id` follow the same `on delete set null` pattern as `care_events.created_by`.

## Next action
- Human reviews FD-01; on approval, push and open the PR to `main`.

## Ready for PR
- Not yet: READY FOR PR once the human has reviewed FD-01.
