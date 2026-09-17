# Progress — INT-05 Access-control regression matrix

Status: NOT STARTED
Owner: unclaimed
Lane: I — Integration
Sprint: STRETCH · planned D12–D13
Branch: `feature/shared-access-control-regression` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- FAM-15 — NOT STARTED
- CAR-06 — NOT STARTED
- ADM-07 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- docs/security/PERMISSION_MATRIX.md generated from tests.
- pgTAP matrix covering all client-scoped tables.
- Route access tests for every dashboard route per role.
- OWASP checks: input validation, no service-role in client bundle, signed URLs expiry.

## Acceptance criteria status
- 0 / 2 MET

## Tests
- Written: 0 / 2
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/tests/rls_matrix.test.sql`, `tests/integration/route-access.test.ts`, `docs/security/PERMISSION_MATRIX.md`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE INT-05, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
