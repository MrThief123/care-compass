# Progress — ADM-01 Admin Home — counts and overdue events

Status: IN PROGRESS
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D8
Branch: `feature/admin-home`
PR target: `admin-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-29 is ANSWERED (PD-055, root DECISIONS.md).

## Dependencies status
- F0-11 — MERGED TO DEV
- ADM-UI-01 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/home`; header 'Home'.
- Stat cards: 'Clients 42', 'Staff 17' (counts for admin's organisation).
- Overdue events card (alert tone), caption 'across all clients': rows Client · Event · Nurse · Overdue pill · chevron.
- Empty state 'All caught up'.
- Chevron behaviour per OQ-37 (not linked until answered).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/home/page.tsx`, `src/features/admin-home/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-29; then complete dependencies, run START FEATURE ADM-01, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
