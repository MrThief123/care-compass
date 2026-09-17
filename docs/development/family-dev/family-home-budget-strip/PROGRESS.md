# Progress — FAM-03 Family Home — Budget strip

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-budget-strip` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-03 — Budget threshold percentages
- OQ-04 — Funding model: buckets, categories and periods

## Dependencies status
- F0-12 — NOT STARTED
- FAM-UI-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Card: title 'Budget', aggregate line '$X remaining of $Y · Z% used', 'View breakdown' link (to Budget, FAM-10; omitted until merged).
- One bucket card per bucket: Label/Caps bucket name, Metric/Large remaining, 'of $total · N% used', progress bar.
- Alert state (≥ alert threshold): alert border and ground, warning icon top-right, remaining and bar in alert colours.
- Empty state when no buckets (OQ-24 copy PROPOSED 'No funding set up yet').

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/family-home/budget-strip.tsx`, `src/components/shared/budget-bucket-card.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-03, OQ-04; then complete dependencies, run START FEATURE FAM-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
