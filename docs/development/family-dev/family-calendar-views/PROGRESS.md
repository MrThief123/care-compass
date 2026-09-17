# Progress — FAM-04 Family Calendar — day, week and month views

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D8–D9
Branch: `feature/family-calendar-views` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-11 — NOT STARTED
- FAM-UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/calendar` with URL params `view` (day|week|month) and `date`.
- Header range label ('30 Nov – 6 Dec 2026') and prev/next navigation (not drawn — PROPOSED chevrons; confirm).
- Segmented control D / W / M, default W.
- Week view: columns MON–SUN with day number, today column highlighted (brand-pale), hour gutter 07:00–18:00, event blocks with time and title and left stripe.
- Day view: single column with the same block style.
- Month view: calendar cells (default, today, selected, has-events, out-of-month).
- Selecting a day sets `date` (consumed by FAM-05 Tasks panel).

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/calendar/page.tsx`, `src/components/shared/calendar/week-view.tsx`, `src/components/shared/calendar/month-view.tsx`, `src/lib/dates/ranges.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
