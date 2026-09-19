# Decisions — FAM-UI-01 Family Home screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status (checked 2026-09-19) | Applied here |
|---|---|---|---|---|
| OQ-29 | Which nurse is shown on an event | no | ANSWERED (PD-055) | Followed. The screen shows the `assignee` and `actor` the contract supplies and derives nothing. See FD-02. |
| OQ-24 | Undesigned empty states | no | OPEN | Proposed default applied (EmptyState primitive, proposed copy). See FD-03. Copy flagged for review. |

## HUMAN REVIEW summary

1. **AC-01 / T-01 wording changed** from "Aisha R." to "Aisha Rahman" (PD-038). FD-01.
2. **Design gaps built from tokens, please review**: Overdue empty card, Today / Recent activity / Budget empty states, loading skeleton, error card wrapper, "Enter event" link. FD-03, FD-05, FD-07.
3. **"Recent activity" is defined here** (five latest done or overdue, newest first) because the PRD does not define it. FD-04.
4. **Kit components differ from the design** in ways this feature cannot change. FD-09.
5. **Local wrapper for a kit gap** (`RecentActivityRow`). FD-06.
6. **The app's mock fixtures did not contain the design's Home data.** FD-08. (Update 2026-09-20: UI-04 added the design week; on mock data the Overdue badge reads 2, by the human's decision, FD-19.)
7. **Rework for real-world volumes (2026-09-20), design calls to review**: Today timeline stacks overlapping events and grows the page instead of scrolling (FD-14); Overdue card shows the five newest overdue, oldest first, with "View all N overdue" (FD-16); titles wrap to two lines and the carer name truncates on one (FD-15); hour labels use the secondary text token, not the design's pale teal, for contrast (FD-14); Budget tile writes an overspend as "over budget" and adds a status word for screen readers (FD-17); columns stack below 1280px (FD-18).
8. **Test expectations changed** (register in FD-21): AC-01 test (hover card to at-rest link), the two chevron tests (button + `router.push` to link `href`), the contract-call assertion, the `answerTaskLog` helper.
9. **PR order**: this branch contains UI-04's commits until UI-04 merges (FD-20).

## Feature decisions log

### FD-01 — Done pill shows the full actor name, not "Aisha R." (PD-038)
- Date: 2026-09-19
- Context: AC-01 and T-01 were drafted against the design's "Done · Aisha R.". Root DECISIONS.md PD-038 (answering OQ-13, CONFIRMED 2026-09-17) says staff names are displayed in full everywhere and supersedes the "Aisha R." abbreviation. `shared-domain-contracts-fixtures` FD-01 and `shared-ui-primitives` FD-02 already applied this to their own ACs.
- Decision: the screen shows `StatusPill`'s `Done · <actor as supplied>`, so the test fixture's actor "Aisha Rahman" reads "Done · Aisha Rahman". AC-01 and T-01 text updated to match (`Aisha R.` to `Aisha Rahman`).
- Reason: implementing the stale abbreviation would contradict a confirmed decision (CLAUDE.md §9 allows recording an answered decision in a controlled doc).
- Alternatives considered: abbreviate to "Aisha R." in this screen only (rejected, contradicts PD-038 and would be a second name-display pattern).
- Consequences: the full name is wider than the design assumed. In the 340px Recent activity column a Done row's title is cut short ("Morning medic…", "Evening medic…"); the design's "Aisha R." fits "Morning medication" whole. This is a design-level consequence of PD-038, not a defect in the code, and the design owner needs to decide (for example allow the title to wrap to two lines, or shorten the pill). Left as truncation, which is how the kit's row behaves everywhere else.
- Human confirmation required: **yes. HUMAN REVIEW: test expectation changed** (AC-01 / T-01 assertion, recorded requirement change, PD-038).
- Test changes caused: T-01 (`[FAM-UI-01][AC-01]`) was written with the full name from the start; the change is to the AC and plan text (before: `Done · Aisha R.`, after: `Done · Aisha Rahman`). No existing test was edited.

### FD-02 — OQ-29 (ANSWERED, PD-055) followed: the screen displays, it does not derive
- Date: 2026-09-19
- Context: PD-055 says the assignee is derived from the covering shift and the actor is shown once Done.
- Decision: the screen shows whatever `assignee` / `actor` the contract returns. A Done row always names its actor (REQ-19); if a Done occurrence arrives without an actor the pill reads "Done · —" rather than "Done · undefined".
- Consequences: PD-055's "—" for an event with no covering shift is not shown on a Today block, because the shared `DayTimeline` omits the assignee line when there is none (kit behaviour, see FD-09).
- Human confirmation required: no.

### FD-03 — OQ-24 (OPEN, non-blocking): proposed default applied for the empty states, copy flagged for review
- Date: 2026-09-19
- Context: OQ-24 is OPEN. Its proposed default is "use the EmptyState primitive with proposed copy flagged for review". AC-05 fixes only the Overdue copy ("All caught up").
- Decision: each panel uses the kit `EmptyState`:
  - Overdue (AC-05): title "All caught up", body "Nothing is overdue right now." Shown in a neutral card headed "Overdue" (no alert tone, no badge, since nothing is overdue). **Design gap, built from tokens, please review.**
  - Today: "No care events today" / "Events scheduled for today will appear here." (proposed copy)
  - Recent activity: "No recent activity" / "Completed and overdue events will appear here." (proposed copy). "View all" stays.
  - Budget: "No funding set up yet" / "Funding buckets will appear here once they are set up." (proposed copy, the UI-Q17 case). The aggregate line and cards are replaced by the empty state; "View breakdown" stays. No "$0 remaining of $0" is ever shown.
- Human confirmation required: yes (the OQ stays OPEN; this only records the default used).

### FD-04 — Data composition from the existing contract functions, and what "Recent activity" means
- Date: 2026-09-19
- Context: no new contract function is needed. The PRD does not define "Recent activity" or the Overdue ordering.
- Decision:
  - Today: `getTodayOccurrences(clientId)`.
  - Overdue: `getTaskLog(clientId, { status: "overdue" })`, listed oldest first (as the design), badge = the result's `total`. All rows the contract returns are listed (no cap, so an overdue item is never hidden; the design has no "view all overdue" control). If `total` exceeds the page size the badge will exceed the rows shown; that case is undesigned.
  - Recent activity: `getTaskLog(clientId)` page 1, planned occurrences removed (they have not happened; the design lists only Done and Overdue), newest first, the top five. **Assumption, please review.**
  - Budget: `getBudgetSummary(clientId)`; the aggregate line sums the buckets ("$17,870 remaining of $32,000 · 44% used", percent from the sums, not an average of bucket percents).
  - All four load together in `Promise.all`, so there is one loading state and one error state.
- Human confirmation required: yes for the Recent activity definition.

### FD-05 — "Enter event" is a link styled as the primary button (kit gap)
- Date: 2026-09-19
- Context: the kit `Button` renders a `<button>`, has no `asChild`/link variant, and does not export `buttonVariants`. A `<button>` cannot wrap a link (nested interactive content).
- Decision: a `next/link` `<a>` with the primary button's classes, 52px tall and 15px medium text. Both measured from the design image (340x52 at the right column; "Enter event" text width 78.5px equals 15px/500 in IBM Plex Sans).
- Kit request (shared PR): export `buttonVariants` or add a link/`asChild` form to `Button`, then replace `EnterEventLink`'s class string.
- Human confirmation required: no (request recorded).

### FD-06 — `RecentActivityRow`: local copy of the kit's `ActivityRow` with the status pill capped at 55%
- Date: 2026-09-19
- Context: found in the browser check. `ActivityRow` renders `StatusPill` as `shrink-0` with no way to size it. A long carer name ("Done · Aisha Rahman-Featherstonehaugh") fills the row: the title collapses to a sliver, the date wraps to fragments and the chevron spills out of the card. That breaks the PRD edge case "very long names/text wrap or truncate without breaking layout".
- Decision (CLAUDE.md §4.2, local wrapper): `src/features/family-home/recent-activity-row.tsx`, identical markup and classes to `ActivityRow` plus `max-w-[55%]` on the pill, so the pill's own text truncates. Used for the Recent activity card only. The Overdue card keeps the kit's `AlertListCard`/`ActivityRow` (its pill carries no name, so it cannot overflow).
- Kit request (shared PR): let `ActivityRow` cap or truncate its pill. Then delete the wrapper and use `ActivityRow` again. Until then the two can drift.
- Test note: jsdom cannot measure layout, so there is no automated test for this; it was checked in a browser (long-text screenshot: row height unchanged at 53px, chevron inside the card).
- Human confirmation required: no (request recorded).

### FD-07 — Error, loading and logging follow ARCHITECTURE.md §12.5
- Date: 2026-09-19
- Context: AC-06 needs "Something went wrong" with Retry when a contract query rejects. ARCHITECTURE.md §12.5: unexpected failures are caught at the boundary, logged with a feature tag (and request id), generic message to the user, never PII.
- Decision:
  - `page.tsx` catches a rejection from the loader and renders `HomeErrorState` (the kit `ErrorState` in a card). Retry calls `router.refresh()`, which re-renders the route and re-runs the queries.
  - It logs `[family-home] could not load home data:` plus the error's class name only. The message is left out because Phase 3 data-layer errors may carry client data (tested: a message containing a client's name is not logged). No request id is logged: there is no request-id or logger utility in the repo yet.
  - `loading.tsx` renders `HomeSkeleton` (the screen's own shape built from the kit's `ListRowSkeleton` / `CardGridSkeleton`). Design gap, built from tokens, please review.
  - No `error.tsx` is added. ARCHITECTURE.md §12.5 prescribes one per route group; that is a group-level file shared by every Family screen and outside this feature's PRD, so it is left to whoever owns the Family shell. Next.js 16.3 note for whoever adds it: `error.js` receives a `retry` prop (stable since v16.3.0; `reset` is now the secondary option), per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`. ARCHITECTURE.md does not contradict this.
- Human confirmation required: no.

### FD-08 — Tests use test-local fixtures; the app's mock fixtures do not contain the design's Home data
- Date: 2026-09-19
- Context: AC-01 to AC-03 say "Given fixtures". `src/mocks/fixtures.ts` (UI-00, shared, not editable here, and not importable from `src/features` or its tests by the lint rule) does not carry the design's Home dataset. Margaret's mock data has today's Morning medication (done), Collect prescription (overdue, 11:00, 20 min) and Afternoon walk (14:00, 45 min); one overdue item (Collect prescription); two Recent activity rows; header "75 years · Ringwood" (design: "78 years · Preston VIC"). Only the budget figures match the design exactly ($14,880 / $2,750 / $240; $17,870 of $32,000; 44%).
- Decision: the tests replace the `src/server/**` contract functions (`vi.mock`) with fixtures that mirror the design (Morning medication done 09:00 1 hr; Physiotherapy planned 11:30 1 hr 30 min; Afternoon check-in planned 15:00 1 hr; overdue Wound dressing check Fri 27, Medication review Sat 28, Weekly weigh-in Sun 29; five Recent activity rows), as TEST_PLAN "Test data" allows ("unless a test creates its own fixtures").
- Consequences: AC-01 to AC-03 are proven against design-matching data, but the running app on `DATA_SOURCE=mock` shows the differences above. If a design-matching demo is wanted, the UI-00 fixtures need a follow-up in the shared lane. Not done here.
- Human confirmation required: yes (fixture follow-up is the owner's call).

### FD-09 — Where the shared kit differs from the design (browser check, not fixable in this lane)
- Date: 2026-09-19
- Context: compared a 1440x1024 (1.5x) render with `family-01-home.png`, with the design's data. Geometry this feature owns matches within about 1px: page padding, 340px right column, Enter event 340x52, card positions, the timeline's 07:00 gridline, block positions (09:00, 11:30 to 13:00, 15:00), type sizes (caption 13px, aggregate line 13px, links 14px, verified by measuring text widths in the real font).
- Differences that come from kit components (record only; each needs a shared PR):
  1. `DayTimeline` blocks (AC-01 caveat). The design shows one row per block: title, assignee and duration on the left, the status pill ("Done · Aisha R." / "Planned") on the right, with only a left accent bar. The kit shows title plus time range on two lines inside a full border, and status as a small icon with a hidden word. The visible pill, assignee and "1 hr 30 min" appear only in the hover/focus card at these block heights (the `full` tier needs 75px; a 1 hr block is 44px, 1.5 hr is 66px). AC-01 is met against what the kit exposes (block status word plus card content), but the visible block does not match the design.
  2. Hour labels: design left-aligned, muted teal (dark on hours that start an event), gridlines full width; kit right-aligned in a 56px gutter, grey, gridlines start after the gutter.
  3. `TimeGridScroller` cuts the bottom "18:00" label in half (its viewport adds the label bleed at the top only).
  4. `BudgetBucketCard` label is upper-cased ("GOVERNMENT"), the design reads "Government"; the kit card is 114px, the design's 123px (about 9px more above the progress bar).
  5. `ActivityRow` rows are 53px (52px plus a 1px border), the design's 52px, so the Overdue (3 rows) and Recent (5 rows) cards come out about 6px and 8px taller.
  6. The design's Today card is 667px tall with about 125px blank under 18:00. Here its height comes from its content (564px alone; it stretches to the right column, 656px with the design's data). It is not hard-coded to the frame height. The Budget strip therefore starts about 13px higher than the design.
  7. `formatShortDate` renders September as "Sept" (en-AU): the caption reads "Sat 19 Sept · day view" in September. The design only shows "Nov".
  8. `ActivityRow` navigates through a button plus `router.push`, so the chevron rows are buttons, not links (no open-in-new-tab). A kit `href` option would fix that.
- Human confirmation required: yes (raise the shared PRs).

### FD-10 — The caption and header show the real date; the mock fixtures are pinned to Mon 30 Nov 2026
- Date: 2026-09-19
- Context: the Today caption is `formatShortDate(new Date())` on the server, the same clock the layout's header uses. The mock contract's "today" is `REFERENCE_DATE` (30 Nov 2026).
- Decision: keep the real clock, which is correct once real data is wired. In development the caption and header read the real date while the timeline shows 30 Nov data. A test pins the clock and asserts "Mon 30 Nov · day view".
- Human confirmation required: no.

### FD-11 — Task detail link contract with FAM-UI-07
- Date: 2026-09-19
- Context: the Home chevrons open task detail at `/family/[clientId]/tasks/[occurrenceKey]` (ARCHITECTURE.md §3.1). `/tasks` and `/tasks/[occurrenceKey]` are built by FAM-UI-07 in a separate worktree and are not on this branch, so the links lead to a 404 until both are merged into `family-dev`.
- Decision: the key is `${eventId}:${originalStartISO}` (contains `:` and `+`), so it is sent through `encodeURIComponent`. FAM-UI-07's page must decode the `occurrenceKey` param. Route strings live in `src/features/family-home/home-routes.ts`.
- Human confirmation required: no. Flag to the FAM-UI-07 owner.

### FD-12 — Shared-lane follow-ups noticed
- Date: 2026-09-19
- `src/app/dev-preview-calendar-kit/` says (shared-calendar-kit FD-08) it should be deleted once a real screen renders the calendar kit against `src/server/**` data, naming "the Family Home calendar" as an expected trigger. This screen is the first to render `DayTimeline` that way, but the route also previews `WeekGrid` and `MonthGrid`, so its owner decides. Not touched here.
- `src/app/(family)/family/[clientId]/layout.tsx`: no change was needed or made.
- Human confirmation required: no.

### FD-13 — Local formatters: three-letter dates and cent-accurate dollars (2026-09-20)
- Date: 2026-09-20
- Context: FD-09 item 7 ("Sept") and the requirement that a $1,234,567.89 amount reads correctly. `formatShortDate` (src/lib) writes September as "Sept"; `formatMoney` (src/lib) rounds to whole dollars, so `$1,234,567.89` reads `$1,234,568`. `src/lib` is not this lane's.
- Decision: `src/features/family-home/home-format.ts`: `shortDate` (Melbourne time, weekday and month cut to three letters from a fixed month table) and `formatDollars` (whole cents, "$14,880" when there are no cents, "$1,234,567.89" when there are, "-$360", never "-$0"). Used by the caption, the cards, the budget line and the bucket tiles.
- Kit request (shared PR): fix `formatShortDate` "Sept" and let `formatMoney` keep cents; then delete `home-format.ts`.
- Human confirmation required: no (request recorded).

### FD-14 — Today timeline: a local component that shows everything at rest, and stacks a crowded day (2026-09-20)
- Date: 2026-09-20
- Context: FD-09 items 1 to 3. The shared `DayTimeline` shows the status pill, assignee and duration only on a hover card at these heights (nothing for keyboard or touch), lays hour labels out differently from the design, and its scroller cuts the "18:00" label in half. The human's requirement: a real person will use the screen with whatever data builds up, so 30+ occurrences in a day (some overlapping) must not break it.
- Decision: `today-layout.ts` (pure) and `today-timeline.tsx`. One full-width row per occurrence on the design's 44px-per-hour scale: title, assignee ("—" and "No carer assigned" for a screen reader when no shift covers it, PD-055), duration and status pill, all visible at rest; the whole row is a link to task detail (keyboard: Tab follows time order). Hours 07:00 to 18:00 by default, reaching earlier or later for early and late events, so nothing hides below a fold. A block is at least 36px tall. **Overlaps are stacked, not put side by side and not scrolled**: when two blocks would touch, the later one goes below the earlier one, full width, and the hours after it move down with it; on an ordinary day nothing is stretched and positions equal the design's. A 32-occurrence day makes the card about 1,300px tall and the page scrolls; there is no scroll box inside the card (nothing hidden, no scroll-in-scroll for keyboard users). The current-time line follows the stretched scale.
- Design calls flagged for human review: (a) stacking and page growth, chosen over a fixed-height scroll box; (b) hour labels use `text-text-secondary` (dark on hours in which an event starts) instead of the design's pale teal, which is about 2.2:1 on white against REQ-N2's 4.5:1; (c) status is the pill's word and icon; the accent bar colour is only decoration.
- Consequence: on a crowded day the Budget strip is a long way below the fold.
- Human confirmation required: yes (a) and (b).
- Test changes caused: `[FAM-UI-01][AC-01]` (see FD-21).

### FD-15 — Card rows are links; long titles wrap to two lines, long names truncate (PD-038 call) (2026-09-20)
- Date: 2026-09-20
- Context: FD-01 (full names are wider than the design assumed), FD-06 (kit `ActivityRow` pill), FD-09 item 5 and 8 (rows are buttons calling `router.push`). The mock data has a 102-character title and a 51-character carer name; real data can have 120 and 60.
- Decision (design call flagged for human review): `activity-link-row.tsx` replaces `recent-activity-row.tsx` and the kit's `AlertListCard` rows. The row is one `<a>` to task detail (open in new tab works; the accessible name holds title, date, status and carer). The title wraps to at most two lines and then ends in an ellipsis (`line-clamp-2`, full title in `title`). The status pill is never squeezed (`shrink-0`, capped at 55% of the row); a long carer name ends in an ellipsis inside it on one line, full "Done · name" in `title`. The Overdue card is built here from the kit's `CardShell`, `CountBadge` and `Icon` in the kit `AlertListCard`'s layout. Both cards are now server components (no router).
- Kit request: let `ActivityRow` take an `href`, wrap the title and cap its pill; then delete the local row and card.
- Human confirmation required: yes (the two-line title and one-line name rule).
- Test changes caused: the two chevron tests (see FD-21).

### FD-16 — Home reads any log size correctly; the Overdue card shows a count, a few rows and a link to all (2026-09-20)
- Date: 2026-09-20
- Context: the first Home read `getTaskLog(clientId)` page one and took the newest done or overdue rows from it. `getTaskLog` is newest first and 20 to a page (UI-04), so a client whose newest 20 rows are planned, or whose history is long, would get an empty or wrong Recent activity. FD-04's Overdue card also listed every row the page returned, so "40" could sit over a truncated list with no way to the rest. Supersedes FD-04's data composition.
- Decision: `loadFamilyHomeData` asks the contract for `{ status: "done" }` and `{ status: "overdue" }` page one (never the unfiltered log, never planned). Recent activity is the newest five of the union (each list is newest first, so the top five of the union lies within the two top fives; the proof is in `home-data.ts`), each occurrence once, ties by key ascending like the contract. The Overdue card shows the contract's `total` (never the number of rows fetched) and the newest `OVERDUE_ROWS_SHOWN` (5) rows in date order, oldest first as the design draws them; when `total` exceeds the rows shown it offers "View all N overdue" to `/family/<id>/tasks?status=overdue`. A test pins `TASK_LOG_PAGE_SIZE` >= the rows taken from a page.
- Design call flagged for human review: with more than five overdue the card lists the five most recent (in date order), not the five oldest. Fetching the oldest needs the last page (up to three calls); the count and "View all" keep the whole list one click away.
- Human confirmation required: yes (which five).
- Test changes caused: the contract-call assertion and the `answerTaskLog` helper (FD-21).

### FD-17 — Budget tile: a local card for cents, long names, overspend and screen readers (2026-09-20)
- Date: 2026-09-20
- Context: FD-09 item 4 (upper-cased label) and volume cases: 0, 1, 3 and 8 buckets, $1,234,567.89, a zero-dollar budget, an over-100% bucket, 60-character names.
- Decision: `budget-bucket-tile.tsx` in the kit `BudgetBucketCard`'s design with: the name as written (`normal-case`, two lines then an ellipsis, `title` holds it all), cents kept (FD-13), an amount too wide for its card wraps instead of losing digits, a status word for a screen reader beside the icon ("Budget warning", "Budget alert", "Budget exhausted"; the icon stays `aria-hidden`), "over budget" written out when `remaining` is negative and the remaining amount shown as "-$360" (the bar is capped at 100%), no division by zero anywhere. Cards flow into as many columns as fit (`auto-fit`, 15rem minimum: three side by side at the design's width, eight buckets make three rows). Keys are `index:kind:label`, because a client can hold several buckets of one kind. The aggregate line reads "$360 over budget of $3,000 · 112% used" when the sum is overspent.
- Kit request: `BudgetBucketCard` to keep cents, stop upper-casing and give the icon a name; then delete the tile.
- Human confirmation required: no (request recorded).

### FD-18 — Breakpoints and stacking (2026-09-20, human addendum: nothing overlaps at any width)
- Date: 2026-09-20
- Context: the Task log sibling screen overlapped below about 1100px because one long value widened a column. Required: clean from 1920 to 1024, graceful (no overlap, no page scroll) to 768, information only at 640 and 375.
- Decision (design call flagged for human review): the design's two columns (Today, 340px column) need about 1280px. From 1280px: as designed (`xl`). Below: one column in this order: Enter event, Today, Overdue, Recent activity, Budget; from 1024px (`lg`) Overdue and Recent activity sit side by side (a first attempt at 768px put them in 308px cards, where a normal word, "Physiotherapy", broke mid-word). Every grid item is `min-w-0`; the Today rows, card rows, pills, tiles and header lines are all cut with an ellipsis (full text in `title`) or wrap, never widen. The Budget cards use `auto-fit` columns. The shared header, rail and layout are not this feature's and were only observed in the sweep.
- Verified in a real browser (PROGRESS.md, width sweep table).
- Human confirmation required: yes (the 1280px and 1024px breakpoints and the stacking order).

### FD-19 — Human answers of 2026-09-20 (ANSWERED)
- Date: 2026-09-20
- UI-04 FD-04 (the Home design shows 3 overdue items, the Task log design shows 2; UI-04 chose 2). The human answered: "Doesn't matter". Applied: the fixtures and `src/mocks` are untouched; on mock data Home's Overdue badge reads 2; the badge always comes from the contract's `total`; AC-02's 3 is proven at component level with a three-item stub (`[FAM-UI-01][AC-02]` in `family-home.test.tsx` and `activity-cards.test.tsx`). AC-02's wording is not changed (see the note in ACCEPTANCE_CRITERIA.md).
- UI-04 FD-05 (order of rows within a day). The human answered: "Based off time they were created in calendar". Read as: order strictly by the time the task holds on the calendar (its start instant). Nothing changes in the contract (newest first by start instant, ties by key). Home's Today panel is a day timeline and stays oldest first, as `getTodayOccurrences` returns it; the design's drawn within-day order is not followed.
- Human confirmation required: no (answered).

### FD-20 — Dependency on UI-04 and PR order (2026-09-20)
- Date: 2026-09-20
- Context: this branch merged `origin/feature/shared-screen-contracts-fixtures` (UI-04, commit 22f84e9): newest-first `getTaskLog` with filters and paging, Melbourne-day `getTodayOccurrences`, the design week and 137-row history in the mock fixtures.
- Decision: PR order is UI-04 to `main`, then sync `main` into `family-dev`, then this PR. Until UI-04 merges, this branch's diff includes UI-04's commits.
- Human confirmation required: no.

### FD-21 — Register of existing tests whose expectation changed (2026-09-20)
**HUMAN REVIEW: test expectation changed.** Nothing was skipped, `.only` or deleted; each row is a rewrite in `src/features/family-home/family-home.test.tsx`.
| Test | Before | After | Reason |
|---|---|---|---|
| `[FAM-UI-01][AC-01]` Today panel shows Morning medication ... | Found each block as a `button`, read only its status word, hovered it and read the pill, assignee and "1 hr 30 min" from the hover card (`tooltip`). | Finds each block as a `link` and reads title, pill ("Done · Aisha Rahman", "Planned"), and duration ("1 hr", "1 hr 30 min") on the block itself; asserts no `tooltip` is needed. | FD-14: the local timeline shows everything at rest as the design does; the AC text is unchanged. |
| `[FAM-UI-01][Scope] a Recent activity chevron opens that occurrence's task detail` (renamed "a Recent activity row is a link to ...") | Clicked a `button` and expected `router.push(url)`. | Expects a `link` with `href` = the encoded task-detail URL. | FD-15: rows are links (open in a new tab). Same URL is asserted. |
| `[FAM-UI-01][Scope] an Overdue row chevron opens ...` (renamed "an Overdue row is a link to ...") | Same, for the Overdue row. | Same, `link` and `href`. | FD-15. |
| `[FAM-UI-01][Scope] reads every panel through the contract for the route's client` | Expected `getTaskLog(CLIENT_ID)` (unfiltered) and `(CLIENT_ID, { status: "overdue" })`. | Expects `(CLIENT_ID, { status: "done" })` and `(CLIENT_ID, { status: "overdue" })`; the unfiltered call is gone. | FD-16: the unfiltered first page is wrong for a long or future-heavy log. |
| helper `answerTaskLog` | Answered any non-overdue query with the whole test log. | Answers `status: "done"` with the done rows, as the contract does. | FD-16, keeps the fixture honest to the contract. No assertion changed. |
New test files (not changes): `home-format.test.ts`, `today-layout.test.ts`, `today-timeline.test.tsx`, `home-loader.test.ts`, `activity-cards.test.tsx`, `budget-strip.test.tsx`, `responsive-layout.test.tsx`, `test-support.ts` (builders).

### Updates to earlier entries (2026-09-20)
- FD-01: the truncation consequence is now resolved by FD-15 (two-line titles, one-line names).
- FD-04: data composition superseded by FD-16 (per-status page one; Overdue count and "View all").
- FD-05 (Enter event link): **cannot be fixed locally beyond what exists.** The kit `Button` renders a `<button>` and does not export `buttonVariants`, so the local `<a>` cannot borrow its variants and repeats the primary button's classes. Needs a kit change (export `buttonVariants` or add an `href`/`asChild` form). Request stands.
- FD-06: superseded by FD-15 (`RecentActivityRow` is replaced by `ActivityLinkRow`).
- FD-08: fixtures now carry the design week (UI-04); the tests still use test-local fixtures and mocked contracts so they can build any volume.
- FD-09 item by item: (1) fixed, FD-14. (2) hour labels left-aligned with full-width gridlines as designed; colour deliberately not the design's (FD-14b). (3) fixed, FD-14 (no scroller). (4) label case fixed, FD-17; the kit card's 114px against the design's 123px was not chased: the tile's height now depends on its content by design. (5) not changed: rows are 53px like the kit's (1px border) and now vary with wrapped titles. (6) unchanged: the card's height comes from its content. (7) fixed, FD-13. (8) fixed, FD-15.

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
