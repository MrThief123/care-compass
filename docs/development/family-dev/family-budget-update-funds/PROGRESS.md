# Progress — FAM-11 Family — Update funds

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: POST-SPRINT · planned —
Branch: `feature/family-budget-update-funds` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-05 — Who can add funds and record spending; Budget History contents
- OQ-04 — Funding model: buckets, categories and periods
- OQ-19 — Figma access and remaining design gaps

## Dependencies status
- FAM-10 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- 'Update' primary button on Funds by source.
- Update form (modal or panel — design required): bucket, amount, date, description; calls `add_funds`.
- Success updates cards and History without full reload.

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/family-budget/update-funds.tsx`, `src/server/budget/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-05, OQ-04, OQ-19; then complete dependencies, run START FEATURE FAM-11, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
