# Progress — CAR-02 Carer — Notifications card and bell

Status: NOT STARTED
Owner: unclaimed
Lane: C — Carer
Sprint: SPRINT · planned D9
Branch: `feature/carer-notifications` (not yet created)
PR target: `carer-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-14 — Carer notifications scope

## Dependencies status
- F0-10 — NOT STARTED
- F0-13 — NOT STARTED
- CAR-UI-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `carer_notifications` table (recipient, source 'admin'|'family', kind, message, client_id, created_at, read_at) with RLS recipient-only.
- DB triggers: shift inserted → notify carer (source admin); client document added by family → notify carers assigned to that client (source family).
- Notifications card on Carer Home: rows with source chip and message, newest first.
- Bell in header: behaviour per OQ-14 (e.g. unread indicator + scroll/panel).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_carer_notifications.sql`, `supabase/tests/carer_notifications.test.sql`, `src/features/carer-home/notifications-card.tsx`, `src/components/shared/page-header.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-14; then complete dependencies, run START FEATURE CAR-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
