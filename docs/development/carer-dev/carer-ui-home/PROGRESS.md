# Progress — CAR-UI-01 Carer Home screen (UI)

Status: IN REVIEW (PR #124 to carer-dev)

**HUMAN REVIEW: test expectation changed.** AC-01 now asserts a DayTimeline block rather than a list row (FD-07).
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D4
Branch: `feature/carer-ui-home`
PR target: `carer-dev`
Last updated: 2026-09-26

## Blockers
- None. Where carers tick off tasks was settled by CHG-026: from the patient's own screens, not Carer Home.

## Dependencies status
- F0-15 — MERGED TO DEV
- UI-03 — MERGED TO DEV

## Completed
- Claimed; scope rewritten under CHG-025 (PRD, ACs, TEST_PLAN, DECISIONS).
- Tests written first.
- `getCarerTodayShifts` / `getCarerNotifications` contracts + mock queries; fixtures (FD-02).
- `/carer/home` page, `loading.tsx`, error state; components in `src/features/carer-home/`.
- Browser width sweep (T-13) passed.

## In progress
- None.

## Remaining
- Human approval to open the PR.

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 12 / 13 (T-13 is manual)
- Passing: feature 15 component + 12 contract tests; T-13 manual sweep passed
- Full unit/component suite: 1825 passed, 7 failed, 12 skipped. The failures are environmental and outside this feature: 5 `shared-authentication` + 1 `shared-supabase-environment` integration tests fail with `Invalid API key` (`.env.local` points at the hosted project, not the local stack); `mocks-import-boundary` timed out under full-suite load and passes on its own.
- `supabase test db`: 134 / 134 pass. Playwright e2e (`--grep-invert "F0-07"`): 36 / 36 pass. Lint: 0 errors (3 pre-existing warnings in untouched files). Typecheck clean.

## Files changed
- Docs: root DECISIONS.md (CHG-025, CHG-026), DEVELOPMENT_PLAN.md, this feature folder.
- Tests: `src/features/carer-home/carer-home.test.tsx`, `src/server/shifts/queries.test.ts`, `src/server/notifications/queries.test.ts`.
- Code: `src/app/(carer)/carer/home/{page,loading}.tsx`, `src/features/carer-home/*`.
- Outside Lane C (FD-02, flag in PR): `src/server/shifts/queries.ts`, `src/server/notifications/queries.ts`, `src/mocks/queries/{shifts,notifications}.ts`, `src/mocks/fixtures.ts`.

## Decisions
- See DECISIONS.md (FD-01 to FD-06).

## Problems encountered
- AC-08's 'Try again' differs from the kit's 'Retry' (FD-05, needs the human's call).

## Assumptions
- None beyond DECISIONS.md.

## Next action
- Human approves → open PR to `carer-dev`.

## Ready for PR
- Yes, pending human approval
