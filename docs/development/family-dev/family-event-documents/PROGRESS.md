# Progress — FAM-08 Family — Event documents (file tiles)

Status: MERGED TO DEV (merged to `main` in #184, 2026-10-01; FD-01's Lane B follow-up — Add event's uploads can't link to the event on save — is still open and not tracked as a new DEVELOPMENT_PLAN row)
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-event-documents`
PR target: `main` (CHG-036; `family-dev` is retired)
Last updated: 2026-10-01

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
- A Lane B follow-up (new migration) to let Add event's uploads be linked to the new event on save
  (DECISIONS.md FD-01) — out of this PR's reach under folder ownership (`docs/AGENT_REFERENCE.md`:
  `supabase/**` has no dashboard-feature carve-out).
- T-01 (e2e) needs to actually be run against a local Supabase stack (see Problems encountered).

## Acceptance criteria status
- 2 / 3 MET (AC-02, AC-03). AC-01 implemented and its e2e test written, but not yet run — see below.

## Tests
- Written: 3 / 3 (T-01 e2e, T-02/T-03 component — see TEST_PLAN.md's note on write order)
- Passing: T-02, T-03 (`npx vitest run src/features/family-event-form/event-documents.test.tsx`: 6/6,
  includes an extra failed-open case and an axe check beyond the 3 ACs)
- Failing: none
- Not run: T-01 (`tests/e2e/family-event-documents.spec.ts`) — this session's environment has no
  Docker, so `supabase start` isn't available and the local-stack-gated Playwright spec could not be
  executed. Written to the same pattern as FAM-09's `family-client-info.spec.ts` (seeds an org/family
  member/client/event via the service-role client, signs in, uploads, asserts the tile, a reload, and
  the `documents` row's `event_id`). **HUMAN REVIEW: run `npx supabase start` then
  `npx playwright test tests/e2e/family-event-documents.spec.ts` before this is READY FOR PR.**
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
- See DECISIONS.md FD-01 (Add event's uploads cannot be linked on save this PR — HUMAN REVIEW)
- See DECISIONS.md FD-02 — **HUMAN REVIEW: test expectation changed.** Fixed a stale FAM-UI-03 page
  test (`edit/page.test.tsx`) left broken by this feature's real 'Add file' behaviour: it now chooses
  a file via the hidden input instead of only clicking the tile, so it actually reaches
  `uploadDocument`'s mock-mode "Documents are not available yet." message. No behaviour changed.
  Full suite green after the fix (`DATA_SOURCE=mock npx vitest run`: 185 passed, 29 skipped).

## Problems encountered
- **T-01 (e2e) could not be run this session: no Docker, so no local Supabase stack.** The spec is
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
- Human: review FD-01 (Add event's upload limitation — ship as-is, or authorise/assign the Lane B
  migration first); run T-01 against a local Supabase stack and confirm it's green; then this is
  READY FOR PR.

## Ready for PR
- No — pending the human review above and T-01 actually being run.
