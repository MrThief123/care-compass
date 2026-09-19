# Progress — FAM-UI-07 Family Task log and Task detail screens (UI)

Status: IN PROGRESS (CHG-005 implemented and green; real-browser check, kit-gap pass and final verification remain)
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6–D7
Branch: `feature/family-ui-task-log-detail` (created from `origin/family-dev`; merged `origin/feature/shared-screen-contracts-fixtures` = UI-04, see FD-14)
PR target: `family-dev`
Last updated: 2026-09-19

**Not READY FOR PR.** Remaining before READY FOR PR: the real-browser check (SESSION_STATE.md, step 1), the FD-18 kit-gap pass, and re-running the verification below. PR order is fixed by FD-14: UI-04 to `main`, then `main` into `family-dev`, then this PR. Nothing has been opened or merged.

## Blockers
- None technical. The PR is sequenced behind UI-04 (FD-14).

## HUMAN REVIEW
- **AC-01 wording changed (FD-17, UI-04 FD-05):** strict newest-first replaces the design's drawn order; page 1 starts Afternoon check-in, Physiotherapy, Morning medication. Also AC-01/AC-04 use full names (FD-01, PD-038). AC-05 to AC-08 were added under CHG-005.
- **HUMAN REVIEW: test expectation changed (FD-13):** 13 items with before, after and reason; client-side filter and sort tests, the `findOccurrence` tests and the Documents-empty test changed or were replaced. No test skipped, `.only`-ed or silently deleted.
- **Design conflict (UI-04 FD-04):** Home's design shows 3 overdue, the Task log design 2; UI-04 chose 2. Human to confirm.
- **Design gaps built from tokens (FD-08, PD-052)** and the pager, "No tasks to show", document tile type/size line: design owner to review.
- **Shared kit requests (FD-09, FD-18):** SearchField label prop, `DataTable` column widths, a 44px Clear-search target, vertical file tile, time/size formatters.
- **Non-blocking OQs:** OQ-29 followed; OQ-31 and OQ-39 OPEN, defaults applied (OQ-31 is now the contract's newest-first order).

## Dependencies status
- F0-15, UI-03, UI-02 — merged to `family-dev`.
- UI-04 (shared screen contracts and fixtures) — pushed, PR NOT opened; merged into this branch (FD-14).

## Completed
- Task log is the whole history, server-driven: `page.tsx` reads `searchParams`, `loadTaskLog` validates them (Zod), asks `getTaskLog(clientId, {q, status, page})` for that page, redirects a page past the last to the last page; `TaskLogView` shows rows in the contract's order, `TaskLogPager` ('Showing 21-40 of 137', Previous/Next, 7-slot page window, 44px classes), search (400 ms debounce, Enter, Clear) and Status update the URL via `router.replace` and reset the page; the box follows the URL; empty, no-results, loading and error states; live result count.
- Task detail: `getOccurrence` (past or future, unknown or other-client key is 404), Documents card from `getEventDocuments` (tiles: name cut to two lines with the full name in `title`, type and size; empty state kept), 'Back to Task log' and task links carry the validated q/status/page.
- Removed: `filterTaskLog`, `sortTaskLog`, `findOccurrence`, `design-fixtures.ts` and their tests.
- Docs: AC statuses, TEST_PLAN, PRD Scope line (CHG-005), DECISIONS FD-13 to FD-19.

## In progress
- None (stopped at a context checkpoint).

## Remaining
1. Real-browser check at 1440x1024 (SESSION_STATE.md): pager, URL updates, Back button keeping context, deep links, invalid params, long-title and long-name rows on page 1, document tiles, console errors; then stop the dev server.
2. FD-18: review the FD-09 item 5 visual differences and the 24px Clear-search button against the design PNGs; fix with local className overrides where safe, otherwise record the exact reason.
3. Re-run the full verification below on the final commit; update this file; `END SESSION`.

## Acceptance criteria status
- 8 / 8 MET at test level (AC-05 to AC-08 also await the real-browser check).

| AC | Status | Proven by |
|---|---|---|
| AC-01 | MET | `[AC-01]` tests in `task-log-view.test.tsx` and `page.test.tsx` on the real contract (20 rows, first three, nine design-week rows, 102-char title and 51-char name) |
| AC-02 | MET | `[AC-02]` view and page tests (`?status=overdue`: 2 rows, nurse '—') |
| AC-03 | MET | `[AC-03]` view and page tests (`?q=Zoe`) |
| AC-04 | MET | `[AC-04]` tests: detail view, page, all 137 keys open, oldest row opens, future task via `page.edge.test.tsx` |
| AC-05 | MET (tests) | pager tests, `page.test.tsx` (7 pages, 137 rows once each), `page.volume.test.tsx` (537 and 5,000 rows, 0/1/19/20/21/40/41) |
| AC-06 | MET (tests) | `task-log-params.test.ts`, `load-task-log.test.ts`, page tests (page 0, -3, abc, 1.5, 99999, status=bogus, 5,000-char q) |
| AC-07 | MET (tests) | view tests with a mocked router (debounce, Enter, Clear, Status, follows URL, echo, cancel) |
| AC-08 | MET (tests) | routes, view, detail view and page tests |

## Tests
- Red first: commits 50f9fb5 (5 files failing to load) and a54fbc3 (6 files failing to load, 74 tests failing) before any implementation; green in 5f7c754 and ea21964. Details: TEST_PLAN.md.
- The feature's folders: 17 files, 316 tests, all pass.

## Verification (final code of ea21964, 2026-09-19)
- `npx vitest run src` → 73 files, 730 tests, all pass (UI-04's 414 baseline plus this feature).
- `npx vitest run` (plain) → 77 files: 76 pass, 1 fails, 736 tests pass. The one failure is the known baseline `tests/integration/shared-supabase-environment.test.ts` (throws at import, no Supabase env vars).
- `npm run lint` → 0 errors, 23 warnings (all pre-existing, in `scripts/plan-status.mjs` and `src/app/page.tsx`).
- `npm run typecheck` → clean. `npm run format:check` → clean.
- Not run: `supabase test db` (no schema change; Supabase CLI out of bounds), Playwright e2e (no e2e AC).

## Files changed
- `src/features/family-task-log/`: `task-log-params.ts`, `pagination.ts`, `load-task-log.ts`, `task-log-pager.tsx`, `task-routes.ts`, `task-log-view.tsx` (+ tests, `fake-task-log.ts` test-support); deleted `task-log-query.ts`, `design-fixtures.ts`.
- `src/features/family-task-detail/`: `document-format.ts`, `document-tile.tsx`, `back-to-task-log-link.tsx`, `task-detail-view.tsx` (+ tests); deleted `find-occurrence.ts`.
- `src/app/(family)/family/[clientId]/tasks/`: `page.tsx`, `[occurrenceKey]/page.tsx` (+ tests).
- `docs/development/family-dev/family-ui-task-log-detail/`: this feature's docs. The UI-04 merge brings `src/mocks`, `src/server`, `src/types` and its docs into the diff (not this feature's edits).

## Decisions
- FD-01 to FD-19 in DECISIONS.md (FD-02, FD-03, FD-04 superseded by UI-04).

## Assumptions
- To run the pages locally: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy SUPABASE_SERVICE_ROLE_KEY=dummy npx next dev -p 3107`, then open `/family/client-margaret/tasks?as=family`.

## Next action
- Do the real-browser check and FD-18 pass (SESSION_STATE.md), then re-verify, then report READY FOR PR. Do not open the PR without approval (PD-056).

## Ready for PR
- No — browser check and FD-18 pass outstanding; PR sequencing per FD-14.
