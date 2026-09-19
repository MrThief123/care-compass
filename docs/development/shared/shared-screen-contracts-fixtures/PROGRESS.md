# Progress — UI-04 Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D6
Branch: `feature/shared-screen-contracts-fixtures`
PR target: `main (per OQ-01 — shared work, ANSWERED PD-030)`
Last updated: 2026-09-19

## Blockers
- None. OQ-01 ANSWERED (PD-030). Work authorised by CHG-004 and CHG-005 (human, in-session 2026-09-19).

## Dependencies status
- UI-00 — MERGED TO DEV

## Completed
- Branch claimed; feature docs and plan card drafted.

## In progress
- Contract phase (items 1 to 3): tests written and confirmed red; implementation next.

## Remaining
- Contract: `getTaskLog` ordering and validation, `getOccurrence`, `getEventDocuments`.
- Fixtures: design week, long history, long text, documents, second client.
- Milestone push after the contract is green; then fixtures, docs, final verification.

## Acceptance criteria status
- 0 / 10 MET

## Tests
- Written: contract-phase tests only (T-01 to T-11 in TEST_PLAN.md; fixture-phase T-12 to T-22 come with item 4)
- Passing: 8 of 58 (data-independent checks that hold on the old code)
- Failing: 50 of 58, for the expected reasons
- Last run: `npx vitest run src/mocks/queries src/server` → 4 files failed, 50 tests failed, 8 passed (58)
- Tests-first evidence (contract phase, red before implementation): `queryTaskLog`, `occurrencesOnDay`, `findOccurrence` and `getOccurrence` are not functions; `TASK_LOG_PAGE_SIZE` is undefined; `getTaskLog` resolves for page 0, -1, 1.5, NaN, Infinity and status 'bogus' instead of rejecting; the old order is fixture order (first assertion: 1795989600000 >= 1795996800000 fails); object-prototype client ids throw `occurrencesFor(...).filter is not a function`; `@/mocks/queries/documents` and `@/server/documents/queries` do not resolve. Commit: the `test(server)` commit that follows the claim.

## Files changed
- Docs only so far.

## Decisions
- FD-01 onwards in DECISIONS.md; CHG-004, CHG-005 in root DECISIONS.md.

## Problems encountered
- None yet.

## Assumptions
- See DECISIONS.md.

## Next action
- Write the failing contract tests for AC-01 to AC-07.

## Ready for PR
- No
