# Progress — FAM-UI-07 Family Task log and Task detail screens (UI)

Status: IN PROGRESS (CHG-005 green and browser-checked by the reviewer; responsive Task log table (Task A), Task detail / document tile (Task B), pager (Task C) and visual polish (Task D) DONE, green and pushed; Task E remains)
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6–D7
Branch: `feature/family-ui-task-log-detail` (created from `origin/family-dev`; merged `origin/feature/shared-screen-contracts-fixtures` = UI-04, see FD-14)
PR target: `family-dev`
Last updated: 2026-09-20

**Not READY FOR PR.** The human's layout requirement (2026-09-20): "Things should fit into their tabs and if too big then should resize or get cutoff rather than overlap." Tasks A (Task log table), B (Task detail and document tile), C (pager) and D (visual polish, FD-18 and FD-23) are done; E (record answers, merge docs commit, final verification) remains: exact steps in SESSION_STATE.md. PR order is fixed by FD-14: UI-04 to `main`, then `main` into `family-dev`, then this PR. Nothing has been opened or merged.

## Blockers
- None technical. The PR is sequenced behind UI-04 (FD-14).

## HUMAN REVIEW
- **AC-01 wording changed (FD-17, UI-04 FD-05):** strict newest-first replaces the design's drawn order; page 1 starts Afternoon check-in, Physiotherapy, Morning medication. Also AC-01/AC-04 use full names (FD-01, PD-038). AC-05 to AC-08 were added under CHG-005.
- **HUMAN REVIEW: test expectation changed (FD-13):** 13 items with before, after and reason; client-side filter and sort tests, the `findOccurrence` tests and the Documents-empty test changed or were replaced. No test skipped, `.only`-ed or silently deleted.
- **Design conflict (UI-04 FD-04):** Home's design shows 3 overdue, the Task log design 2; UI-04 chose 2. Human to confirm.
- **Design gaps built from tokens (FD-08, PD-052)** and the pager, "No tasks to show", document tile type/size line: design owner to review.
- **Design fidelity calls in FD-23 (Task D), please review:** what was matched to the design (teal search border, 8px label gap, 26px pills, no header underline, 44px Clear target) and what was deliberately not (placeholder and heading colour below 4.5:1, focus ring, separator inset, the search input's accessible name); shared-kit requests for lane S.
- **Design call in FD-22 (Task C), please review:** below a 28rem-wide pager the numbers give way to Previous / 'Page x of y' / Next on one line.
- **Design calls in FD-21 (Task B), please review:** the document tile is 160 to 192px wide in a wrapping grid where the design draws 104px (the added type and size line needs the room, and 104px broke ordinary names mid-word); long document names are cut at two lines with an ellipsis (whole name on hover and in the DOM). **HUMAN REVIEW: test expectation changed** (FD-21): one assertion in `document-tile.test.tsx` (`toHaveClass("break-all")` became `not.toHaveClass("break-all")`).
- **Design calls in FD-20 (Task A), please review:** the card layout below a 48rem-wide log (about a 920px window), its three lines and the middle-dot separator, long names and titles cut with an ellipsis (full text on hover and in the DOM) instead of shown whole, column headings visually hidden in card layout. Also the shared `DataTable` follow-up request (fixed widths, overflow handling, narrow layout) for Carer and Admin.
- **Shared kit requests (FD-09, FD-18):** SearchField label prop, `DataTable` column widths, a 44px Clear-search target, vertical file tile, time/size formatters.
- **Non-blocking OQs:** OQ-29 followed; OQ-31 and OQ-39 OPEN, defaults applied (OQ-31 is now the contract's newest-first order).

## Dependencies status
- F0-15, UI-03, UI-02 — merged to `family-dev`.
- UI-04 (shared screen contracts and fixtures) — pushed, PR NOT opened; merged into this branch (FD-14).

## Completed
- Task log is the whole history, server-driven: `page.tsx` reads `searchParams`, `loadTaskLog` validates them (Zod), asks `getTaskLog(clientId, {q, status, page})` for that page, redirects a page past the last to the last page; `TaskLogView` shows rows in the contract's order, `TaskLogPager` ('Showing 21-40 of 137', Previous/Next, 7-slot page window, 44px classes), search (400 ms debounce, Enter, Clear) and Status update the URL via `router.replace` and reset the page; the box follows the URL; empty, no-results, loading and error states; live result count.
- Task detail: `getOccurrence` (past or future, unknown or other-client key is 404), Documents card from `getEventDocuments` (tiles: name cut to two lines with the full name in `title`, type and size; empty state kept), 'Back to Task log' and task links carry the validated q/status/page.
- Removed: `filterTaskLog`, `sortTaskLog`, `findOccurrence`, `design-fixtures.ts` and their tests.
- Docs: AC statuses, TEST_PLAN, PRD Scope line (CHG-005), DECISIONS FD-13 to FD-20.
- Task A (2026-09-20, commits 77af56f red, 573c732 green): `src/features/family-task-log/task-log-table.tsx` replaces the shared `DataTable` in `TaskLogView`. Fixed grid tracks (DATE 7rem, TASK minmax(0,1fr), NURSE clamp(9rem,20%,14rem), STATUS clamp(12rem,26%,20rem), chevron 2.5rem), every cell `min-w-0`, title `line-clamp-2` + `overflow-wrap:anywhere` + `title`, nurse `truncate`, pill capped (`max-w-full`, label ellipsis, icon `shrink-0`, full text in `title` and DOM), a three-line card layout below a 48rem-wide log (container query `@3xl`), headings `sr-only` there, one DOM for both layouts, toolbar wraps. See FD-20.

- Task B (2026-09-20, commits 6f3d9ac red, then green): `document-tile.tsx` and `task-detail-view.tsx`. Documents are a wrapping grid (`minmax(min(10rem,100%),12rem)`), the tile fills its cell, the name is `line-clamp-2` with `[overflow-wrap:anywhere]` (no `break-all`), type and size are one line, the header, the Status pill (capped wrapper, full-size icon) and the description wrap or cut instead of spilling. See FD-21.
- Task C (2026-09-20, commits 13a7a40 red, then green): `task-log-pager.tsx` is a size container; below `@md` (28rem) the numbered links give way to 'Page 125 of 250' between Previous and Next, one line; the 7-slot window already made 27 and 250 pages read the same. See FD-22.
- Task D (2026-09-20, commits ae3e25d red, then green): brand-teal search border, 44px Clear-search hit area, 8px under the Status label, equal 26px pills (`status-pill-class.ts`), no header underline; the not-changed items (placeholder and heading colour, focus ring, separator inset, accessible name for the input) and why are in FD-23.

## In progress
- None.

## Remaining (in this order; commit and push after each; details in SESSION_STATE.md; Tasks B, C and D are done)
- **E. Record and finish**: (1) FD-24 (next free number): FD-04 answered "Doesn't matter" (Task log's 2 overdue stays) and FD-05 answered "Based off time they were created in calendar" (read as strictly by calendar start time, the contract rule as built: newest first, ties by key ascending; AC-01 wording stands), both by the human on 2026-09-20; (2) the shared `DataTable` follow-up is already recorded in FD-20 (repeat it in the PR body); (3) merge `origin/feature/shared-screen-contracts-fixtures` once (docs-only commit 788cd6c) and keep the PR order note (FD-14); (4) update ACCEPTANCE_CRITERIA, TEST_PLAN, PROGRESS, SESSION_STATE, DECISIONS honestly; (5) final verification (below, plain `npx vitest run` included), `END SESSION`, report READY FOR PR.

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

## Task A evidence: width sweep of page 1 of Margaret's log (real Chromium against `next dev` on :3107, 2026-09-20)
Page 1 holds the 102-character title and the 51-character carer name (Wed 25 Nov 16:30). Columns: layout | rows with text overlapping a neighbour | rows with the pill past the card edge | rows whose painted content is outside the card | page-level horizontal scroll | tallest row | pill height.

| Window | Layout | Overlap | Pill past card | Content outside card | Page h-scroll | Tallest row | Pill h |
|---|---|---|---|---|---|---|---|
| 1920 | table | 0/20 | 0/20 | 0/20 | no | 50px | 26-28px |
| 1440 | table | 0/20 | 0/20 | 0/20 | no | 50px | 26-28px |
| 1280 | table | 0/20 | 0/20 | 0/20 | no | 50px | 26-28px |
| 1024 | table | 0/20 | 0/20 | 0/20 | no | 50px | 26-28px |
| 900 | cards | 0/20 | 0/20 | 0/20 | no | 101px | 26-28px |
| 768 | cards | 0/20 | 0/20 | 0/20 | no | 101px | 26-28px |
| 640 | cards | 0/20 | 0/20 | 0/20 | no | 101px | 26-28px |
| 375 | cards | 0/20 | 0/20 | 0/20 | +57px | 101px | 26-28px |

Before (reviewer, same page, old `DataTable`): 1440 0/0/no; 1100 1/0/no; 1024 18/0/no; 900 1/1/yes (110px); 768 18/1/yes (242px); 633 18/18/yes (377px); 375 18/20/yes (635px). No console errors. At 375 the page-level scroll (+57px) is the family layout's header (`PageHeader` date and user block, not this feature; `main` is exactly 287px wide and fits); phone views are parked (PL-17). Screenshots looked at: 1440 and 1024 (table, long title in two lines ending in an ellipsis, long name cut, pill icon full size) and 768 (cards, full names visible, dot separator). The icon in a cut pill shrank to a speck until `[&>svg]:shrink-0` (test added red first, then fixed).

## Task B evidence: width sweep of Task detail (real Chromium against `next dev` on :3107, 2026-09-20)
Columns: page-level horizontal scroll (px) | rows of text overlapping a neighbour | boxes painted past their container. The three pages: the eye-drops task (102-character title, 51-character carer name in the Status pill and the "Assigned to" line, one document with a 92-character name), the physio task (two documents) and a throwaway worst-case preview (102-character title, 60-character carer name with no spaces, 2,000-character description plus an unbroken 300-character string and a 60-character token, six documents: 92-character names with and without spaces, non-ASCII, 25.0 GB, 1023.4 KB; the route is not committed).

| Window | eye-drops | physio | worst case (before Task B) | worst case (after) |
|---|---|---|---|---|
| 1920 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 1440 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 1280 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 1024 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 900 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 768 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 640 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 375 | 57 / 0 / 0 | 57 / 0 / 0 | 118 / 0 / 0 | 57 / 0 / 0 |

The 57px at 375 is the family layout header (not this feature; phone views are parked, PL-17). Before Task B the extra 61px at 375 was the 60-character no-space name in the "Assigned to" line running past the card edge. No element inside `main` is past the viewport edge at 375 after the fix. Screenshots looked at: eye-drops at 1440, 768 and 375; worst case at 768 (six tiles, no mid-word breaks, 92-character names cut at two lines with an ellipsis, type and size on one line, "Excel · 25.0 GB" whole) and 375 (title wraps, the no-space name wraps, the pill ends in an ellipsis with a full-size icon). No console errors.

## Task C evidence: pager sweep (real Chromium against `next dev` on :3107, throwaway preview route, 2026-09-20)
Page-level scroll from the pager was 0 at every width (the +57px at 375 is the family layout header). Controls per row | smallest control | controls past the pager's edge | text overlaps, then nav height. Same for 137 rows (7 pages, page 2), 537 (27 pages, page 14) and 5,000 (250 pages, pages 1, 125 and 250):

| Window | Layout | Rows of controls | Smallest control | Past edge | Overlaps | Nav height |
|---|---|---|---|---|---|---|
| 1920 to 900 | numbers | 1 | 44x44 | 0 | 0 | 44px |
| 768 | numbers | 1 | 44x44 | 0 | 0 | 44px (70px for the 5,000-row middle page: summary wraps above) |
| 640 | numbers | 1 | 44x44 | 0 | 0 | 70px (summary above the controls) |
| 375 | Previous / Page x of y / Next | 1 | 54x44 | 0 | 0 | 70px |

Before (375, 5,000 rows, page 125): 2 rows of controls, nav 118px; the current page was on the second row. Screenshots looked at: 5,000 rows at 768 and 640 (numbers, one row) and 375 (before: two rows; after: "Previous  Page 125 of 250  Next").

## Verification of Task A (commit 573c732, 2026-09-20)
- `npx vitest run src` -> 74 files, 747 tests, all pass (was 73 / 730: `task-log-table.test.tsx` adds 14, `task-log-view.test.tsx` adds 3).
- `npm run lint` -> 0 errors, 23 warnings (the same pre-existing ones). `npm run typecheck` -> clean. `npm run format:check` -> clean.
- Plain `npx vitest run` not re-run this session yet (do it in Task E).

## Verification (final code of ea21964, 2026-09-19)
- `npx vitest run src` → 73 files, 730 tests, all pass (UI-04's 414 baseline plus this feature).
- `npx vitest run` (plain) → 77 files: 76 pass, 1 fails, 736 tests pass. The one failure is the known baseline `tests/integration/shared-supabase-environment.test.ts` (throws at import, no Supabase env vars).
- `npm run lint` → 0 errors, 23 warnings (all pre-existing, in `scripts/plan-status.mjs` and `src/app/page.tsx`).
- `npm run typecheck` → clean. `npm run format:check` → clean.
- Not run: `supabase test db` (no schema change; Supabase CLI out of bounds), Playwright e2e (no e2e AC).

## Files changed
- `src/features/family-task-log/`: `task-log-params.ts`, `pagination.ts`, `load-task-log.ts`, `task-log-pager.tsx`, `task-routes.ts`, `task-log-view.tsx`, `task-log-table.tsx` (+ tests, `fake-task-log.ts` test-support); deleted `task-log-query.ts`, `design-fixtures.ts`.
- `src/features/family-task-detail/`: `document-format.ts`, `document-tile.tsx`, `back-to-task-log-link.tsx`, `task-detail-view.tsx` (+ tests); deleted `find-occurrence.ts`.
- `src/app/(family)/family/[clientId]/tasks/`: `page.tsx`, `[occurrenceKey]/page.tsx` (+ tests).
- `docs/development/family-dev/family-ui-task-log-detail/`: this feature's docs. The UI-04 merge brings `src/mocks`, `src/server`, `src/types` and its docs into the diff (not this feature's edits).

## Decisions
- FD-01 to FD-23 in DECISIONS.md (FD-02, FD-03, FD-04 superseded by UI-04; FD-20 is the responsive Task log table; FD-21 is Task detail and the document tile; FD-22 is the pager; FD-23 is the visual polish).

## Assumptions
- To run the pages locally: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy SUPABASE_SERVICE_ROLE_KEY=dummy npx next dev -p 3107`, then open `/family/client-margaret/tasks?as=family`.

## Next action
- Task E (SESSION_STATE.md). Do not open the PR without approval (PD-056).

## Ready for PR
- No: Tasks B to E outstanding; PR sequencing per FD-14.
