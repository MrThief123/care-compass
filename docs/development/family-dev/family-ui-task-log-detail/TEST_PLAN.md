# Test Plan — FAM-UI-07 Family Task log and Task detail screens (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit** → `src/**/*.test.ts` for the pure helpers the screens use

## Test cases

Test titles start `[FAM-UI-07][AC-xx]` or `[FAM-UI-07][PRD]`. After CHG-005 the ACs are proven through the real contract (`src/server/**` in mock mode, UI-04 fixtures) and, for volume, through a generated 537 and 5,000 row history behind a `vi.mock` of the contract module (`fake-task-log.ts`, test-support only). Never only the sample rows. Changed or removed tests: DECISIONS.md FD-13.

| Test ID | Covers | Level | Test description | Result |
|---|---|---|---|---|
| T-01 | AC-01 | component + page | Page 1 of the real contract: 20 rows, newest first, Afternoon check-in / Physiotherapy / Morning medication on Mon 30 Nov, the nine design-week rows first, 102-char title and 51-char carer name in full, never re-sorted (`task-log-view.test.tsx`, `page.test.tsx`). | GREEN |
| T-02 | AC-02 | component + page | `?status=overdue` from the real contract: Weekly weigh-in and Medication review, nurse '—'. | GREEN |
| T-03 | AC-03 | component + page | `?q=Zoe`: 'No matches for "Zoe".', box shows Zoe, no rows, no pager. | GREEN |
| T-04 | AC-04 | component + page | Morning medication detail from `getOccurrence`: 'Done · Aisha Rahman', 'Completed at 09:14'; every one of the 137 tasks and the oldest row open; a future task opens without the log (`page.edge.test.tsx`). | GREEN |
| T-05 | PRD | unit | Nurse label rules (OQ-29 / PD-055 / PD-038). | GREEN (unchanged) |
| T-06 | AC-05..07 | unit | REPLACED (was client-side filter/sort): `task-log-params.test.ts`, `pagination.test.ts`, `load-task-log.test.ts` (search, Status, paging over 137 to 537 rows; 0, 1, 19, 20, 21, 40, 41 rows; hostile params; redirect past the last page; page size 0). | GREEN |
| T-07 | PRD, AC-07, AC-08 | unit | Routes, key encoding, and the shared URL contract `?q=&status=&page=` (defaults omitted, validated, round-trips awkward text, hostile client ids stay one segment). | GREEN |
| T-08 | AC-04 | unit | Melbourne wall-clock helpers. | GREEN (unchanged) |
| T-09 | PRD, AC-05, AC-07 | component | View: URL is the state (Status at once, debounce, Enter, Clear, follows the URL, echo not clobbering, cancel on Back and unmount, 200-char paste), states, live count, row and link navigation carrying q/status/page, 120/60/non-ASCII text, axe. | GREEN |
| T-10 | PRD, AC-08 | component | Detail: Back link with view, cards, Edit link, variants, documents (name, type, size), long and non-ASCII text, axe. | GREEN |
| T-11 | AC-04 | page | REPLACED (was `findOccurrence`): detail pages through `getOccurrence` (see T-04, FD-13). | GREEN |
| T-12 | AC-01..08 | page | Route pages on the real mock contract and on the generated history (`page.test.tsx`, `page.volume.test.tsx`, `[occurrenceKey]/page.test.tsx`, `page.edge.test.tsx`). | GREEN |
| T-13 | PRD | component | Route states: loading skeleton, error with Retry, not-found; failing queries reject. | GREEN (unchanged, plus `page.error.test.tsx` with searchParams) |
| T-14 | PRD | component | Nurse name on one line with title; task link sized to its text. | GREEN (unchanged) |
| T-15 | AC-05 | component | Pager: 'Showing 21-40 of 137', Previous/Next, one current page, 7-slot window for 27 pages, 44px classes, rel prev/next, none for one page, axe. | GREEN |
| T-16 | PRD | unit + component | Document tile and `formatFileSize` / `fileTypeLabel` (92-char name cut with title, non-ASCII, unknown type, 0 bytes). | GREEN (one assertion changed, FD-21) |
| T-18 | PRD | component | Task detail and tile at narrow widths (FD-21): wrapping grid with a 10rem-minimum column, tile `w-full min-w-0` and no fixed width, name `line-clamp-2` + `[overflow-wrap:anywhere]` and no `break-all`/`break-words`, whole name in `title` and DOM (92 characters, with and without spaces, six documents), one-line type and size (`truncate`, `title`), title and 'Assigned to' line `[overflow-wrap:anywhere]`, Status pill wrapper `min-w-0 max-w-full` with full `title`, icon `shrink-0`, 2,000-character description and unbroken 300-character string in full (`whitespace-pre-line`, never clamped), Back and Edit links kept, axe (`document-tile.test.tsx`, `task-detail-view.test.tsx`). | GREEN (jsdom has no layout: the layout itself is proven by the width sweep in PROGRESS.md) |
| T-17 | PRD | component | Local Task log table (FD-20): fixed grid tracks shared by header and rows (no auto, one flexible track), every cell `min-w-0` in its own grid area, container-query breakpoint, title `line-clamp-2` with `overflow-wrap:anywhere` and full `title`, nurse `truncate`, pill wrapper `min-w-0 max-w-full` with full text in `title` and DOM, icon `shrink-0`, one link and one copy of each title per row, headings `sr-only` not `display:none`, explicit table roles, row and link click, axe with 120/60/300-char/non-ASCII data; and in the view: fixed grid, pill cap, wrapping toolbar (`task-log-table.test.tsx`, `task-log-view.test.tsx`). | GREEN (jsdom has no layout: the layout itself is proven by the width sweep in PROGRESS.md) |

**Red-first evidence (Task detail and tile, FD-21).** Commit 6f3d9ac: 9 tests failed (the changed `break-all` assertion, 3 of 4 new tile tests, and 5 of 7 new detail tests: flex-wrap `ul` not a grid, `break-words` not `[overflow-wrap:anywhere]`, pill not `min-w-0 [&>svg]:shrink-0`, no `w-full min-w-0`, no `truncate`); implementation in the next commit. **Red-first evidence (responsive table, FD-20).** Commit 77af56f: `task-log-table.test.tsx` failed to load (no `task-log-table` module) and 3 view tests failed on the old DataTable classes (row not a grid, pill wrapper not `max-w-full`, toolbar not `flex-wrap`); implementation in 573c732. **Red-first evidence (CHG-005).** Commit 50f9fb5 (inherited tests, reviewed): 5 files failed to load (missing `task-log-params`, `pagination`, `load-task-log`, `task-log-pager`, and `taskLogHref` params). Commit a54fbc3 (rewritten tests): 6 files failed to load (those four modules, `task-log-params` from the routes test, and `document-format`) and 74 tests failed (no `searchParams`, pager, redirect, `getOccurrence`, documents, back-link params, search landmark, debounce). Implementation followed in 5f7c754 and ea21964.

### Test files
- `src/features/family-task-log/`: `occurrence-display.test.ts`, `melbourne-time.test.ts`, `task-routes.test.ts`, `task-log-params.test.ts`, `pagination.test.ts`, `load-task-log.test.ts`, `task-log-pager.test.tsx`, `task-log-table.test.tsx`, `task-log-view.test.tsx`; `fake-task-log.ts` is test-support (a `getTaskLog` double for 500+ rows that throws on an invalid page).
- `src/features/family-task-detail/`: `task-detail-view.test.tsx`, `document-tile.test.tsx` (with `document-format`).
- `src/app/(family)/family/[clientId]/tasks/`: `page.test.tsx`, `page.volume.test.tsx`, `page.error.test.tsx`, `states.test.tsx`, `[occurrenceKey]/page.test.tsx`, `[occurrenceKey]/page.edge.test.tsx`, `[occurrenceKey]/states.test.tsx`.

## Regression scope
- Full unit/component suite: `npx vitest run src` (run, green). `npm run verify` is red on a fresh worktree only because `tests/integration/shared-supabase-environment.test.ts` needs Supabase env vars (known baseline, not this feature); the individual verify steps were run instead (see PROGRESS.md).
- `supabase test db`: not run and not applicable. This feature changes no schema, and running the Supabase CLI is out of bounds for this session.
- Playwright e2e: not run. This feature has no e2e AC (TESTING.md §5: only for features with e2e ACs and before checkpoints D10/D12); the pages were driven in headless Chromium against `next dev` instead (see PROGRESS.md).

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha Rahman, Priya) unless a test creates its own fixtures.
- The shared mock fixtures (UI-04) hold Margaret's 137 log rows, the design week, six documents and Robert's 3 rows; tests read them through `src/server/**`. Volume tests use `fake-task-log.ts` (537 and 5,000 generated rows).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
