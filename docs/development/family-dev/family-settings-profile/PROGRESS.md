# Progress — FAM-12 Family — Settings: family info and password reset

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-settings-profile` (created from `origin/family-dev` at 9f4de15)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. Blocking decisions are ANSWERED in DECISIONS.md (FAM-12: OQ-35; FAM-13: OQ-06, OQ-15).

## Dependencies status
- F0-07 — MERGED TO DEV
- FAM-UI-06 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/settings`; page title 'Settings'.
- Family info card: Name, Phone, Email, Address inputs bound to the signed-in profile; save mechanism per OQ-35.
- Reset username / password card: description 'We'll email you a secure link to reset your credentials.' and 'Reset' button calling `requestPasswordReset()` from F0-07 with confirmation message.
- Layout slot for Change organisation card (FAM-13).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/settings/page.tsx`, `src/components/shared/profile-form.tsx`, `src/components/shared/reset-password-card.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-35; then complete dependencies, run START FEATURE FAM-12, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
