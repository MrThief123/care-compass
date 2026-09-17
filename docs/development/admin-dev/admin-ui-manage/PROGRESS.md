# Progress — ADM-UI-02 Admin Manage screen (UI)

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D4–D5
Branch: `feature/admin-ui-manage` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — NOT STARTED
- UI-01 — NOT STARTED
- UI-02 — NOT STARTED
- UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/manage` inside the admin layout.
- Staff column (290px) and Clients column (290px) with search and `SelectableListRow`s.
- Assign shift panel: summary 'Aisha Rahman → Margaret' + Clear; Date `DatePickerGrid` with dots; Time slot `ChipGroup` incl. Custom; `InlineAlert` overlap warning computed from fixture shifts; Cancel + Assign shift (local only).
- No Repeat control (D31).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/manage/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE ADM-UI-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
