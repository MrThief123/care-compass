# Progress — FAM-09 Family — Client info

Status: NOT STARTED
Owner: unclaimed
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-client-info` (not yet created)
PR target: `family-dev`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-26 — File upload constraints

## Dependencies status
- F0-06 — NOT STARTED
- F0-13 — NOT STARTED
- FAM-UI-04 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/info`; in-page summary (avatar, name, '78 years · Preston VIC · Banksia Home Care').
- Section cards Description, Habits, Medical history each with 'Edit' link toggling an inline textarea with Save/Cancel (edit interaction not drawn — PROPOSED inline).
- Documentation card with file tiles and '+ Add file' (client-level documents, event_id null).
- Shared `ClientInfoView` component parameterised for reuse by CAR-04.
- Use the `client_info_sections` table created by F0-06.

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 0 / 5
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/info/page.tsx`, `src/components/shared/client-info-view.tsx`, `supabase/migrations/*_client_info.sql`, `src/server/clients/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-26; then complete dependencies, run START FEATURE FAM-09, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
