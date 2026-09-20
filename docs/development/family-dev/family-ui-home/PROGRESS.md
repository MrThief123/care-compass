# Progress — FAM-UI-01 Family Home screen (UI)

Status: READY FOR PR (PR not opened: waiting for explicit human approval)
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D4
Branch: `feature/family-ui-home` (created from `origin/family-dev`)
PR target: `family-dev`
Last updated: 2026-09-20 (rework for real-world volumes and widths, END SESSION)

## Blockers
- None. Dependencies: this branch contains UI-04 (`feature/shared-screen-contracts-fixtures`, unmerged) and the shared shell fix (`fix/shared-app-shell-nav-header`, unmerged; FD-22). PR order: UI-04 to `main`, the shell fix to `main`, sync `main` into `family-dev`, then this PR (DECISIONS.md FD-20, FD-22).

## Dependencies status
- F0-15, UI-01, UI-03 merged to `family-dev`. UI-04 merged into this branch (commit a4a7d4e); not yet on `main`.

## Human decisions received 2026-09-20 (ANSWERED, DECISIONS.md FD-19)
- UI-04 FD-04, Overdue 3 (Home design) or 2 (Task log design): "Doesn't matter". Fixtures and `src/mocks` untouched; on mock data the Overdue badge reads 2; the badge always follows the contract's `total`; AC-02's 3 is proven with a three-item stub.
- UI-04 FD-05, order within a day: "Based off time they were created in calendar". Read as start instant; contract unchanged; Home's Today panel stays oldest first.

## Completed
- Original Home (route, right column, Budget strip, loading, empty and error states) as before.
- Rework this session, each tested and committed:
  1. Today timeline shows pill, assignee and duration at rest (`today-layout.ts`, `today-timeline.tsx`); stacks overlaps, grows for a crowded day (FD-14).
  2. Recent activity right for any log size: page one of `done` and of `overdue`, merged (FD-16).
  3. Overdue card: contract `total` badge, five rows, "View all N overdue" to `?status=overdue` (FD-16).
  4. Titles wrap to two lines, carer names truncate on one, pills never squeezed; rows are links (FD-15).
  5. Budget strip: local tile, cents, any bucket count, long names, zero total, over 100% (FD-17).
  6. Kit differences: "Sept" and cents (FD-13), hour labels and clipped 18:00 (FD-14), uppercase bucket labels (FD-17), ActivityRow pill cap and button-rows (FD-15). Button link form cannot be fixed locally (FD-05 update).
  7. Responsive: nothing overlaps at any width from 1920 to 640; columns stack under 1280px (FD-18).

## In progress
- None.

## Remaining
- Human review of DECISIONS.md "HUMAN REVIEW summary", then explicit approval to open the PR.
- PR must attach a side-by-side screenshot of the render and `docs/design/screens/family-01-home.png` (PRD UI/UX Requirements). Screenshots are not committed; regenerate (dev server on a spare port with inline dummy Supabase env, headless screenshot at 1440x1024).

## Acceptance criteria status
- 6 / 6 MET. AC text unchanged; on mock fixtures AC-02's badge reads 2 by the human's decision (ACCEPTANCE_CRITERIA.md note).

| AC | Status | Proving tests |
|---|---|---|
| AC-01 | MET | `[FAM-UI-01][AC-01]` in `family-home.test.tsx` (rewritten, HUMAN REVIEW: test expectation changed) and `today-timeline.test.tsx`: pill, assignee and duration are on the block at rest, no tooltip |
| AC-02 | MET (3 by stub, 2 on mock data) | `family-home.test.tsx` (three-item stub, badge 3, oldest first); `activity-cards.test.tsx` (badge = contract total: 3, 2, 40) |
| AC-03 | MET | `family-home.test.tsx` line; `budget-strip.test.tsx` ($1,234,567.89, zero total, over 100%, 0/1/3/8 buckets) |
| AC-04 | MET | `family-home.test.tsx`, `activity-cards.test.tsx` |
| AC-05 | MET | `family-home.test.tsx`, `activity-cards.test.tsx` |
| AC-06 | MET | `family-home.test.tsx` x3 plus logging test; `home-loader.test.ts` (done and overdue calls) |

## Tests
- Red first, this session (commit a29df9f, tests plus three empty stub modules so failures are on behaviour, not imports): `home-format.test.ts` 9 of 9 failed; `today-layout.test.ts` 21 of 23 failed (2 constant checks pass); `today-timeline.test.tsx` 14 of 15 failed (the axe test passes on an empty render); `home-loader.test.ts` 5 of 14 failed (9 already true of the old loader, incl. the tie-break test, whose mock contract sorted the ties itself); `budget-strip.test.tsx` 7 of 14 failed; `activity-cards.test.tsx` 8 of 17 failed (rows are router buttons today; the file ran with `next/navigation` mocked, a line removed with the implementation, else all 17 failed on the missing router). 64 failed of 92. `responsive-layout.test.tsx` (6) was written with the layout change; against the previous view 2 of 6 fail (grid classes), the other 4 cover components fixed in earlier commits.
- **HUMAN REVIEW: test expectation changed** (full before/after in DECISIONS.md FD-21): `[FAM-UI-01][AC-01]` (hover card to at-rest link), two chevron tests (button + `router.push` to link `href`), the `getTaskLog` call assertion (unfiltered call replaced by `{ status: "done" }`), and the `answerTaskLog` helper. Nothing skipped, `.only` or deleted.
- Now: `src/features/family-home` 9 files / 130 tests pass.
- `npx vitest run src`: 65 files / 544 tests pass. Plain `npx vitest run`: 68 files pass, 1 fails (`tests/integration/shared-supabase-environment.test.ts`, the known baseline: throws at import, missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY); 550 tests pass. No flakes seen this run.
- `npm run lint`: 0 errors, 23 warnings (the same 23 as before; none in this feature). `npm run typecheck`: clean. `npm run format:check`: clean.
- Not run: `supabase` CLI, Playwright e2e (no Family e2e specs exist).

## Browser width sweep (real Chromium via the project's Playwright, 2026-09-20)
Routes: `/family/client-margaret/home?as=family` (mock data) and a throwaway preview (deleted) with the long fixtures: 33 Today rows (32 overlapping-day rows plus a 120-character title with a 60-character name), Overdue total 40, Recent activity with the 102-character title and 51-character carer name, a 120/60 pair and non-ASCII text, 8 buckets (60-character and unbroken names, $999,999,999,999.99, $0 total, one over 100%). Checks per width: document horizontal scroll (scrollWidth > innerWidth); an element whose box crosses its visible-overflow parent; overlapping sibling boxes (not counting `aria-hidden` decoration); text spilling out of a visible-overflow element (text clipped by `truncate` not counted).

| Width | Page h-scroll | Crossing | Sibling overlap | Text spill | Layout (grid columns) |
|---|---|---|---|---|---|
| 1920 | no | 0 | 0 | 0 | 1428 + 340 |
| 1440 | no | 0 | 0 | 0 | 948 + 340 |
| 1280 | no | 0 | 0 | 0 | 788 + 340 |
| 1024 | no | 0 | 0 | 0 | one column; Overdue and Recent side by side (436 + 436) |
| 900 | no | 0 | 0 | 0 | one column (764) |
| 768 | no | 0 | 0 | 0 | one column (632) |
| 640 (information) | no | 0 | 0 | 0 | one column (504) |
| 375 (information) | yes, 432 | 0 | 0 | 2 mock, 18 volume | one column (239) |
- 1920 to 640: clean on both routes. Zero console errors.
- 375 (below the 768 requirement): the page scroll comes from the shared header (date and user chip, 180px wide, right edge at 432), not from Home. Home's own content: the Today rows' fixed parts (duration, pill) are wider than a 135px row, so the pill label spills out of its pill; the row is clipped, nothing paints over a neighbour.
- Long text in the 340px column at 1440 (measured): a 102 or 120-character title is clamped to two lines (title 40px, row 73px against 53px for short rows); the pill stays 26 to 28px tall and no wider than 168px (55% cap), inside its row, with the full name in its `title`.
- Viewed in screenshots at 1440 (mock), 1024 (volume), 768 (mock): matches the design's structure; the crowded 1024 view shows stacked rows, ellipses, "View all 40 overdue", the "-$400 · 108% used · over budget" tile and eight buckets in three rows.
- Update after merging the shell fix (FD-22): the header no longer adds page scroll at 375. Re-swept 1920, 1440, 1280, 1024, 900, 768, 640, 480, 375 and 320 on `/family/client-margaret/home?as=family`: page scroll 0, text overlaps 0 and boxes crossing their container 0 at every width except 320px, where the Budget "View breakdown" link overshoots its row's inner box by 5px but stays inside the card (screenshot; it fits from 338px). No console errors.
- A first 768px two-column setting for the cards broke "Physiotherapy" mid-word in a 308px card; the breakpoint moved to 1024px (FD-18).

## Files changed (this session)
- `src/features/family-home/`: new `home-format.ts`, `today-layout.ts`, `today-timeline.tsx`, `activity-link-row.tsx` (replaces `recent-activity-row.tsx`), `budget-bucket-tile.tsx`, `test-support.ts` (test builders) and tests `home-format`, `today-layout`, `today-timeline`, `home-loader`, `activity-cards`, `budget-strip`, `responsive-layout`; changed `home-data.ts`, `home-routes.ts`, `family-home-view.tsx`, `today-panel.tsx`, `overdue-card.tsx`, `recent-activity-card.tsx`, `budget-strip.tsx`, `family-home.test.tsx`.
- Feature docs. Nothing in `src/server`, `src/mocks`, `src/types`, `src/lib`, `src/components/{ui,shared}` or the family `layout.tsx`.

## Decisions
- DECISIONS.md FD-13 to FD-22 (FD-22: the shared shell fix merged in; FD-13 to FD-21 the rework session) and updates to FD-01, 04, 05, 06, 08, 09. OQ-29 ANSWERED followed; OQ-24 OPEN, proposed default applied; no blocking OQ.

## Problems encountered
- The previous agent was killed by an account usage limit with nothing committed; its draft tests were reviewed, made red for the right reason (stubs), and kept.
- The `next dev` server on port 3101 was stopped; the throwaway preview route was deleted before any commit; no screenshots or scripts committed.

## Assumptions
- Recent activity = the five latest done or overdue occurrences (FD-16). Empty-state copy other than "All caught up" is proposed copy under OQ-24 (OPEN).

## Next action
- Human reviews DECISIONS.md "HUMAN REVIEW summary" and approves. On approval (and once UI-04 and the shell fix are on `main` and synced into `family-dev`, FD-22): mark `PR OPEN`, commit, push, open the PR to `family-dev` titled `FAM-UI-01 Family Home screen (UI)` with the side-by-side screenshot, after UI-04 has merged (or noting that UI-04's commits are in the diff).

## Ready for PR
- Yes, pending explicit human approval. The PR has not been opened.
