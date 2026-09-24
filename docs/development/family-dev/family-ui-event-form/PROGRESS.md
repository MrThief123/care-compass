# Progress — FAM-UI-03 Family Add / Edit event screens (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-event-form` (created from `origin/family-dev` at 9053abd)
PR target: `family-dev`
Last updated: 2026-09-24

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED
- UI-01 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- Claimed; inspecting kit and writing tests first

## Remaining
- Route `/family/[clientId]/events/[eventId]/edit` inside the family layout.
- Edit route prefilled from fixture; header title 'Edit event'.
- Add route `/family/[clientId]/events/new` with empty form; header title 'Add event' (PROPOSED — not designed).
- Documents: fixture file tiles ('Physio referral.pdf', 'Exercise plan.pdf') + '+ Add file' tile (no upload).
- Save event validates and returns to the previous screen without persisting; Cancel returns without changes.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.tsx`, `src/app/(family)/family/[clientId]/events/new/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-UI-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
