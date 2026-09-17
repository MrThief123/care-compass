# Progress — ADM-06 Admin — Manage: staff and client selection

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-manage-selection` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-06 — NOT STARTED
- ADM-UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/manage`; Staff column (290px) 'Search staff'; Clients column (290px) 'Search clients'.
- Selectable list rows: avatar + name; selected = solid #07727D with white text and check; hover = tint.
- Assign shift panel header with summary 'Aisha Rahman → Margaret' and 'Clear' (panel body is ADM-07).
- Selection state in URL (`staff`, `client`).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/manage/page.tsx`, `src/features/admin-manage/selection-columns.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE ADM-06, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
