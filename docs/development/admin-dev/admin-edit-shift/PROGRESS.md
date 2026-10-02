# Progress — ADM-09 Admin — Edit, extend or cancel a shift

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D17
Branch: `feature/admin-edit-shift`
PR target: `main`
Last updated: 2026-10-03

## Blockers
- None. OQ-27 = PD-053 and OQ-19 = PD-052 are answered.

## Dependencies status
- ADM-07 — MERGED

## Completed
- Feature docs rewritten with the human's answers (FD-01 to FD-05): PRD, USER_STORIES, ACCEPTANCE_CRITERIA (AC-01 to AC-09), TEST_PLAN, DECISIONS.
- Tests written first (see Tests).

## In progress
- None

## Remaining
- Migration, `updateShift` / `cancelShift`, `ManageShift.editable`, Edit panel and Cancel dialog on Manage, mock behaviour; make the tests pass; PR body notes (design gap, Lane B folder precedent, copy).

## Acceptance criteria status
- 0 / 9 MET

## Tests
- Written: 10 / 10 (T-01 to T-10)
- Passing: 0
- Failing: all, for the expected reason (no migration, no actions, no editable shift UI)

## Files changed
- None yet. Likely files: `supabase/migrations/<ts>_shifts_admin_edit.sql`, `src/server/admin/manage-actions.ts`, `src/server/admin/manage-queries.ts`, `src/server/admin/edit-shift-schema.ts`, `src/features/admin-manage/manage-screen.tsx`, `src/features/admin-manage/edit-shift-panel.tsx`, `src/lib/supabase/database.types.ts` (if needed)

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implementation session: read this folder, then make T-01 to T-10 pass (tests are committed and failing).

## Ready for PR
- No
