# Progress — CAR-UI-04 Carer Settings screen (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D6
Branch: `feature/carer-ui-settings`
PR target: `carer-dev`
Last updated: 2026-09-26 (Edit/Save added on the human's request, FD-06)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed. FD-01 to FD-04 recorded (fixture phone/email, `getCarerContactDetails` contract, read-only My info with a local Reset confirmation, how the state tests are tagged)
- Tests T-01 to T-08 written first. All fail for the expected reason: `app/(carer)/carer/settings/loading.tsx` does not exist and `getCarerContactDetails` is not a function

- Implemented to green: the `staff-aisha` fixture (FD-01), the `getCarerContactDetails` contract with a Supabase branch (FD-02), `/carer/settings` page and loading, and `src/features/carer-settings/` (view, skeleton). The error state reuses `CarerHomeErrorState` (FD-05)
- Browser check (Playwright against the dev server, mock data): 1920, 1440, 1280, 1024, 900 and 768 px. No horizontal scroll, no overlapping elements, no clipped field values. Pressing Reset shows the status message. Matches `docs/design/screens/carer-04-settings.png`. The only differences are in the F0-15 shell (Patients icon, sign-out button)

- My info Edit/Save/Cancel added (FD-06), following Family Settings. Role stays read-only; Save is local in Phase 1. T-02 changed, and T-09 and T-10 were written first and failed on the missing 'Edit' button. Browser sweep from 1920 to 768 px in edit mode with an error showing: no horizontal scroll, no overlapping elements, and 'Saved.' is announced
- **HUMAN REVIEW: test expectation changed.** T-02 now expects an 'Edit' button (FD-06)

## In progress
- None

## Remaining
- Open the PR to `carer-dev` after the human approves

## Acceptance criteria status
- 2 / 2 MET

## Tests
- Written: 10 / 10 (T-01 to T-07, T-09, T-10: `src/features/carer-settings/carer-settings.test.tsx`; T-08: 4 cases in `src/server/profiles/queries.test.ts`)
- Passing: 10 / 10 (38 tests across the feature file and `src/server/profiles/queries.test.ts`)
- After FD-06: `vitest run src/features src/server src/app` 1341 / 1341 passed; lint and typecheck clean on the change
- Full `vitest run` (before FD-06): 1840 passed, 12 skipped, 5 failed. The 5 failures are F0-04/F0-07 integration tests against hosted Supabase that fail with `AuthApiError: Invalid API key`. That is an environment problem, not caused by this change
- Lint: 0 errors (3 existing warnings in files this feature does not touch). Typecheck: clean
- e2e: `tests/e2e/shared-app-shell.spec.ts --grep-invert "F0-07"` 5 / 5 passed

## Files changed
- Tests: `src/features/carer-settings/carer-settings.test.tsx`, `src/server/profiles/queries.test.ts`
- Shared folders, flag in the PR: `src/mocks/fixtures.ts`, `src/mocks/queries/profiles.ts`, `src/server/profiles/queries.ts`
- Carer: `src/app/(carer)/carer/settings/{page,loading}.tsx`, `src/features/carer-settings/{carer-settings-view,carer-settings-skeleton}.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human approval, then open the PR `CAR-UI-04 Carer Settings screen (UI)` to `carer-dev`.

## Ready for PR
- Yes, waiting for human approval
