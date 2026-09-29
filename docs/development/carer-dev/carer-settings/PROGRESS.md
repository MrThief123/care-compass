# Progress — CAR-09 Carer — Settings

Status: READY FOR PR (awaiting human approval)
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

- Implemented `carerInfoSchema`, `updateCarerContactDetails`; wired Save and Reset in `CarerSettingsView`
- Browser sweep 1920 to 768 (mock), failed-save and Reset states checked; save persisted across reload against the local stack

## In progress
- None

## Remaining
- Human approval, then PR to `carer-dev`

## Acceptance criteria status
- 5 / 5 MET

## Tests
- Written: 10 / 10, all green: four CAR-09 files, full unit suite (only the shared F0-04/F0-07 integration files fail: they read the hosted `.env.local`), typecheck, lint (0 errors), `supabase test db` (410), integration file against the local stack (4)
- Carer e2e: there is no carer spec; the rest of the e2e run with `--grep-invert "F0-07"` had 13 failures in family-calendar/family-event-form/family-task-detail-nav/sign-up, none touching these files (not re-run on a clean branch)
- Red for the expected reason: 18 unit/component cases (`updateCarerContactDetails is not a function`; view does not call the actions) and 2 integration cases (same reason)
- Green guards: pgTAP `carer_profile_update.test.sql` (9), 2 integration cases, and the T-03 reset test (existing FAM-12 code)

## HUMAN REVIEW: test expectation changed
- `carer-settings.test.tsx` (CAR-UI-04 T-09/T-10): `@/server/profiles/actions` is now mocked (succeeds and echoes), because Save and Reset call the server. Assertions are unchanged. See FD-05.

## Cross-lane touch
- `src/server/profiles/` is Lane F's folder (FAM-12): additive `carerInfoSchema` and `updateCarerContactDetails` (FD-03). Existing family exports unchanged.

## Files changed
- `src/features/carer-settings/carer-settings-view.tsx`, `carer-settings.test.tsx`, `src/server/profiles/{actions,contact-schema}.ts`; `src/features/carer-settings/carer-settings-wiring.test.tsx`, `src/server/profiles/carer-actions.test.ts`, `supabase/tests/carer_profile_update.test.sql`, `tests/integration/carer-settings-profile.test.ts`; feature docs

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Ready for PR
- Yes, waiting for the human's approval
