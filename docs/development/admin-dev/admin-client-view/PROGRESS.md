# Progress — ADM-11 Admin — Client view

Status: MERGED TO DEV (merged to `main` in #214, 2026-10-03; status synced by a docs PR, owner Dhruv Verma)
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D19–D20
Branch: `feature/admin-client-view`
PR target: `main` (CHG-036)
Last updated: 2026-10-03

## Blockers
- None. No blocking decisions (PD-058 answered). FD-01 to FD-03 answered by the human 2026-10-03.

## Dependencies status
- ADM-04, FAM-01, FAM-04, FAM-06, FAM-07, FAM-09, FAM-10, FAM-11, FAM-14, FAM-15 — MERGED (`plan-status.mjs` lists ADM-11 as Ready to start)

## Completed
- Claimed; docs reconciled; tests written first (T-01 to T-14).
- Implemented: migration `20261003001936_admin_client_view_event_access.sql` (FD-01), `assertAdminClientAccess` (FD-03), client bar and routes (FD-05), the admin client layout and nine pages, name links in Clients, additive `basePath` on two Family budget views (FD-02), admin calendar loader (FD-07).

## In progress
- Nothing. Waiting for the human's "yes" to open the PR.

## Remaining
- None for AC-01 to AC-05.

## Acceptance criteria status

- 5 / 5 MET

## Tests
- Written: 14 / 14 planned (T-01 to T-14)
- Passing: all 14. New Vitest files pass; pgTAP `supabase test db` 33 files, 920 tests PASS (care_events 69 and admin_client_view 31 included, no downstream counts moved); integration `admin-client-view`, `admin-clients`, `admin-client-remove` 10 / 10; e2e `admin-client-view.spec.ts` 4 / 4 on the local stack (`E2E_PORT=3210 E2E_DATA_SOURCE=supabase`, built app).
- Full `npm test` with the local-stack env: 2821 passed, 11 failed in 7 integration files (documents, document-event-linking, carer-client-info, budget-thresholds, shared-sign-up, shared-dev-seed-data, shared-auth-security-audit). None touch ADM-11: they need the storage `collate "C"` index and the dev seed that `supabase db reset` removed (see memory notes on local storage). Without the local env, 65 files fail to load on the missing Supabase variables, as on main.
- Lint 0 errors (3 warnings in files this feature does not touch); typecheck and format:check clean.
- Real-browser check (Playwright, local stack, port 3210): width sweep 1920/1440/1280/1024/768 on Clients, the client's Home, Info, Calendar, Budget, Edit budget, Care log, Add event, Task detail, and a very long client name: no horizontal overflow, nav targets 44px, no console errors; five-link nav, Back to clients, Edit event and Cancel stay under `/admin/clients/<id>/`; other-organisation id, `not-a-client` and an unknown task key each show not-found.

## Files changed
- Docs in this folder.
- New tests: `src/features/admin-clients/client-view-link.test.tsx`, `src/features/admin-client-view/{client-routes,client-bar}.test.ts(x)`, `src/server/admin/client-access.test.ts`, `src/app/(admin)/admin/clients/[clientId]/layout.test.tsx`, `src/features/family-budget/budget-base-path.test.tsx`, `supabase/tests/admin_client_view.test.sql`, `tests/integration/admin-client-view.test.ts`, `tests/e2e/admin-client-view.spec.ts`.
- Production: `supabase/migrations/20261003001936_admin_client_view_event_access.sql`, `src/server/admin/client-access.ts`, `src/features/admin-client-view/{client-routes.ts,client-bar.tsx,load-calendar.ts}`, `src/app/(admin)/admin/clients/[clientId]/**`, `src/features/admin-clients/clients-screen.tsx`, Lane F additive `basePath` in `src/features/family-budget/{family-budget-view,edit-budget-view}.tsx`.
- Changed test: `supabase/tests/care_events.test.sql` (two assertions flipped, **HUMAN REVIEW: test expectation changed**, FD-01).

## Decisions
- FD-01 migration for admin event writes (flips two pgTAP assertions: HUMAN REVIEW: test expectation changed)
- FD-02 additive `basePath` on two Lane F views
- FD-03 admin not-found guard
- FD-07 admin calendar loader in Lane A
- FD-04 route `tasks`; FD-05 client bar and nav (HUMAN REVIEW, PD-052); FD-06 no mock mode

## Problems encountered
- None

## Assumptions
- FD-04, FD-05, FD-06

## Next action
- Human reviews, then says yes to open the PR (CHG-036 pre-PR check commands are above).

## Ready for PR
- Yes, pending the human's approval
