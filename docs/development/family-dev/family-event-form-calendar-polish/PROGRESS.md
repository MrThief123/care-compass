# Progress — FAM-16 Family — Event form and calendar polish

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D18
Branch: `feature/family-event-form-calendar-polish`
PR target: `main`
Last updated: 2026-10-02 (claimed; CHG-051 recorded)

## Blockers
- None. No open decisions; the human approved scope and the end-time rules in-session on 2026-10-02.
- For the human in the PR: FD-02 (flagged Lane S edit to `DatePickerGrid` and `EventForm`).

## Dependencies status
- FAM-06, FAM-07, FAM-14, FAM-15, CAR-07, UI-01, UI-02 — MERGED to main.

## Completed
- Claimed; baseline recorded (FD-01)

## In progress
- Docs pack, then tests first

## Remaining
- Tests first, implementation, local suites, browser sweep, status page

## Acceptance criteria status
- 0 / 11 MET

## Tests
- Baseline on clean `main` with `DATA_SOURCE=mock`: 2463 passed, 0 failed (FD-01).

## Files changed
- Docs only so far.

## Decisions
- See DECISIONS.md and root CHG-051

## Problems encountered
- `.env.local` sets `DATA_SOURCE=supabase`, which makes 150 mock-based unit tests fail (FD-01).

## Assumptions
- Planned day D18 (not asked of the human).

## Next action
- Write tests first from TEST_PLAN.md.

## Ready for PR
- No
