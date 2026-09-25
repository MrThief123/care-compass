# Progress — FAM-UI-06 Family Settings screen (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-settings`
PR target: `family-dev`
Last updated: 2026-09-25 (CHG-024 Edit/Save flow added; all 40 cases green; waiting for approval to open the PR)

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
- CHG-024 (human request): Family info is read-only until 'Edit' (AC-10, FD-09, T-13). Tests changed first (red), then the view.
- Checks: see TEST_PLAN.md "Green run" and "CHG-024 run". Width sweep from 1920 to 768 and side-by-side with `family-05-settings.png` done.

## In progress
- None

## Remaining
- Open the PR to `family-dev` once the human approves.

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 13 / 13 test-plan rows (40 cases)
- Passing: 40
- Failing: 0

## Files changed
- `src/types/domain.ts`, `src/mocks/fixtures.ts`, `src/mocks/queries/profiles.ts`, `src/server/profiles/queries.ts` (CHG-023)
- `src/features/family-settings/**`, `src/app/(family)/family/[clientId]/settings/{page,loading}.tsx`

## Decisions
- See DECISIONS.md (FD-01 to FD-09) and root CHG-023, CHG-024.

## Design differences to name in the PR
- Name reads 'Helen Doyle', not 'Helen' (CHG-023, PD-038).
- Family info has a button: 'Edit', which becomes 'Save' in edit mode (PD-054, CHG-024).
- The live-region messages, the validation messages and the no-organisation text are undesigned and flagged for design review (FD-01 to FD-03, FD-05).

## HUMAN REVIEW: test expectation changed
- CHG-024: T-06, T-07 and T-11 now click 'Edit' first. In T-07's 'clears the Saved. message' case, clicking 'Edit' now clears 'Saved.' (it used to be typing in a field). No assertion was removed. Details in FD-09.

## Problems encountered
- The full suite's 5 F0-07/F0-04 integration tests fail with `Invalid API key` (Supabase auth, environment). Unrelated to this feature.
- A `next dev` server already on :3000 was reused by Playwright; e2e was run against `next start -p 3100` instead. That dev server refuses JS chunks for the `127.0.0.1` origin, so browse it at `localhost`.

## Assumptions
- None beyond the FDs.

## Next action
- Human approval, then open PR `FAM-UI-06 Family Settings screen (UI)` to `family-dev`.

## Ready for PR
- Yes (waiting for human approval)
