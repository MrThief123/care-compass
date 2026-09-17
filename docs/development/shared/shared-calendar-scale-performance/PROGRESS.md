# Progress — INT-07 Scale and performance verification

Status: NOT STARTED
Owner: unclaimed
Lane: I — Integration
Sprint: POST-SPRINT · planned —
Branch: `feature/shared-calendar-scale-performance` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- FAM-14 — NOT STARTED
- ADM-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Scale seed script (e.g. 500 recurring events per client, 50 clients).
- Measure server render times locally; PROPOSED budget p95 < 1 s for Home, Calendar week, Task log first page.
- EXPLAIN ANALYZE key queries; add indexes via migration.

## Acceptance criteria status
- 0 / 1 MET

## Tests
- Written: 0 / 1
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `scripts/seed-scale.ts`, `docs/PERFORMANCE_REPORT.md`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE INT-07, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
