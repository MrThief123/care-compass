# Progress — INT-06 Accessibility verification across dashboards

Status: IN PROGRESS
Owner: Kav1sh-11
Lane: I — Integration
Sprint: SPRINT · planned D20
Branch: `feature/shared-accessibility-verification`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-10-03

## Blockers
- None. OQ-01 answered in root DECISIONS.md.

## Dependencies status
- FAM-15 — MERGED TO DEV
- CAR-09 — MERGED TO DEV
- ADM-10 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- @axe-core/playwright on each route.
- Keyboard-only traversal of primary journeys.
- docs/ACCESSIBILITY_REPORT.md; each defect becomes a dashboard bug feature.

## Acceptance criteria status
- 0 / 2 MET

## Tests
- Written: 0 / 2
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `tests/e2e/a11y.spec.ts`, `docs/ACCESSIBILITY_REPORT.md`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Claim branch, then write the route audit and keyboard journey tests.

## Ready for PR
- No

## 2026-10-03 test-first evidence

Added tests/e2e/a11y.spec.ts and the PRD-required axe Playwright adapter before creating the report or changing production code. The seeded route run found serious color-contrast violations on Family, Carer and Admin pages; Helen's keyboard-only completion passed. Route failures stay failing. All 920 database tests passed.

HUMAN REVIEW: test expectation changed — the initial H1 readiness assertion was invalid for existing Home screens. The subsequent heading requirement was also invalid for the Patients directory. Readiness now checks populated main content, expected route, HTTP 200 and absence of known error states; axe rules/severity are unchanged. See DECISIONS.md FD-03.
