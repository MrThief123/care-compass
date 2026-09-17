# Progress — ADM-04 Admin — Clients list and add client

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-clients` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-07 — Client record creation and family linking
- OQ-08 — Account provisioning, sign-in method and MFA

## Dependencies status
- F0-06 — NOT STARTED
- ADM-UI-04 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/clients`; Client list with '+ Add client'; columns NAME, FAMILY CONTACT, REMOVE (Remove handled by ADM-05; link absent until then).
- Add client panel: Client name, Family contact name, Family contact email, Notes; 'Add client' button.
- On add: create client in admin's organisation and family contact link/invite per OQ-07/OQ-08.
- No edit of client info (D28).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/clients/page.tsx`, `src/features/admin-clients/*`, `src/server/clients/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-07, OQ-08; then complete dependencies, run START FEATURE ADM-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
