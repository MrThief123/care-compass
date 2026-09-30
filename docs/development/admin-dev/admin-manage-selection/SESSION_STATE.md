# Session State — ADM-06 Admin — Manage: staff and client selection

Last session date: 2026-09-30
Current branch: feature/admin-manage-selection
Worked on: FD-01 implementation (query, screen, page) and ADM-UI-02 test updates
What changed: manage-queries.ts, manage-screen.tsx, manage/page.tsx; tests per PROGRESS "HUMAN REVIEW"
Tests run: ADM-06 unit/component/integration, lint, typecheck, full vitest
Test results: ADM-06 all green (26 unit, 4 integration); lint/tsc clean; full vitest has unrelated failures on an unseeded local DB
Current blocker: local DB needs `supabase db reset` (seed.sql) for e2e and the visual preview; blocked by the permission classifier, human to decide
Important discoveries: `npm run db:seed` only uploads placeholder files; people/org rows come from seed.sql via db reset
Exact next action: after the local seed is loaded, run e2e with --grep-invert "F0-07", start dev on local Supabase, browser sweep 1920 to 768, then announce and wait for "yes"
Files likely to be touched next: none expected
Warning for next session: do not touch shared components; do not start ADM-07
