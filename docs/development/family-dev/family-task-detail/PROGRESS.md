# Progress — FAM-15 Family — Task detail

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-task-detail` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-29 — Which nurse is shown on an event
- OQ-10 — Status behaviour and undo

## Dependencies status
- F0-11 — NOT STARTED
- F0-13 — NOT STARTED
- FAM-UI-07 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/tasks/[occurrenceKey]`.
- '< Back to Task log' link; title (Title/Page); subline 'Monday 30 November 2026 · Assigned to Aisha R.'.
- Status card: pill ('Done · Aisha R.') and 'Completed at 09:14' when done; planned/overdue shows pill only.
- Description card with 'Edit' link → FAM-07 edit route.
- Documents card with file tiles (read-only here).
- Wire chevrons from Overdue card, Recent activity, Log panel and task log rows.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page.tsx`, `src/features/task-detail/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-29, OQ-10; then complete dependencies, run START FEATURE FAM-15, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
