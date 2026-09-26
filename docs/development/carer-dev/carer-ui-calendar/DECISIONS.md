# Decisions — CAR-UI-03 Carer Calendar screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-33 | Carer calendar and task semantics | no | ANSWERED (PD-043), amended by CHG-025: blocks are shifts, no checklist. |

## Feature decisions log

### FD-01 — Apply CHG-025 and CHG-030 to this feature
- Date: 2026-09-26
- Context: The planned AC-01/AC-02 were built on event blocks and a selected-shift checklist, which CHG-025 removed. The screen needs a week or month of shifts, and the contract only had today's.
- Decision: Blocks are the carer's shifts (client first name, time range); no Tasks panel. Add `getCarerShifts(carerId, range)` to `src/server/shifts/queries.ts` and `src/mocks/queries/shifts.ts` (outside Lane C, flagged for review in the PR). Navigation matches Family · Calendar (`?view=&date=&month=`, D/W/M, Previous/Next, Today), importing `src/features/family-calendar/calendar-params` without editing it. A block click opens `/carer/patients/[clientId]`.
- Reason: human answers in-session, 2026-09-26 (CHG-030).
- Alternatives considered: waiting for a shared PR for the query; D/W/M fixed to today; no-op block click.
- Consequences: AC-01, AC-02 rewritten, AC-04 to AC-10 added before implementation. Previous/Next/Today are a design gap, built from tokens — please review. `/carer/patients/[clientId]` is delivered by CAR-UI-02 (PR #125); until it merges to `carer-dev` the link lands on a 404 in the preview.
- Human confirmation required: no (confirmed, Dhruv Verma, 2026-09-26)
- Test changes caused (if any): none (before implementation)

### FD-02 — Local toolbar, not Family's `CalendarToolbar`
- Date: 2026-09-26
- Context: Family's `CalendarToolbar` always renders an 'Enter event' link, which carers must not have.
- Decision: A small toolbar, now `src/features/carer-home/carer-shifts-toolbar.tsx` (CHG-031; was `src/features/carer-calendar/`) ('Shifts' heading, range label, Previous/Next <unit>, Today, the kit's `SegmentedControl`). Lane F files are not edited.
- Human confirmation required: no

### FD-03 — Reuse Carer Home's error state
- Date: 2026-09-26
- Context: AC-09 asks for the same error state as Carer Home ('Something went wrong', 'Try again' refreshes the route). `CarerHomeErrorState` in `src/features/carer-home/` (Lane C) already does exactly that.
- Decision: The page imports `CarerHomeErrorState` rather than adding a copy under `src/features/carer-calendar/`.
- Reason: one component for one state; the copy is generic ("We couldn't load this page").
- Alternatives considered: a duplicate `carer-calendar-error-state.tsx`.
- Consequences: If the carer screens grow more error states, move it to a carer-wide name then.
- Human confirmation required: no
- Test changes caused (if any): none

### FD-04 — Apply CHG-031: the calendar moves into Carer Home
- Date: 2026-09-26
- Context: After implementation the human merged the Carer Calendar into Carer Home (CHG-031): Day by default, notifications beside the calendar from 1280px, `/carer/calendar` and the rail's Calendar item removed with no redirect.
- Decision: `CarerHomeView` holds the D/W/M calendar and the notifications; the Home page parses `?view=&date=&month=` with Family's `parseCalendarParams`, passing `view: "day"` when the URL has none. `src/features/carer-calendar/` and `src/app/(carer)/carer/calendar/` are deleted; the toolbar moves to `src/features/carer-home/carer-shifts-toolbar.tsx` with an `h2` (the header already titles the page). Home's side-by-side grid starts at `xl` (1280px) instead of `lg`, so a week never gets less than ~690px. The Carer item is removed from `src/components/shared/nav-config.ts` (outside Lane C, allowed by CHG-031).
- Reason: human request in-session, 2026-09-26 (CHG-031).
- Alternatives considered: redirecting `/carer/calendar` to Home (rejected by the human); notifications below the calendar at every width, or only in the bell.
- Consequences: FD-03's error state is now simply Home's. `getCarerTodayShifts` has no screen caller; left for CAR-01 to drop or keep.
- Human confirmation required: no (confirmed, Dhruv Verma, 2026-09-26)
- Test changes caused (recorded requirement change, CHG-031; **HUMAN REVIEW: test expectation changed**):
  - `carer-calendar.test.tsx` → `src/features/carer-home/carer-home-calendar.test.tsx`; renders `CarerHomePage` (mocks `getCarerNotifications`) instead of the calendar page.
  - T-03: before "no params → W, reads 30 Nov–6 Dec"; after "no params → D, reads 30 Nov only", plus a new `view=week` case with the old assertion.
  - T-06: URLs `/carer/calendar?…` → `/carer/home?…`; new Next-day case.
  - T-04: new day-block click case.
  - T-09, T-10: the loading-skeleton cases removed here, because the route's loading is Carer Home's, still tested by CAR-UI-01 AC-09 and AC-10.
  - CAR-UI-01 `carer-home.test.tsx`: mocks `getCarerShifts` and `getToday` instead of `getCarerTodayShifts`, and AC-01 asserts the call with today's one-day range; the region is 'Shifts' (was "Today's calendar"); the empty title is 'No shifts' (was 'No shifts today'); the page is called with `searchParams`.
  - F0-15 `rail.test.tsx` AC-03: Carer items Home, Patients, Settings (was with Calendar). `tests/e2e/shared-app-shell.spec.ts` AC-06: active item checked on `/carer/patients` (was `/carer/calendar`).

### FD-05 — One calendar size for Day, Week and Month; scrollable notifications
- Date: 2026-09-26
- Context: On Home, Month (6 rows of at least 120px) was ~100px taller than Week and Day, whose kit scroller sizes itself to the focus hours. The human asked for one size for all three views and a scrollable notifications list.
- Decision: The calendar body is one 640px box for every view and the empty state (card 748px at every width). Day and Week fill it: the kit sets its scroll viewport's height inline, so `carer-home-view.tsx` overrides it from the page with `h-auto!` and `flex-1` on the scroller's last child. Month's rows drop their 120px minimum and share the box (~100px each) with at most 3 chips per day. From 1280px the Notifications card matches the calendar card's height (`xl:items-stretch`; the list has `contain: size` so its length does not set the row height) and its list scrolls; below 1280px the list scrolls past 640px. The list is focusable (`tabIndex=0`, labelled by the heading) so a keyboard can scroll it.
- Reason: human request in-session, 2026-09-26.
- Alternatives considered: a `height` prop on the kit's `TimeGridScroller`, which would be the cleaner fix but is outside Lane C (`src/components/shared/**`); a fixed height for the whole page.
- Consequences: the override depends on the scroller's markup (viewport = last child). If a shared PR adds a height prop, use it and drop `FILL_TIME_GRID`. CSS-only: no test changes; checked with a Playwright sweep (1920 to 768).
- Human confirmation required: no (human request)

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
