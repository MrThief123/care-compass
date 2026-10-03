# Progress — INT-07 Scale and performance verification

Status: IN PROGRESS
Owner: Kav1sh-11
Lane: I — Integration
Sprint: SPRINT · planned D19
Branch: `feature/shared-calendar-scale-performance`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-10-03

## Blockers
- None: OQ-01 answered; user confirmed the proposed budget and scale.

## Dependencies status
- FAM-14 — MERGED TO DEV
- ADM-01 — MERGED TO DEV

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

## Test-first evidence — 2026-10-03

`npx vitest run --config tests/performance/vitest.config.ts tests/performance/seed-scale.test.ts` failed because scripts/seed-scale does not yet exist. Tests were written before that implementation. Dedicated tests/performance configuration keeps expensive opt-in performance integration checks separate from the ordinary regression suite without skipped tests. No acceptance expectation changed.
