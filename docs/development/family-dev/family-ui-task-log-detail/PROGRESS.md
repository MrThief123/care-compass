# Progress — FAM-UI-07 Family Task log and Task detail screens (UI)

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6–D7
Branch: `feature/family-ui-task-log-detail` (created from `origin/family-dev`; merged `origin/feature/shared-screen-contracts-fixtures` = UI-04, see FD-14)
PR target: `family-dev`
Last updated: 2026-09-24 (CHG-014 amendment built on `feature/family-ui-task-detail-nav`, READY FOR PR; PR #55 merged to family-dev 2026-09-20)
CHG-014 amendment: READY FOR PR. Branch `feature/family-ui-task-detail-nav` (from `family-dev` at 6e6dd82), PR target `family-dev`, not opened (awaits the human's yes). Worked by Dhruv Verma's session, 2026-09-24.

**CHG-014 (2026-09-24): "Edit event" button and Back to the origin.** Task detail stays read-only. An outlined "Edit event" button sits at the right of the title row (FD-27) and the Description card's "Edit" link is gone. Back returns to where the task was opened from: links carry `from=calendar` + `view/date/month`, `from=home`, or `from=tasks` + `q/status/page`; Task detail shows "Back to Calendar", "Back to Home" or "Back to Task log", rebuilt only from whitelisted origins and re-validated params (FD-28, `task-detail-origin.ts`). New AC-09, AC-10, AC-11 (all MET), T-20 to T-22 (GREEN). Files: `src/features/family-task-detail/{task-detail-origin.ts, back-link.tsx (was back-to-task-log-link.tsx), task-detail-view.tsx}`, `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/{page.tsx, not-found.tsx}`, `src/features/family-task-log/task-routes.ts`, `src/features/family-calendar/{calendar-params.ts, family-calendar-view.tsx, log-panel.tsx}`, `src/features/family-home/home-routes.ts`, e2e `tests/e2e/family-task-detail-nav.spec.ts`.
- Red first: 4cf321a (25 failing tests plus the new module's test file failing to load, all for the expected reasons); green: c04dd61, 67b23ad.
- Checks (2026-09-24, local; CI is off): `npx tsc --noEmit` clean; `npx eslint .` 0 errors, 3 known warnings in other files; `npx prettier --check .` only `.claude/settings.json`; `npx vitest run src tests/unit` 99 files / 1,144 tests pass (baseline 1,099 + 45 new); `npx next build` then Playwright on `npm run start`: 28 of 28 pass (`family-task-detail-nav` 11, `family-calendar` 7, `family-task-log-filters` 3, `family-event-form` 2, `shared-app-shell` 5).
- Browser check (production server, Chromium): Task detail from the Calendar, Home and the Task log at 1440px, and the calendar after Back (week 30 Nov – 6 Dec, Thursday 3 December still selected). Width sweep 1920/1440/1280/1024/768 with the normal title, a 200-character title and a 140-character unbroken title: horizontal scroll 0, no overlap between the title, date line, Back and the button, button 98×44px and in view; at 600px the unbroken title wraps beside the button with no scroll.
- **HUMAN REVIEW: test expectation changed (FD-30):** 10 items; hrefs now carry `from=`, and the Description "Edit" link assertions became "Edit event". No test skipped, `.only`-ed or deleted.
- **HUMAN REVIEW: deviates from the design (FD-27):** the button placement and the varying back label are not in `family-08-task-detail.png`.
- Follow-ups (FD-29, not done): Edit event's Cancel uses `router.back()`; Task detail's Edit event link does not pass `?occurrence=<key>`.

**MERGED TO DEV (#55).** The human's layout requirement (2026-09-20): "Things should fit into their tabs and if too big then should resize or get cutoff rather than overlap." is met on the Task log (Task A, FD-20), Task detail and the document tile (Task B, FD-21) and the pager (Task C, FD-22); the visual polish against the design (Task D, FD-23) is done with the not-changed items recorded; the human's answers to UI-04 FD-04 and FD-05 are recorded (Task E, FD-24) and UI-04's docs commit is merged (d49b4e2). PR order (FD-14, FD-26), followed: UI-04 (#52) to `main`, then the shared shell fix (`fix/shared-app-shell-nav-header`, #53) to `main`, then `main` into `family-dev` (#56), then this PR (#55, opened on the human's yes, PD-056). This branch then merged `origin/family-dev` (b74bf10).

**Human review round 2 (2026-09-20), Task F:** the human asked for the search box and the Status select to line up (FD-25, done here) and, on all screens, for a sticky rail and a header that does not overlap or spill when narrow (built as a shared fix, merged into this branch, FD-26).

## Blockers
- None. UI-04 and the shell fix are on `main` and `family-dev` (the FD-14 sequencing is done).

## HUMAN REVIEW
- **AC-01 wording changed (FD-17, UI-04 FD-05; the order itself was answered, FD-24):** strict newest-first replaces the design's drawn order; page 1 starts Afternoon check-in, Physiotherapy, Morning medication. Also AC-01/AC-04 use full names (FD-01, PD-038). AC-05 to AC-08 were added under CHG-005.
- **HUMAN REVIEW: test expectation changed (FD-13):** 13 items with before, after and reason; client-side filter and sort tests, the `findOccurrence` tests and the Documents-empty test changed or were replaced. No test skipped, `.only`-ed or silently deleted.
- **Answered by the human on 2026-09-20 (FD-24):** UI-04 FD-04 (Home's design shows 3 overdue, the Task log 2): "Doesn't matter", so 2 stays; UI-04 FD-05 (within-day order): "Based off time they were created in calendar", read as strictly by calendar start time (the contract rule as built), so AC-01's wording stands. Nothing further to confirm on these two.
- **Design gaps built from tokens (FD-08, PD-052)** and the pager, "No tasks to show", document tile type/size line: design owner to review.
- **Design fidelity calls in FD-23 (Task D), please review:** what was matched to the design (teal search border, 8px label gap, 26px pills, no header underline, 44px Clear target) and what was deliberately not (placeholder and heading colour below 4.5:1, focus ring, separator inset, the search input's accessible name); shared-kit requests for lane S.
- **Design deviation in FD-25 (Task F), please review:** the Status select is level with the search box, as the human asked; `family-07-task-log.png` draws the select one label lower. The offset is `@min-[30.5rem]:mt-[calc(1lh+0.5rem)]` on the search form, tied to the search's 16rem basis, the 12px gap and the select's 220px.
- **Shared shell fix merged in (FD-26):** sticky rail and wrapping header come from F0-15 FD-04 on `fix/shared-app-shell-nav-header` (a shared branch, F0-15's owner is MrThief123; the family `layout.tsx`, a lane F file, is edited inside that shared branch). It reached `main` as #53 and `family-dev` with the sync #56.
- **Environment finding (FD-25):** `next dev` returns 403 for `/_next/static/chunks/*` to the `127.0.0.1` origin in `playwright.config.ts` (Next 16 `allowedDevOrigins`), so the client bundle does not load in an e2e run and any spec that types or clicks client-side cannot work against `next dev`. Needs a human call: add `allowedDevOrigins: ["127.0.0.1"]` to `next.config.ts` (not this lane's file), or use `localhost` in the config.
- **Design call in FD-22 (Task C), please review:** below a 28rem-wide pager the numbers give way to Previous / 'Page x of y' / Next on one line.
- **Design calls in FD-21 (Task B), please review:** the document tile is 160 to 192px wide in a wrapping grid where the design draws 104px (the added type and size line needs the room, and 104px broke ordinary names mid-word); long document names are cut at two lines with an ellipsis (whole name on hover and in the DOM). **HUMAN REVIEW: test expectation changed** (FD-21): one assertion in `document-tile.test.tsx` (`toHaveClass("break-all")` became `not.toHaveClass("break-all")`).
- **Design calls in FD-20 (Task A), please review:** the card layout below a 48rem-wide log (about a 920px window), its three lines and the middle-dot separator, long names and titles cut with an ellipsis (full text on hover and in the DOM) instead of shown whole, column headings visually hidden in card layout. Also the shared `DataTable` follow-up request (fixed widths, overflow handling, narrow layout) for Carer and Admin.
- **Shared kit requests (FD-09, FD-18):** SearchField label prop, `DataTable` column widths, a 44px Clear-search target, vertical file tile, time/size formatters.
- **Non-blocking OQs:** OQ-29 followed; OQ-31 and OQ-39 OPEN, defaults applied (OQ-31 is now the contract's newest-first order).

## Dependencies status
- F0-15, UI-03, UI-02 — merged to `family-dev`.
- UI-04 (shared screen contracts and fixtures) — merged to `main` (#52) and, with the sync (#56), to `family-dev`; first merged into this branch as FD-14.
- F0-15 shell fix (sticky rail, wrapping header) — merged to `main` (#53) and to `family-dev` with the sync (#56); first merged into this branch as FD-26.

## Completed
- Task log is the whole history, server-driven: `page.tsx` reads `searchParams`, `loadTaskLog` validates them (Zod), asks `getTaskLog(clientId, {q, status, page})` for that page, redirects a page past the last to the last page; `TaskLogView` shows rows in the contract's order, `TaskLogPager` ('Showing 21-40 of 137', Previous/Next, 7-slot page window, 44px classes), search (400 ms debounce, Enter, Clear) and Status update the URL via `router.replace` and reset the page; the box follows the URL; empty, no-results, loading and error states; live result count.
- Task detail: `getOccurrence` (past or future, unknown or other-client key is 404), Documents card from `getEventDocuments` (tiles: name cut to two lines with the full name in `title`, type and size; empty state kept), 'Back to Task log' and task links carry the validated q/status/page.
- Removed: `filterTaskLog`, `sortTaskLog`, `findOccurrence`, `design-fixtures.ts` and their tests.
- Docs: AC statuses, TEST_PLAN, PRD Scope line (CHG-005), DECISIONS FD-13 to FD-20.
- Task A (2026-09-20, commits 77af56f red, 573c732 green): `src/features/family-task-log/task-log-table.tsx` replaces the shared `DataTable` in `TaskLogView`. Fixed grid tracks (DATE 7rem, TASK minmax(0,1fr), NURSE clamp(9rem,20%,14rem), STATUS clamp(12rem,26%,20rem), chevron 2.5rem), every cell `min-w-0`, title `line-clamp-2` + `overflow-wrap:anywhere` + `title`, nurse `truncate`, pill capped (`max-w-full`, label ellipsis, icon `shrink-0`, full text in `title` and DOM), a three-line card layout below a 48rem-wide log (container query `@3xl`), headings `sr-only` there, one DOM for both layouts, toolbar wraps. See FD-20.

- Task B (2026-09-20, commits 6f3d9ac red, then green): `document-tile.tsx` and `task-detail-view.tsx`. Documents are a wrapping grid (`minmax(min(10rem,100%),12rem)`), the tile fills its cell, the name is `line-clamp-2` with `[overflow-wrap:anywhere]` (no `break-all`), type and size are one line, the header, the Status pill (capped wrapper, full-size icon) and the description wrap or cut instead of spilling. See FD-21.
- Task C (2026-09-20, commits 13a7a40 red, then green): `task-log-pager.tsx` is a size container; below `@md` (28rem) the numbered links give way to 'Page 125 of 250' between Previous and Next, one line; the 7-slot window already made 27 and 250 pages read the same. See FD-22.
- Task D (2026-09-20, commits ae3e25d red, then green): brand-teal search border, 44px Clear-search hit area, 8px under the Status label, equal 26px pills (`status-pill-class.ts`), no header underline; the not-changed items (placeholder and heading colour, focus ring, separator inset, accessible name for the input) and why are in FD-23.
- Task F (2026-09-20, commits b02f371 and 5619d5e red, 02c4bc5 green; merge b27c2e6): the search form is offset by `FILTER_ROW_SEARCH` so the search box and the Status select share top and bottom (170/214/44 at 1440, 1024 and 768), stacked without an offset below a 30.5rem-wide row; the shared shell fix is merged in. See FD-25 and FD-26.

## In progress
- None.

## Remaining
- Nothing. PR #55 is merged.
- The PRD asks for side-by-side screenshots in the PR. The human chose not to attach images (2026-09-20), so the PR text lists the differences from `docs/design/screens/family-07-task-log.png` and `family-08-task-detail.png` instead.

## Acceptance criteria status
- 8 / 8 MET at test level, and driven in a real browser (paging, hostile params, Back with q/status/page, search in the URL; see the final sweep).

| AC | Status | Proven by |
|---|---|---|
| AC-01 | MET | `[AC-01]` tests in `task-log-view.test.tsx` and `page.test.tsx` on the real contract (20 rows, first three, nine design-week rows, 102-char title and 51-char name) |
| AC-02 | MET | `[AC-02]` view and page tests (`?status=overdue`: 2 rows, nurse '—') |
| AC-03 | MET | `[AC-03]` view and page tests (`?q=Zoe`) |
| AC-04 | MET | `[AC-04]` tests: detail view, page, all 137 keys open, oldest row opens, future task via `page.edge.test.tsx` |
| AC-05 | MET (tests + browser) | pager tests, `page.test.tsx` (7 pages, 137 rows once each), `page.volume.test.tsx` (537 and 5,000 rows, 0/1/19/20/21/40/41) |
| AC-06 | MET (tests + browser: page 0, -3, abc and 1.5 give page 1, 99999 gives the last page, status=bogus gives all, a 5,000-character q is cut to 200; HTTP 200, no console errors) | `task-log-params.test.ts`, `load-task-log.test.ts`, page tests (page 0, -3, abc, 1.5, 99999, status=bogus, 5,000-char q) |
| AC-07 | MET (tests + browser: search and Status put q and status in the URL; they use `router.replace`, so they add no history entries, by design FD-16; paging links and 'Back to Task log' do navigate) | view tests with a mocked router (debounce, Enter, Clear, Status, follows URL, echo, cancel) |
| AC-08 | MET (tests + browser: from `?q=medication&status=done&page=2` a task opens and Back returns to the same URL, first row, box text and Status) | routes, view, detail view and page tests |

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

## Final verification (2026-09-20, after Tasks A to E; code of 0ed2294 plus docs)
- `npx vitest run src` -> 75 files, 776 tests, all pass (was 74 / 747 after Task A: Tasks B to D add 29 tests: 4+7 detail and tile, 8 pager, 10 polish).
- `npx vitest run` (plain) -> 79 files: 78 pass, 1 fails; 782 tests pass. The one failure is the known baseline `tests/integration/shared-supabase-environment.test.ts` (throws at import: no Supabase env vars). `mocks-import-boundary.test.ts` and `day-timeline.test.tsx` passed this time.
- `npm run lint` -> 0 errors, 23 warnings (the same pre-existing ones). `npm run typecheck` -> clean. `npm run format:check` -> clean.
- Throwaway preview routes (`zz-preview`, `zz-pager`) deleted before the final runs; not committed.

### Final real-browser sweep (Chromium against `next dev` on :3107, throwaway scripts outside the repo)
Each cell: page-level horizontal scroll in px / rows of text overlapping a neighbour / boxes painted past their container. Identical for all five pages:

| Page | 1920 | 1440 | 1280 | 1024 | 900 | 768 | 640 | 375 |
|---|---|---|---|---|---|---|---|---|
| `/family/client-margaret/tasks?as=family` | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 57/0/0 |
| `...?as=family&page=7` | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 57/0/0 |
| `...?as=family&status=overdue` | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 57/0/0 |
| detail: eye-drops (102-char title, 51-char carer, 92-char document) | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 57/0/0 |
| detail: physio (2 documents) | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 57/0/0 |

The +57px at 375 is the family layout header (out of scope; phone views are parked, PL-17). No console errors on any page. Behaviour also driven in the browser: Next and a page-number link change the page (`?page=2`, `?page=7`, 'Showing 121-137 of 137', 17 rows); at 375 the pager reads Previous / 'Page 7 of 7' (numbers hidden) and Previous goes to `?page=6`; a task opened from `?q=medication&status=done&page=2` carries those params and 'Back to Task log' returns to the same URL with the same first row, box text and Status; typing 'physio' puts `?q=physio` in the URL (14 rows).

## Verification of Task F (code of 02c4bc5 plus docs, 2026-09-20)
- Red first: the e2e spec (b02f371, revised in 5619d5e) and the jsdom class test fail without the offset (boxes 28px apart: `Expected: < 0.5, Received: 28`, 2 of 3 e2e specs; the stacked one passes before and after); green with it.
- `npx vitest run src` -> 75 files, 777 tests, all pass (one new). `npx vitest run` (plain) -> 79 files: 78 pass, 1 fails; 783 tests pass. The failure is the known baseline `tests/integration/shared-supabase-environment.test.ts` (no Supabase env vars).
- `npm run lint` -> 0 errors, 23 warnings (the same). `npm run typecheck` -> clean. `npm run format:check` -> clean.
- `npx playwright test tests/e2e/family-task-log-filters.spec.ts` (baseURL `http://127.0.0.1:3107`, a `next dev` of this worktree) -> 3 of 3 pass; 45 of 45 with `--repeat-each=15` and 30 of 30 with `--repeat-each=10` after the polling assertion. One earlier run failed once and was not captured; it did not recur in 81 further runs.
- Real-browser sweep of the five pages (tasks, `?page=7`, `?status=overdue`, both detail URLs), 1920 / 1440 / 1280 / 1024 / 900 / 768 / 640 / 480 / 375 / 320: page-level horizontal scroll 0, text overlaps 0, boxes past their container 0 in every cell, no console errors. The +57px at 375 in the tables above is gone now that the shell fix is merged (the header was its cause).
- Shell checks on the merged build: rail at scrollY 1200 is at top 0 / bottom 800 in an 800px window (sticky, five links in view); search and Status 170/214/44 at 1440, 1024 and 768; header 76px from 700px up, 99 to 139px below, no header text outside the bar at any width. One flag at 320px ("78 years · Preston V" against the date) is the line-clamped, clipped third line the range-rect check counts; the 320px screenshot shows the name, two-line subline with an ellipsis, date and user all inside the bar, no overlap.

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
- `tests/e2e/family-task-log-filters.spec.ts` (Task F, real browser; run against a `next dev` on :3000, or with a local config, FD-25).
- `docs/development/family-dev/family-ui-task-log-detail/`: this feature's docs. The UI-04 merge brings `src/mocks`, `src/server`, `src/types` and its docs into the diff (not this feature's edits).

## Decisions
- FD-01 to FD-26 in DECISIONS.md (FD-02, FD-03, FD-04 superseded by UI-04; FD-20 is the responsive Task log table; FD-21 is Task detail and the document tile; FD-22 is the pager; FD-23 is the visual polish; FD-24 the human's answers; FD-25 search and Status alignment; FD-26 the shared shell fix merged in).

## Assumptions
- To run the pages locally: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy SUPABASE_SERVICE_ROLE_KEY=dummy npx next dev -p 3107`, then open `/family/client-margaret/tasks?as=family`.

## Next action
- None. The feature is merged to `family-dev`.

## Ready for PR
- Merged: #55 to `family-dev` (2026-09-20).
