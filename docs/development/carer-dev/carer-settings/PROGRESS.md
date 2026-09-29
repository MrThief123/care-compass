# Progress — CAR-09 Carer — Settings

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D10
Branch: `feature/carer-settings`
PR target: `carer-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-35 answered (PD-054).

## Dependencies status
- F0-07 — MERGED
- CAR-UI-04 — MERGED TO DEV
- FAM-12 (column grant, `requestOwnPasswordReset`) — on `carer-dev`

## Completed
- Claimed. Docs rewritten to match the code that exists (FD-01 to FD-04)
- Tests T-01 to T-10 written first (see Tests)

## In progress
- None. Implementation is the next session.

## Remaining
- Implement `carerInfoSchema`, `updateCarerContactDetails`, and wire the view's Save and Reset
- Adjust CAR-UI-04's T-09/T-10 to mock the actions (flag HUMAN REVIEW)
- Browser sweep 1920 to 768, preview link

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 10 / 10
- Red for the expected reason: 18 unit/component cases (`updateCarerContactDetails is not a function`; view does not call the actions) and 2 integration cases (same reason)
- Green guards: pgTAP `carer_profile_update.test.sql` (9), 2 integration cases, and the T-03 reset test (existing FAM-12 code)

## Files changed
- `src/features/carer-settings/carer-settings-wiring.test.tsx`, `src/server/profiles/carer-actions.test.ts`, `supabase/tests/carer_profile_update.test.sql`, `tests/integration/carer-settings-profile.test.ts`; feature docs

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Ready for PR
- No
