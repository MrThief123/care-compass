# Progress — FAM-15 Family — Task detail

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-task-detail`
PR target: `main`
Last updated: 2026-09-30 (docs updated, tests written and run; implementation not started)

## Blockers
- None. OQ-29 (PD-055) and OQ-10 (PD-044) answered; F0-11, F0-13, FAM-UI-07 merged.

## Completed
- Claimed (branch pushed, Owner set).
- Docs rewritten for the current state: PRD, ACCEPTANCE_CRITERIA (8 ACs), TEST_PLAN (11 tests), DECISIONS FD-01 to FD-05 (FD-01 and FD-02 confirmed by the human).
- Tests written first: 11 (T-01 to T-11).

## In progress
- None

## Remaining (implementation)
- Plain event support (AC-05, AC-06): page reads `getOccurrence(..., { type: "all" })`; `TaskDetailView` accepts `AnyOccurrence` and shows 'Event · No tick-off needed' (no pill, no completion time). Fixes the `tsc` error in `task-detail-view.fam15.test.tsx`.
- Cancelled-after-completion (AC-07, FD-03): `getOccurrence` returns a completed occurrence that an override cancelled; range reads unchanged. Inside `src/server/events`.
- Mock contract: same behaviour for plain events already exists; check the mock branch needs nothing for AC-07.

## Acceptance criteria status
- 0 / 8 marked MET yet. Tests pass today for AC-01 to AC-04, AC-06 and AC-08 (already built); AC-05 and AC-07 fail as expected.

## Tests
- Written: 11 / 11
- Passing: 8 (T-01 to T-06, T-09, T-11)
- Failing (expected, right reason): 3 (T-07, T-08, T-10)
- Run: Vitest for the two `.fam15` component/page files; integration against local Supabase (env overridden from `supabase status`); Playwright spec on a fresh build (the build had to skip the view test file because of its expected type error).

## Files changed
- Docs in this folder; `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page.fam15.test.tsx`, `src/features/family-task-detail/task-detail-view.fam15.test.tsx`, `tests/integration/family-task-detail.test.ts`, `tests/e2e/family-task-detail.spec.ts`.
- Likely for implementation: the page, `task-detail-view.tsx`, `src/server/events/queries.ts` (and `occurrences.ts`/`build-occurrences.ts` for FD-03).

## Decisions
- See DECISIONS.md (FD-01 to FD-05).

## Problems encountered
- `npm run build` type-checks test files, so the expected type error in the view test blocks a build until the view accepts a plain event.

## Assumptions
- None beyond DECISIONS.md.

## Next action
- Run the implementation session (see SESSION_STATE.md).

## Ready for PR
- No
