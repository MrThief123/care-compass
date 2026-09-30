# Progress — FAM-09 Family — Client info

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-client-info` (cut from `feature/carer-client-info`, FD-01)
PR target: `main` (CHG-036), opened only after CAR-04 is merged
Last updated: 2026-10-01

## Blockers
- None (OQ-26 answered, PD-051)

## Dependencies status
- F0-06, F0-13, FAM-UI-04, CAR-04 — merged to `main`

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- 2026-10-01: claimed; PRD, ACs (now AC-01 to AC-09), TEST_PLAN, USER_STORIES, DECISIONS (FD-01 to FD-05) updated
- 2026-10-01: tests written first (component, pgTAP, e2e); see Tests

## In progress
- None

## Remaining
- Route `/family/[clientId]/info`; in-page summary (avatar, name, '78 years · Preston VIC · Banksia Home Care').
- Section cards Description, Habits, Medical history each with 'Edit' link toggling an inline textarea with Save/Cancel (edit interaction not drawn — PROPOSED inline).
- Documentation card with file tiles and '+ Add file' (client-level documents, event_id null).
- Shared `ClientInfoView` component parameterised for reuse by CAR-04.
- Use the `client_info_sections` table created by F0-06.

## Acceptance criteria status
- 0 / 9 MET (AC-02 and the AC-04/AC-09 database rules already hold; counted MET at implementation once their tests are green and the UI is wired)

## Tests
- Written: component 11, pgTAP 12, e2e 3 (covering AC-01 to AC-09)
- Passing: component 1 (order), pgTAP 12
- Failing (expected, nothing implemented): component 10; e2e not run

## Files changed
- None yet. Tests: `src/features/family-info/family-info-wired.test.tsx`, `supabase/tests/family_client_info.test.sql`, `tests/e2e/family-client-info.spec.ts`. Likely implementation files: `src/features/family-info/{info-section-card,documentation-card,family-info-view}.tsx`, the Info `page.tsx`; no migration or new contract function (FD-02)

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implementation: wire `InfoSectionCard` and `DocumentationCard` to the contract, pass `clientId`/`kind` from the page, update the listed FAM-UI-04 tests (DECISIONS, HUMAN REVIEW).

## Ready for PR
- No
