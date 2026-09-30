# Progress — FAM-15 Family — Task detail

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-task-detail`
PR target: `main`
Last updated: 2026-09-30 (implemented; all checks run; awaiting PR approval)

## Blockers
- None. OQ-29 (PD-055) and OQ-10 (PD-044) answered; F0-11, F0-13, FAM-UI-07 merged.

## Completed
- Claimed (branch pushed, Owner set).
- Docs rewritten for the current state: PRD, ACCEPTANCE_CRITERIA (8 ACs), TEST_PLAN (11 tests), DECISIONS FD-01 to FD-05 (FD-01 and FD-02 confirmed by the human).
- Tests written first: 11 (T-01 to T-11).

## In progress
- None

## Remaining
- None. Open the PR after the human's "yes".

## Acceptance criteria status
- 8 / 8 MET.

## Tests
- Written: 11 / 11
- Passing: 11 / 11
- Run: Vitest for the two `.fam15` component/page files; integration against local Supabase (env overridden from `supabase status`); Playwright spec on a fresh build (the build had to skip the view test file because of its expected type error).

## Files changed
- Docs in this folder; `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page.fam15.test.tsx`, `src/features/family-task-detail/task-detail-view.fam15.test.tsx`, `tests/integration/family-task-detail.test.ts`, `tests/e2e/family-task-detail.spec.ts`.
- Implemented in: the page, `task-detail-view.tsx`, `src/server/events/queries.ts` (and `occurrences.ts`/`build-occurrences.ts` for FD-03).

## Decisions
- See DECISIONS.md (FD-01 to FD-05).

## Problems encountered
- `npm run build` type-checks test files, so the expected type error in the view test blocks a build until the view accepts a plain event.

## Assumptions
- None beyond DECISIONS.md.

## Next action
- Human review, then PR.

## Ready for PR
- Yes, waiting for the human's approval.
- HUMAN REVIEW: test expectation changed (FD-06, page.edge.test.tsx, `getOccurrence` now has the `{ type: "all" }` argument).
