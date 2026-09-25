# Progress — FAM-UI-06 Family Settings screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-settings`
PR target: `family-dev`
Last updated: 2026-09-25 (tests written and red; implementation next)

## Blockers
- None

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED

## Completed
- Claimed (branch from `family-dev` at `e10f4ba`).
- Decisions taken with the human in-session (2026-09-25): CHG-023 (contract and fixtures on this branch; AC-01 shows 'Helen Doyle'); FD-01 (the Change confirm says "not available yet"); FD-02 (Reset gives a simulated confirmation).
- Tests first: T-01 to T-12 written (37 cases, 3 files), run, red for the right reason (missing modules). See TEST_PLAN.md "Red run".
- Docs: PRD Scope and Dependencies, AC-01 amended, AC-04 to AC-09 added, TEST_PLAN T-01 to T-12, FD-01 to FD-07, CHG-023 in root DECISIONS.md, CHG-023 note in DEVELOPMENT_PLAN.md.

## In progress
- None

## Remaining
- CHG-023: `ProfileSchema.address`, Helen's fixture, `src/mocks/queries/profiles.ts`, `src/server/profiles/queries.ts`.
- Screen: `src/features/family-settings/**`, route `page.tsx` and `loading.tsx`.
- Local checks, e2e (`--grep-invert "F0-07"`), width sweep from 1920 to 768, design side-by-side.

## Acceptance criteria status
- 0 / 9 MET

## Tests
- Written: 12 / 12 test-plan rows (37 cases)
- Passing: 0
- Failing: 37 (all 3 files fail at import: `@/server/profiles/queries`, `@/features/family-settings/{settings-schema,family-settings-view,settings-error-state}`, `settings/loading` do not exist yet)

## Files changed
- Tests: `src/server/profiles/queries.test.ts`, `src/features/family-settings/settings-schema.test.ts`, `src/features/family-settings/family-settings.test.tsx`. Code files to come: see FD-07.

## Decisions
- See DECISIONS.md (FD-01 to FD-07) and root CHG-023.

## Problems encountered
- None

## Assumptions
- None beyond the FDs.

## Next action
- Implement CHG-023 (`ProfileSchema.address`, Helen's fixture, `src/mocks/queries/profiles.ts`, `src/server/profiles/queries.ts`), then the schema, the view, the error state, `page.tsx` and `loading.tsx`, until the 37 cases are green.

## Ready for PR
- No
