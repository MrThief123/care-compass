# Progress — FAM-06 Family — Add event (Enter event)

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-add-event` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-22 — Event fields
- OQ-12 — Recurrence options and plan horizon
- OQ-10 — Status behaviour and undo

## Dependencies status
- F0-09 — NOT STARTED
- F0-11 — NOT STARTED
- FAM-UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- 'Enter event' primary button in the Home right column linking to `/family/[clientId]/events/new`.
- Form fields per design: Date (input with calendar icon), Recurring (select), Description (textarea), Documents (file tiles — upload handled by FAM-08, rendered as disabled-absent until merged).
- Additional fields required by data model pending OQ-22 (title, start time, duration).
- 'Pick a date' side panel month grid with dots on days that already have events; selected day filled.
- Save event (primary) and Cancel (secondary) buttons; Cancel returns to previous page.
- Status chips excluded from Add (new events are Planned) — PROPOSED, subject to OQ-10.
- Zod validation shared with server action; plain-language field errors.

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 0 / 5
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/events/new/page.tsx`, `src/components/shared/event-form/*`, `src/server/events/actions.ts`, `src/server/events/schemas.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-22, OQ-12, OQ-10; then complete dependencies, run START FEATURE FAM-06, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
