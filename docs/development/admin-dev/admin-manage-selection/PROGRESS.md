# Progress — ADM-06 Admin — Manage: staff and client selection

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-manage-selection`
PR target: `main`
Last updated: 2026-09-30 (verified, ready for PR approval)

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
- None

## Remaining
- Human approval ("yes"), then the PR.

## Acceptance criteria status
- 6 / 6 MET by tests (AC-05, AC-06 were PROPOSED; confirmed via FD-02/FD-04).

## Tests
- ADM-06: 8 of 8 written (T-01..T-08). All green: component/unit 26/26 in `src/features/admin-manage` + `manage-queries*`; integration 4/4 against local Supabase.
- `npm run lint`: 0 errors (2 existing import/order warnings in `src/app/dev-preview/page.tsx`, not touched). `tsc --noEmit`: clean.
- Full vitest (serial, local Supabase env, after `supabase db reset` + `npm run db:seed`): 199 files, 2358 tests, all pass. Integration alone: 30 files, 135 tests pass.
- e2e: no Playwright spec covers `/admin/manage`, and the config is pinned to port 3000 (a stale dev server from before this session was running there, left untouched), so the e2e suite was not run for this feature.
- Real-browser sweep (Playwright, dev server on :3100 against local Supabase, signed in as Priya): 5 URLs x widths 1920/1440/1280/1024/768: no horizontal scroll, no column overlap, no clipped rows. Selection, summary, `staffQ=Sar` (only Sarah Nguyen), `clientQ=zzz` (No clients found) all as expected.

## HUMAN REVIEW: test expectation changed
- ADM-UI-02 `manage-screen.test.tsx`: added a `next/navigation` mock and passes `selection` in (URL is the source of truth); Clear test asserts the URL update then rerenders empty; overlap test switches staff by rerender; the client-side filter test now asserts typing does not filter locally and a search with no rows shows "No clients found" (server filtering is covered by T-06/T-07). Details in DECISIONS FD-06.
- HUMAN REVIEW: test expectation changed (2026-09-30): two ADM-UI-02 tests asserted that a just-assigned shift warns about itself (a bug). Now they assert no warning; one test added. See DECISIONS FD-07. Layout of the assign-shift card also changed (time slots beside the calendar).
- HUMAN REVIEW: test expectation changed (2026-09-30): time-slot chips and Custom replaced by hour/minute dropdowns and common-shift buttons; ADM-UI-02 time tests rewritten and two option-counting tests scoped to their lists. See DECISIONS FD-08.
- ADM-UI-02 `manage-queries.test.ts`: "refuses Supabase mode" now expects a rejection instead of "not implemented".
- ADM-06 own test T-05 (test bug): the row's text includes avatar initials, so it now matches by accessible name.

## Files changed
- Tests: `src/features/admin-manage/manage-selection.test.tsx`, `manage-screen.test.tsx`, `src/server/admin/manage-queries.search.test.ts`, `manage-queries.test.ts`, `tests/integration/admin-manage-selection.test.ts`
- Production: `src/server/admin/manage-queries.ts`, `src/features/admin-manage/manage-screen.tsx`, `src/app/(admin)/admin/manage/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- Local DB was unseeded at first; the human ran `supabase db reset`, then `npm run db:seed`.
- The local admin (Priya) had to enrol a TOTP factor through the app's own MFA flow to reach the screen. That factor lives only in the local DB and is wiped by the next reset. Seed data still has "Daniel K." (not a full name, CHG-032 sweep not scheduled).

## Assumptions
- Supabase-mode `referenceDate` is today in Australia/Melbourne until ADM-07 wires shifts.

## Next action
- Wait for the human's "yes", then open the PR (title `ADM-06 Admin — Manage: staff and client selection`).

## Ready for PR
- No
