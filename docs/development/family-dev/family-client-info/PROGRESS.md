# Progress — FAM-09 Family — Client info

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-client-info` (cut from `feature/carer-client-info`, FD-01)
PR target: `main` (CHG-036), opened only after CAR-04 is merged
Last updated: 2026-10-01

## Blockers
- None. Verification needed a temporary, uncommitted `getClientHeaderSummary` supabase patch (FD-07, `TEMP_HEADER_WIRING.md`); the gap is to become its own shared feature.

## Dependencies status
- F0-06, F0-13, FAM-UI-04, CAR-04 — merged to `main`

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- 2026-10-01: claimed; PRD, ACs (now AC-01 to AC-09), TEST_PLAN, USER_STORIES, DECISIONS (FD-01 to FD-05) updated
- 2026-10-01: tests written first (component, pgTAP, e2e); see Tests

## In progress
- 2026-10-01: implemented (info-section-card, documentation-card, family-info-view, Info page); FAM-UI-04 tests updated (FD-06). HUMAN REVIEW: test expectations changed (DECISIONS FD-06 FAM-UI-04 tests; FD-08 e2e T-01 waits for Edit before reload). Checks run (2026-10-01): family-info vitest 45/45, tsc clean, prettier clean, `supabase test db` pass, e2e `family-client-info.spec.ts` 3/3 (run twice, local Supabase, production webpack build, temp header patch), real-browser check of 5,001 characters and width sweep 1920 to 768 (no overflow).

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
- Passing: component family-info 45/45, pgTAP 12, e2e 3/3
- Failing: none in this feature (3 unrelated integration failures, see Problems)

## Files changed
- None yet. Tests: `src/features/family-info/family-info-wired.test.tsx`, `supabase/tests/family_client_info.test.sql`, `tests/e2e/family-client-info.spec.ts`. Likely implementation files: `src/features/family-info/{info-section-card,documentation-card,family-info-view}.tsx`, the Info `page.tsx`; no migration or new contract function (FD-02)

## Decisions
- See DECISIONS.md

## Problems encountered
- 2026-10-01: `npx playwright test tests/e2e/family-client-info.spec.ts` (local Supabase, webpack production build, `DATA_SOURCE=supabase`): 3 of 3 fail. Sign-in works; the family layout then throws "clients.getClientHeaderSummary: DATA_SOURCE=supabase is not implemented yet". Not caused by FAM-09.
- Turbopack rejects the worktree's symlinked `node_modules`; dev/build use `next dev --webpack` / `next build --webpack`. Dev mode also blocks the e2e's 127.0.0.1 origin (hydration), so the e2e needs a production build.
- Full `npx vitest run` with local Supabase env: 3 failures outside this feature: `tests/integration/family-home-budget-strip.test.ts` (2) and `tests/integration/shared-sign-up.test.ts` (1). Not checked against `main`.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implementation: wire `InfoSectionCard` and `DocumentationCard` to the contract, pass `clientId`/`kind` from the page, update the listed FAM-UI-04 tests (DECISIONS, HUMAN REVIEW).

## Ready for PR
- READY FOR PR. Human approved 2026-10-01; temporary header patch reverted. HUMAN REVIEW: test expectation changed (DECISIONS FD-06, FD-08).

## Known gap for FAM-01
Family Home errors under DATA_SOURCE=supabase: events/budget contracts unimplemented (see DECISIONS.md FD-09).
