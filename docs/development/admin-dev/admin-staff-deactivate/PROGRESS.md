# Progress — ADM-03 Admin — Deactivate staff

Status: NOT STARTED
Owner: unclaimed
Lane: A — Admin
Sprint: POST-SPRINT · planned —
Branch: `feature/admin-staff-deactivate` (not yet created)
PR target: `admin-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-36 — Staff deactivation
- OQ-19 — Figma access and remaining design gaps

## Dependencies status
- ADM-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Deactivate action and confirmation (design required).
- Sets is_active false; ends assignments; cancels future shifts (PROPOSED).

## Acceptance criteria status
- 0 / 2 MET

## Tests
- Written: 0 / 2
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/admin-staff/deactivate.tsx`, `supabase/migrations/*_deactivate_staff.sql`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-36, OQ-19; then complete dependencies, run START FEATURE ADM-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
