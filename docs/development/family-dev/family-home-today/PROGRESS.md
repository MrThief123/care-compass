# Progress — FAM-01 Family Home — Today day-view timeline

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-today` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-29 — Which nurse is shown on an event

## Dependencies status
- F0-11 — NOT STARTED
- F0-16 — NOT STARTED
- FAM-UI-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/home` page shell with left Today panel region (right column and budget strip are FAM-02/FAM-03).
- Card title 'Today' and right-aligned caption 'Mon 30 Nov · day view'.
- Hour gutter 07:00–18:00, 44px rows; past hours shown in text/muted per design.
- Event blocks positioned by start time and sized by duration with #0C9BA9 left stripe, title (Body/Emphasis), carer name (e.g. 'Aisha R.'), duration ('1 hr', '1 hr 30 min'), status pill at right.
- Empty state when no events today (EmptyState primitive; copy PROPOSED 'Nothing scheduled today').
- Loading skeleton and ErrorState with Retry.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/home/page.tsx`, `src/features/family-home/today-panel.tsx`, `src/features/family-home/position-blocks.ts`, `src/features/family-home/*.test.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-29; then complete dependencies, run START FEATURE FAM-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
