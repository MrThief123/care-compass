# Progress — FAM-UI-06 Family Settings screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-settings`
PR target: `family-dev`
Last updated: 2026-09-25 (docs and decisions done; tests next)

## Blockers
- None

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED

## Completed
- Claimed (branch from `family-dev` at `e10f4ba`).
- Decisions taken with the human in-session (2026-09-25): CHG-023 (contract and fixtures on this branch; AC-01 shows 'Helen Doyle'); FD-01 (the Change confirm says "not available yet"); FD-02 (Reset gives a simulated confirmation).
- Docs: PRD Scope and Dependencies, AC-01 amended, AC-04 to AC-09 added, TEST_PLAN T-01 to T-12, FD-01 to FD-07, CHG-023 in root DECISIONS.md, CHG-023 note in DEVELOPMENT_PLAN.md.

## In progress
- None

## Remaining
- Tests first: T-01 to T-12 (commit `test(family): …`).
- CHG-023: `ProfileSchema.address`, Helen's fixture, `src/mocks/queries/profiles.ts`, `src/server/profiles/queries.ts`.
- Screen: `src/features/family-settings/**`, route `page.tsx` and `loading.tsx`.
- Local checks, e2e (`--grep-invert "F0-07"`), width sweep from 1920 to 768, design side-by-side.

## Acceptance criteria status
- 0 / 9 MET

## Tests
- Written: 0 / 12
- Passing: 0
- Failing: 0

## Files changed
- Docs only so far. Likely code files: see FD-07.

## Decisions
- See DECISIONS.md (FD-01 to FD-07) and root CHG-023.

## Problems encountered
- None

## Assumptions
- None beyond the FDs.

## Next action
- Write T-01 to T-12, confirm they fail for the right reason, record them here, and commit.

## Ready for PR
- No
