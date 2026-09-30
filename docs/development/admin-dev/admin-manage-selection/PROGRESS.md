# Progress — ADM-06 Admin — Manage: staff and client selection

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-manage-selection`
PR target: `main`
Last updated: 2026-09-30 (implemented, verification pending)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-06 — MERGED
- ADM-UI-02 — MERGED

## Completed
- Branch claimed; docs updated (PR target main, full names, AC-05/AC-06 proposed, FD-01..FD-06).
- Tests written first and run red (2026-09-30).
- FD-02 and FD-04 confirmed by the human (2026-09-30).
- Implemented FD-01: `getAdminManage({ staffSearch, clientSearch })` (mock filter + Supabase branch, RLS scoped, active carers only), `ManageScreen` selection/search props with `router.replace`, page reads async `searchParams`.

## In progress
- Local verification: e2e and the visual preview need the local seed data (see Problems).

## Remaining
- Full local e2e (`--grep-invert "F0-07"`) and the browser width sweep, once local seed data is loaded.
- Human approval, then the PR.

## Acceptance criteria status
- 6 / 6 MET by tests (AC-05, AC-06 were PROPOSED; confirmed via FD-02/FD-04).

## Tests
- ADM-06: 8 of 8 written (T-01..T-08). All green: component/unit 26/26 in `src/features/admin-manage` + `manage-queries*`; integration 4/4 against local Supabase.
- `npm run lint`: 0 errors (2 existing import/order warnings in `src/app/dev-preview/page.tsx`, not touched). `tsc --noEmit`: clean.
- Full vitest with local Supabase env: unrelated failures only, all on an unseeded local DB (F0-16 seed test, ADM-10 settings). Not caused by this change; to be re-run after the local seed is loaded.

## HUMAN REVIEW: test expectation changed
- ADM-UI-02 `manage-screen.test.tsx`: added a `next/navigation` mock and passes `selection` in (URL is the source of truth); Clear test asserts the URL update then rerenders empty; overlap test switches staff by rerender; the client-side filter test now asserts typing does not filter locally and a search with no rows shows "No clients found" (server filtering is covered by T-06/T-07). Details in DECISIONS FD-06.
- ADM-UI-02 `manage-queries.test.ts`: "refuses Supabase mode" now expects a rejection instead of "not implemented".
- ADM-06 own test T-05 (test bug): the row's text includes avatar initials, so it now matches by accessible name.

## Files changed
- Tests: `src/features/admin-manage/manage-selection.test.tsx`, `manage-screen.test.tsx`, `src/server/admin/manage-queries.search.test.ts`, `manage-queries.test.ts`, `tests/integration/admin-manage-selection.test.ts`
- Production: `src/server/admin/manage-queries.ts`, `src/features/admin-manage/manage-screen.tsx`, `src/app/(admin)/admin/manage/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- Local Supabase has no seed rows (Banksia org, Priya), so F0-16, ADM-10, e2e and the visual preview cannot run. `supabase db reset` was blocked in this session; needs the human to run it (or allow it).

## Assumptions
- Supabase-mode `referenceDate` is today in Australia/Melbourne until ADM-07 wires shifts.

## Next action
- Load local seed data, run e2e and the browser sweep, then announce readiness and wait for "yes" before the PR.

## Ready for PR
- No
