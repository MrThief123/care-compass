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
6. **The app's mock fixtures do not contain the design's Home data.** FD-08.

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
