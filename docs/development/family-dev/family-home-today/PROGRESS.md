# Progress — FAM-01 Family Home — Today day-view timeline

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-today`
PR target: `main`
Last updated: 2026-10-01 (claimed)

## Blockers
- None. OQ-29 is answered (PD-055, 2026-09-17).

## Dependencies status
- F0-11 — MERGED
- F0-16 — MERGED
- FAM-UI-01 — MERGED
- F0-22 (client header wiring and family route guard, added by CHG-042) — MERGED, PR #181

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
- Write the tests first (TEST_PLAN.md), confirm they fail for the right reason, commit `test(family): …`, then stop for the implementation session.

## Ready for PR
- No
