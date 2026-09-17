# Progress — ADM-02 Admin — Staff list and add/edit staff

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D8–D9
Branch: `feature/admin-staff` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-08 — Account provisioning, sign-in method and MFA
- OQ-13 — Staff names and job titles

## Dependencies status
- F0-06 — NOT STARTED
- F0-07 — NOT STARTED
- ADM-UI-03 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/staff`; Staff list card with '+ Add staff'; columns NAME, ROLE, EDIT.
- Add / edit staff panel: Name, Phone, Email, Role (select: Registered Nurse, Enrolled Nurse, Support Worker per design; source per OQ-13); Save.
- Create account per OQ-08 (e.g. invite email) with role 'carer' in admin's organisation.
- Edit updates profile fields.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/staff/page.tsx`, `src/features/admin-staff/*`, `src/server/staff/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-08, OQ-13; then complete dependencies, run START FEATURE ADM-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
