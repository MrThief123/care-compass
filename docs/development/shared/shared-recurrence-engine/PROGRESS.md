# Progress — F0-09 Recurrence engine (pure TypeScript)

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D2–D3
Branch: `feature/shared-recurrence-engine` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-12 — Recurrence options and plan horizon

## Dependencies status
- F0-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Types: `RecurrenceRule { frequency: 'none'|'daily'|'weekly'|'monthly'|'yearly'; interval: number; anchor: LocalDateTime; until?: LocalDate }` (final option list per OQ-12).
- `expandOccurrences(rule, range, overrides)` → ordered occurrences within [range.start, range.end).
- Override types: cancelled occurrence; moved/modified occurrence (new start, duration).
- Occurrence identity: `originalStart` ISO string (stable key).
- Timezone handling in Australia/Melbourne including DST transitions (OQ-32).
- Month-end rule (e.g. anchor on 31st) and 29 February yearly rule — PROPOSED: clamp to last valid day; record in feature DECISIONS.md for confirmation.
- Performance guard: expanding 500 rules over a 6-week range completes within 100 ms in unit tests (PROPOSED budget).

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 0 / 8
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/lib/recurrence/types.ts`, `src/lib/recurrence/expand.ts`, `src/lib/recurrence/expand.test.ts`, `src/lib/recurrence/schema.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-12; then complete dependencies, run START FEATURE F0-09, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
