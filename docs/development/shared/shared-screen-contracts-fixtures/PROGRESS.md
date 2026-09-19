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
- Contract phase implemented and green: `getTaskLog` (newest first by instant, key tie-break, `total` after filters, page size 20, Zod-validated input, page beyond last empty), `getTodayOccurrences` oldest first on the Melbourne day, `getOccurrence`, `getEventDocuments`, `EventDocument`, `TASK_LOG_PAGE_SIZE`, `src/mocks/melbourne-time.ts`.

## In progress
- Milestone push done after the contract phase; fixtures phase (item 4) next, tests first.

## Remaining
- Fixtures: design week, long history, long text, documents, second client.
- Fixtures phase, docs, final verification.

## Acceptance criteria status
- Contract-phase ACs proven on synthetic and generic data: AC-01 to AC-05, AC-07 and the pure part of AC-06. Fixture-specific proof (AC-04 over 137 rows, AC-06 documents, AC-08 to AC-10) comes with the fixtures phase. Statuses stay NOT MET until then.

## Tests
- Written: contract-phase tests only (T-01 to T-11 in TEST_PLAN.md; fixture-phase T-12 to T-22 come with item 4)
- Passing: contract phase all green. Red run before implementation: 8 of 58 passed (data-independent checks that hold on the old code), 50 failed for the expected reasons.
- Failing: 0 in the contract phase.
- Last run: `npx vitest run src` → 54 files, 361 tests passed; `npm run typecheck` clean; `npm run lint` 0 errors (23 baseline warnings, none in files touched here); `prettier --check` clean.
- Tests-first evidence (contract phase, red before implementation): `queryTaskLog`, `occurrencesOnDay`, `findOccurrence` and `getOccurrence` are not functions; `TASK_LOG_PAGE_SIZE` is undefined; `getTaskLog` resolves for page 0, -1, 1.5, NaN, Infinity and status 'bogus' instead of rejecting; the old order is fixture order (first assertion: 1795989600000 >= 1795996800000 fails); object-prototype client ids throw `occurrencesFor(...).filter is not a function`; `@/mocks/queries/documents` and `@/server/documents/queries` do not resolve. Commits: `f27c28d` `test(server)` and `337209a` `test(mocks)`.

## Files changed
- `src/types/domain.ts`, `src/server/events/queries.ts`, `src/server/documents/queries.ts`, `src/mocks/queries/events.ts`, `src/mocks/queries/documents.ts`, `src/mocks/melbourne-time.ts`, `src/mocks/fixtures.ts` (empty `EVENT_DOCUMENTS` placeholder only so far), colocated tests, feature docs, root DECISIONS.md, DEVELOPMENT_PLAN.md.

## Decisions
- FD-01 onwards in DECISIONS.md; CHG-004, CHG-005 in root DECISIONS.md.

## Problems encountered
- None yet.

## Assumptions
- See DECISIONS.md.

## Next action
- Write the failing fixture tests (`src/mocks/fixtures.test.ts`, T-04 and T-12 to T-22) and record them red.

## Ready for PR
- No
