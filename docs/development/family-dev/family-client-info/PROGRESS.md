# Progress — FAM-09 Family — Client info

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-client-info` (cut from `feature/carer-client-info`, FD-01)
PR target: `main` (CHG-036), opened only after CAR-04 is merged
Last updated: 2026-10-01

## Blockers
- Browser check and e2e: under `DATA_SOURCE=supabase` every `/family/[clientId]/*` page errors, because the family layout calls `getClientHeaderSummary`, which is still `notImplementedForSupabase` on `main` (known, shared-root-route FD-05). The Info cards themselves are wired and unit-tested. Awaiting the human: see Problems encountered.

## Dependencies status
- F0-06, F0-13, FAM-UI-04, CAR-04 — merged to `main`

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- 2026-10-01: claimed; PRD, ACs (now AC-01 to AC-09), TEST_PLAN, USER_STORIES, DECISIONS (FD-01 to FD-05) updated
- 2026-10-01: tests written first (component, pgTAP, e2e); see Tests

## In progress
- 2026-10-01: implemented (info-section-card, documentation-card, family-info-view, Info page); FAM-UI-04 tests updated (FD-06). HUMAN REVIEW: test expectation changed (see DECISIONS FD-06). Full checks and browser/e2e run pending.

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
- Passing: component family-info 45/45 (wired 11 + FAM-UI-04 updated), pgTAP 12
- Failing: none; e2e not run yet

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
- No
