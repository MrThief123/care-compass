# Progress — FAM-07 Family — Edit event

Status: IN PROGRESS
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-edit-event` (from `main`)
PR target: `main` (dashboard features now branch from and target `main` directly, not the dev branches)
Last updated: 2026-09-28

## Blockers
- None — OQ-10, OQ-11 and OQ-22 are ANSWERED (root DECISIONS.md: PD-044/CHG-009, PD-045, PD-047)

## Dependencies status
- FAM-06 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/events/[eventId]/edit?occurrence=<originalStart>`; header title 'Edit event'.
- Prefilled EventForm; Status chips Planned / Done / Overdue per OQ-10 resolution.
- Edit scope (this occurrence / this and future / entire series) per OQ-11 — not built until answered.
- Save writes event update or occurrence override; history (completions) untouched.
- Entry points: clicking an event block in FAM-04 and 'Edit' in Task detail (FAM-15).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.tsx`, `src/server/events/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-10, OQ-11, OQ-22; then complete dependencies, run START FEATURE FAM-07, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
