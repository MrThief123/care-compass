# Progress — FAM-08 Family — Event documents (file tiles)

Status: MERGED TO DEV (merged to `main` in #184, 2026-10-01; FD-01's follow-up, linking Add event's uploads on save, was delivered by F0-23 in #200)
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-event-documents`
PR target: `main` (CHG-036; `family-dev` is retired)
Last updated: 2026-10-02 (AC-01 follow-up on `fix/family-event-documents-ac01`)

## Blockers
- None — OQ-26 ANSWERED

## Dependencies status
- F0-13 — MERGED TO DEV
- FAM-UI-03 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- `OpenDocumentTile` (`src/features/family-event-form/open-document-tile.tsx`): wraps the existing
  read-only `DocumentTile` (FAM-UI-07) to open its signed URL in a new tab on click (AC-03), used by
  both the event form and Task detail.
- `EventDocuments` (`src/features/family-event-form/event-documents.tsx`): the Documents section of
  the Edit/Add event form — existing tiles (openable), '+ Add file' (hidden file input, validates and
  uploads through `uploadDocument`, shows the contract's error inline, AC-01/AC-02) — replacing the
  stub block `EventFormScreen` had carried since FAM-UI-03.
- `EventFormScreen` and `TaskDetailView` wired to the above (Task detail's tiles are now openable too,
  consistent with AC-03 applying wherever a tile is shown).
- Edit event: fully working (upload, inline validation error, open via signed URL). Add event: the Add
  file tile explains "Save the event first, then open it again to add files." instead of uploading —
  see DECISIONS.md FD-01 for why.

## In progress
- None

## Remaining
- None. The Add event linking follow-up (DECISIONS.md FD-01) shipped as F0-23 (CHG-045, #200).

## Acceptance criteria status
- 3 / 3 MET. AC-01 MET on 2026-10-02: T-01 run against the local Supabase stack and passing.

## Tests
- Written: 3 / 3 (T-01 e2e, T-02/T-03 component — see TEST_PLAN.md's note on write order)
- Passing: T-01 (2026-10-02, see below), T-02, T-03 (`npx vitest run src/features/family-event-form/event-documents.test.tsx`: 6/6,
  includes an extra failed-open case and an axe check beyond the 3 ACs)
- Failing: none
- T-01 run 2026-10-02 against the local Supabase stack (`next build` with `DATA_SOURCE=supabase`,
  then `E2E_PORT=3210 E2E_DATA_SOURCE=supabase npx playwright test tests/e2e/family-event-documents.spec.ts`).
  First run failed in the spec's own seed (care event `starts_at` had milliseconds; DECISIONS.md FD-03),
  fixed the seed, then 1 passed, and 3/3 passed with `--repeat-each 3`. The UI path and the
  `documents.event_id` assertion needed no change.
- 2026-10-02 regression, with the local stack's env exported: `DATA_SOURCE=mock npx vitest run src
  tests/unit` 188 files / 2376 tests passed; `npm run test:integration` 173 passed / 3 failed, none
  FAM-08 — `budget-thresholds` and `shared-sign-up` pass when run alone (they collide with parallel
  files sharing seed rows); `shared-dev-seed-data` fails on an extra `smd cheat sheet final.pdf` that
  seed carer Aisha Rahman uploaded to the local stack on 2026-10-01 (manual testing; documents are
  append-only, so only `supabase db reset` clears it). `npx tsc --noEmit`, eslint, prettier clean.
- Regression: `npm run lint`, `npx tsc --noEmit`, `npx prettier --check` on all changed/new files — all
  clean. Full `npm test` was noisy (145 failed / 2186 passed on this branch vs. 147 failed / 2184
  passed on the same commit with this feature's changes stashed out — i.e. pre-existing on `main`,
  not caused by this feature; largely `task-detail-view.test.tsx` / `task-detail-view.fam15.test.tsx`,
  `TypeError: Cannot read properties of undefined (reading 'eventId')` from `getOccurrence`, reproduced
  identically with this branch's changes removed). The files this feature actually touches or depends
  on (`event-form-edit/cost/return.test.tsx`, `document-tile.test.tsx`, `task-detail-origin.test.ts`,
  `event-form-add.test.tsx`, `event-documents.test.tsx`) pass cleanly in isolation — 98/98.

## Files changed
- New: `src/features/family-event-form/open-document-tile.tsx`,
  `src/features/family-event-form/event-documents.tsx`,
  `src/features/family-event-form/event-documents.test.tsx`,
  `tests/e2e/family-event-documents.spec.ts`
- Edited: `src/features/family-event-form/event-form-screen.tsx` (documents slot now uses
  `EventDocuments`), `src/features/family-task-detail/task-detail-view.tsx` (tiles now use
  `OpenDocumentTile`)
- No changes to `src/server/documents/**` or any migration were needed — F0-13's existing
  `uploadDocument`/`getDocumentUrl`/`getEventDocuments` were already complete for this feature's scope.

## Decisions
- See DECISIONS.md FD-03 (T-01 seed fix, 2026-10-02)
- See DECISIONS.md FD-01 (Add event's uploads cannot be linked on save this PR — HUMAN REVIEW)
- See DECISIONS.md FD-02 — **HUMAN REVIEW: test expectation changed.** Fixed a stale FAM-UI-03 page
  test (`edit/page.test.tsx`) left broken by this feature's real 'Add file' behaviour: it now chooses
  a file via the hidden input instead of only clicking the tile, so it actually reaches
  `uploadDocument`'s mock-mode "Documents are not available yet." message. No behaviour changed.
  Full suite green after the fix (`DATA_SOURCE=mock npx vitest run`: 185 passed, 29 skipped).

## Problems encountered
- (Resolved 2026-10-02: T-01 now run and passing — see Tests.) **T-01 (e2e) could not be run this session: no Docker, so no local Supabase stack.** The spec is
  written and gated the same way FAM-09's is (`test.skip(!hasLocalSupabase, ...)`), so it will not
  silently pass — it will skip until someone runs it with the stack up. Flagging rather than claiming
  it passes (CLAUDE.md §5 "Never claim something works without running it").
- **Add event cannot actually attach a document to the new event** under the current `documents` grants
  (only `detached_at` is client-updatable after insert) — see DECISIONS.md FD-01. Scoped Edit event to
  work fully; Add event's Add-file tile explains the limitation instead of silently orphaning uploads.
- Tests were not written strictly first this session (TEST_PLAN.md note) — the FD-01 question (can
  Add-mode linking work at all under the current schema?) needed resolving before a test for it could
  be written meaningfully, and resolving it required reading the migration and folder-ownership rules
  first. `EventDocuments`/`OpenDocumentTile` were built, then `event-documents.test.tsx` was written
  against them and run (6/6 pass). Flagging per CLAUDE.md §10 rather than leaving it unstated.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- `supabase/**` has no dashboard-feature carve-out (`docs/AGENT_REFERENCE.md` folder ownership table),
  unlike `src/server/<domain>/`, which is why FD-01's migration need was not acted on directly.

## Next action
- Human: review and merge PR #199 (T-01 seed fix + AC-01 MET).
- Still open, separate follow-up: FD-01 (Add event's uploads can't link to the event on save).

## Ready for PR
- AC-01 follow-up: PR #199 open to `main` (2026-10-02).
