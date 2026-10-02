# Progress — ADM-08 Admin — Manage carer-client assignments

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D16
Branch: `feature/admin-carer-assignments`
PR target: `main`
Last updated: 2026-10-02 (docs and tests written; not implemented)

## Blockers
- None. OQ-09 and OQ-19 are ANSWERED (see DECISIONS.md)

## Dependencies status
- ADM-07 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed; ACs expanded to AC-01..AC-07, TEST_PLAN, FD-01..FD-03 (human-confirmed)
- Tests written first (pgTAP, unit, component, integration, e2e); all fail for the expected reason

## In progress
- None

## Remaining
- Migration `admin_end_carer_assignment`, server queries/actions/mock store, Staff screen Clients list + Remove confirmation, db types regen, status page refresh

## Acceptance criteria status
- 0 / 7 MET

## Tests
- Written: 16 cases (T-16 manual) across 5 files
- Passing: 0
- Failing: 14 (T-15 e2e not run)

## Files changed
- Tests and docs only so far (see TEST_PLAN.md).

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implement in a clean session (handoff prompt), then PR approval from the human.

## Ready for PR
- No
