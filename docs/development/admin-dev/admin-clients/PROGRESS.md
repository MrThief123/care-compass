# Progress — ADM-04 Admin — Clients list and add client

Status: IN PROGRESS
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-clients`
PR target: `admin-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-07 is ANSWERED (PD-037); OQ-08 no longer applies (CHG-035 — this feature creates no
  account any more).

## Dependencies status
- F0-06 — MERGED TO DEV
- ADM-UI-04 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- **CHG-035 (this session, applying PD-037/CHG-010): corrected this feature's own stale docs before
  implementing**, as CHG-010 itself instructed. PRD/ACCEPTANCE_CRITERIA/TEST_PLAN/DECISIONS rewritten:
  no Add-client panel (rejected flow, not undesigned), ADM-04 is read-only (the list), Remove stays
  ADM-05's unwired scope.

## In progress
- None

## Remaining
- Route `/admin/clients`; Client list; columns NAME, FAMILY CONTACT, REMOVE (still a local, unwired
  preview — ADM-05's real scope).
- Wire `getAdminClients()` to Supabase (org-scoped, real family-contact names).
- Remove the Add-client panel from `clients-screen.tsx` (superseded, PD-037/CHG-010).

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
