# Session State — ADM-06 Admin — Manage: staff and client selection

Last session date: 2026-09-30
Current branch: feature/admin-manage-selection
Worked on: claim, docs update, tests first
What changed: docs (PRD PR target/search params, ACs 05-06 proposed, TEST_PLAN T-05..T-08, DECISIONS FD-01..FD-06); three new test files
Tests run: new files only
Test results: 14 fail for the expected reason, 2 pass (T-01 guard, blank search). Integration run needs local Supabase env overrides (.env.local is hosted)
Current blocker: None. FD-02 (URL param names, no preselection) and FD-04 (active carers only) want human confirmation
Important discoveries: existing ADM-UI-02 tests assume preselection and client-side filtering; see FD-06 for the tests that must change
Exact next action: implement FD-01: `getAdminManage({staffSearch, clientSearch})` Supabase branch; ManageScreen `selection`/`staffSearch`/`clientSearch` props with router.replace; page reads searchParams
Files likely to be touched next: `src/server/admin/manage-queries.ts`, `src/features/admin-manage/manage-screen.tsx`, `src/app/(admin)/admin/manage/page.tsx`, `src/mocks/admin-manage.ts` (only if needed)
Warning for next session: do not touch shared components; do not start ADM-07 (assign body, shifts). Next.js 16: read node_modules/next/dist/docs for searchParams (async) before writing the page.
