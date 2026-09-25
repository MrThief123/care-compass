# Progress — FAM-UI-06 Family Settings screen (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-settings`
PR target: `family-dev`
Last updated: 2026-09-25 (implemented; all 37 cases green; waiting for approval to open the PR)

## Blockers
- None

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED

## Completed
- Claimed (branch from `family-dev` at `e10f4ba`).
- Decisions taken with the human in-session (2026-09-25): CHG-023, FD-01, FD-02.
- Tests first: T-01 to T-12 (37 cases), red for the right reason (commit `900cf1c`).
- CHG-023: `ProfileSchema.address`; Helen's phone, contact email and address in the fixtures; `src/mocks/queries/profiles.ts`; `src/server/profiles/queries.ts`.
- Screen: `src/features/family-settings/` (`settings-schema.ts`, `family-settings-view.tsx`, `settings-error-state.tsx`, `settings-skeleton.tsx`); route `settings/page.tsx` and `loading.tsx`.
- Checks: see TEST_PLAN.md "Green run". Width sweep from 1920 to 768 and side-by-side with `family-05-settings.png` done.

## In progress
- None

## Remaining
- Open the PR to `family-dev` once the human approves.

## Acceptance criteria status
- 9 / 9 MET

## Tests
- Written: 12 / 12 test-plan rows (37 cases)
- Passing: 37
- Failing: 0

## Files changed
- `src/types/domain.ts`, `src/mocks/fixtures.ts`, `src/mocks/queries/profiles.ts`, `src/server/profiles/queries.ts` (CHG-023)
- `src/features/family-settings/**`, `src/app/(family)/family/[clientId]/settings/{page,loading}.tsx`

## Decisions
- See DECISIONS.md (FD-01 to FD-08) and root CHG-023.

## Design differences to name in the PR
- Name reads 'Helen Doyle', not 'Helen' (CHG-023, PD-038).
- Family info has a Save button (PD-054, FD-03).
- The live-region messages, the validation messages and the no-organisation text are undesigned and flagged for design review (FD-01 to FD-03, FD-05).

## Problems encountered
- The full suite's 5 F0-07/F0-04 integration tests fail with `Invalid API key` (Supabase auth, environment). Unrelated to this feature.
- A `next dev` server already on :3000 was reused by Playwright; e2e was run against `next start -p 3100` instead. That dev server refuses JS chunks for the `127.0.0.1` origin, so browse it at `localhost`.

## Assumptions
- None beyond the FDs.

## Next action
- Human approval, then open PR `FAM-UI-06 Family Settings screen (UI)` to `family-dev`.

## Ready for PR
- Yes (waiting for human approval)
