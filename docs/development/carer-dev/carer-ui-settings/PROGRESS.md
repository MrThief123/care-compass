# Progress — CAR-UI-04 Carer Settings screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D6
Branch: `feature/carer-ui-settings`
PR target: `carer-dev`
Last updated: 2026-09-26 (tests written, red)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed. FD-01 to FD-04 recorded (fixture phone/email, `getCarerContactDetails` contract, read-only My info with a local Reset confirmation, how the state tests are tagged)
- Tests T-01 to T-08 written first. All fail for the expected reason: `app/(carer)/carer/settings/loading.tsx` does not exist and `getCarerContactDetails` is not a function

## In progress
- None

## Remaining
- Route `/carer/settings` inside the carer layout.
- 'My info' `DetailsFormCard`: Name, Phone, Email, Role (read-only PROPOSED).
- Reset `SettingsActionCard`.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 2 MET

## Tests
- Written: 8 / 8 (T-01 to T-07: `src/features/carer-settings/carer-settings.test.tsx`; T-08: 4 cases in `src/server/profiles/queries.test.ts`)
- Passing: 0
- Failing: 8 (red, expected)

## Files changed
- Tests: `src/features/carer-settings/carer-settings.test.tsx`, `src/server/profiles/queries.test.ts`
- Next: `src/mocks/fixtures.ts` (shared), `src/mocks/queries/profiles.ts` (shared), `src/server/profiles/queries.ts`, `src/app/(carer)/carer/settings/{page,loading}.tsx`, `src/features/carer-settings/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implement to green (see SESSION_STATE.md), then run the carer suite, check in a browser and do END SESSION.

## Ready for PR
- No
