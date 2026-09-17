# Progress — FAM-10 Family — Budget overview and history

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-budget-overview` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-04 — Funding model: buckets, categories and periods
- OQ-05 — Who can add funds and record spending; Budget History contents

## Dependencies status
- F0-12 — NOT STARTED
- FAM-UI-05 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/budget`.
- Card 'Funds by source' with bucket cards (reuse BudgetBucketCard) — 'Update' button slot reserved for FAM-11.
- History table: Date · Description · Amount (e.g. '3 Nov 2026 · NDIS quarterly plan top-up · +$6,000'), newest first.
- Wire Home 'View breakdown' link to this route.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/budget/page.tsx`, `src/features/family-budget/history-table.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-04, OQ-05; then complete dependencies, run START FEATURE FAM-10, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
