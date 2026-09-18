# Progress — F0-15 Role app shell: rail, header and layouts

Status: IN PROGRESS
Owner: MrThief123
Lane: S — Shared kit
Sprint: SPRINT · planned D3
Branch: `feature/shared-app-shell`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18

## Blockers
- None — OQ-01 answered (PD-030)

## Dependencies status
- F0-14 — MERGED TO DEV
- UI-00 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Rail (88px, vertical gradient #07727D→#0C9BA9) with role label at top (FAMILY / CARER / ADMIN) and icon+label items; active item is a surface tile with brand text.
- Family items: Home · Info · Calendar · Budget · Settings. Carer: Home · Patients · Calendar · Settings. Admin: Home · Manage · Staff · Clients · Settings.
- Nav items in the top ~43% of the rail; nothing bottom-anchored.
- Header 76px: Family → client avatar (46) + name (Title/Page) + subline '78 years · Preston VIC · Banksia Home Care'; Carer/Admin → screen name. Right side: current date ('Monday 30 November 2026'), divider, [Carer only: bell], user avatar + first name.
- Top-bar placement of sign-out (UI-§5.1 says log-out/help in the top bar; exact control not drawn — PROPOSED user menu on avatar).
- Role layouts in `(family)/family/[clientId]`, `(carer)/carer`, `(admin)/admin`; active item derived from route.
- Bell renders only in the Carer header (panel behaviour in CAR-02).
- Signed-in user comes from the `getCurrentUser()` contract (UI-00): mock session until F0-07 swaps in Supabase Auth; role layouts are unguarded mock routes until F0-07.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/components/shared/rail.tsx`, `src/components/shared/page-header.tsx`, `src/app/(family)/family/[clientId]/layout.tsx`, `src/app/(carer)/carer/layout.tsx`, `src/app/(admin)/admin/layout.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-15, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
