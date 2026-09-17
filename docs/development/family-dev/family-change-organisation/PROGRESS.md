# Progress — FAM-13 Family — Change organisation

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-change-organisation` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-06 — Organisation change model
- OQ-15 — Incoming organisation's visibility of history

## Dependencies status
- F0-06 — NOT STARTED
- F0-10 — NOT STARTED
- FAM-UI-06 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Change organisation card: 'Currently registered with Banksia Home Care.' and 'Change' button.
- Organisation picker listing organisations registered with Care Compass (UI not designed — OQ-06).
- Confirmation modal (destructive tone): title 'Change organisation?', body 'Switching Margaret's care to a new organisation keeps her routines, events, budget, documents and history. Assigned nurses and all future shifts will be cleared, and Banksia Home Care will lose access immediately. This can't be undone from your side.', buttons Cancel / Change organisation, close X.
- Postgres function `transfer_client_organisation(client_id, new_org_id)`: verify family authority; update clients.organisation_id; end active carer assignments; cancel shifts starting after now(); audit; single transaction.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/family-settings/change-organisation.tsx`, `src/components/shared/confirmation-modal.tsx`, `supabase/migrations/*_transfer_client.sql`, `supabase/tests/transfer_client.test.sql`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-06, OQ-15; then complete dependencies, run START FEATURE FAM-13, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
