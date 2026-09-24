# Decisions — FAM-UI-02 Family Calendar screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-10 | Status behaviour and undo | no | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |

**OQ-10 proposed default used:** a Done task starts ticked in the Tasks panel and family can untick it (local state only here; the append-only 'undone' entry is FAM-05 / F0-11).

## Feature decisions log

### FD-01 — The calendar range read is added on this branch (root CHG-006)
- Date: 2026-09-24
- Context: the events contract had no range read (`getTodayOccurrences`, `getTaskLog`, `getOccurrence` only) and the fixtures stopped at Mon 30 Nov, so no week but the reference day could be drawn and AC-02 (Physiotherapy on FRI 4) could not be met.
- Decision: add `getOccurrences(clientId, { from, to })` and `getToday()` to `src/server/events/queries.ts`, their mocks, `OccurrenceRangeSchema` in `src/types/domain.ts`, and the Tue 1 – Sat 5 Dec design rows in `src/mocks/fixtures.ts`, all on this feature branch.
- Reason: the human's instruction ("make on this feature branch"). F0-11 already names `getOccurrences(clientId, range)` for the database; this is its Phase 1 mock with the same shape, so wiring (FAM-04) changes no screen code.
- Alternatives considered: a separate shared PR first (cleaner ownership, slower); screen-local fixtures (breaks "data only via `src/server/**`").
- Consequences: this family PR touches Lane S / Lane B folders (`src/server/events`, `src/mocks`, `src/types`). The edits only add code. Existing tests are unchanged and pass.
- Human confirmation required: yes. Given by Dhruv Verma, 2026-09-24.
- Test changes caused: none.

### FD-02 — Future design rows are kept out of the Task log
- Date: 2026-09-24
- Decision: the Tue 1 – Sat 5 Dec rows live in `UPCOMING_OCCURRENCES_BY_CLIENT_ID`. `getOccurrences` and `getOccurrence` read them; `getTaskLog` does not.
- Reason: a log is what has happened, and perpetual events have no end, so a log over the future cannot be finite. It also keeps the Task log fixtures at exactly 137 rows (7 pages) and their tests unchanged. Task detail still opens a future occurrence (CHG-005).
- Human confirmation required: no (within CHG-006).

### FD-03 — The URL is the calendar's state: `?view=&date=&month=`
- Date: 2026-09-24
- Decision: `view` = `day` | `week` | `month` (default `week`). `date` = the selected day (default `getToday()`). `month` = `YYYY-MM`, drawn by the month view. A value that does not parse (unknown view, impossible date, year outside 1900–2199, repeated param) falls back to its default; nothing unchecked is echoed back into a link. Changing view or stepping Previous/Next navigates (`router.push`), and the server reads the new range. Selecting a day already on screen only rewrites the URL (`history.replaceState`, which Next.js 16 syncs with its router, per `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`), so a reload lands on the same day with no extra read.
- Reason: PRD Scope ("D/W/M (URL param)"); a real calendar must be navigable and shareable.
- Human confirmation required: no.

### FD-04 — Local toolbar instead of the kit's `CalendarHeader`
- Date: 2026-09-24
- Context: `CalendarHeader` can only label a week range ("x – y"), and its arrows are named "Previous"/"Next" in every view.
- Decision: `src/features/family-calendar/calendar-toolbar.tsx` reuses the kit's `SegmentedControl` and `Icon`. Its heading (the page's h1) reads "30 Nov – 6 Dec 2026", "Friday 4 December 2026" or "December 2026", and the arrows say what they move by ("Next week"). The Previous/Next arrows are not in the design; they are the kit's pattern and are needed to reach any other week.
- Kit need (not edited here, CLAUDE.md §4.2): `CalendarHeader` could take a `label` prop and view-aware arrow names. Suggest a shared PR.
- Human confirmation required: no. Flagged in the PR.

### FD-05 — Log rows reuse Home's `ActivityLinkRow`
- Date: 2026-09-24
- Decision: the Log panel uses `src/features/family-home/activity-link-row.tsx` and `home-format.ts#shortDate` (both Lane F), not the kit's `ActivityRow`, for the same reasons as FAM-UI-01 FD-15: a real link, a title that wraps, a pill that is never squeezed. Three rows: the newest Done or Overdue rows from `getTaskLog` page 1; Planned rows are left out because they have not happened. The pill names the carer in full ("Aisha Rahman", PD-038), where the design writes "Aisha R.", as on Home.
- Human confirmation required: no.

### FD-06 — Loading skeleton built from tokens
- Date: 2026-09-24
- Decision: `loading.tsx` renders `CalendarSkeleton`, the same frame as the screen (toolbar, grid card, two panels with `ListRowSkeleton`s), because the States sheet only draws a list-row skeleton. Error is `error.tsx` with the kit's `ErrorState` and Next.js 16 `retry`. The empty states are "No tasks on this day" in the Tasks panel (the grid still draws) and "No activity yet" in the Log.
- Human confirmation required: no.

### FD-07 — The current-time line is shown only on the real day
- Date: 2026-09-24
- Context: the kit's `TimeGridScroller` labels the current time in the gutter whatever week is shown, so a red "13:24" sat beside a week that does not contain today.
- Decision: the view passes the clock to `WeekGrid` / `DayTimeline` only while the real Melbourne day is in the visible range, and `null` otherwise. In mock mode the grid opens on the fixtures' reference week (30 Nov), so no line shows until that date. The page header's date comes from the shell (real clock) and is unchanged.
- Kit need: `TimeGridScroller` could hide its gutter label when no column is today. Suggest a shared PR.
- Human confirmation required: no.

### FD-08 — M opens the month that holds most of the week
- Date: 2026-09-24
- Context: AC-05 expects M, pressed on 30 Nov – 6 Dec with Mon 30 Nov selected, to show December.
- Decision: switching to the month view opens the month of the selected date's Thursday (the month holding at least four of the week's days), and keeps the selected day. That row is always inside the month's 6×7 grid, so the selection stays visible. In the month view Previous/Next moves a month and keeps the selection if the new grid still shows it, otherwise selects the 1st; picking a leading or trailing day does not move the grid.
- Human confirmation required: no. Flagged in the PR.

### FD-09 — Clicking a calendar block opens that task's detail
- Date: 2026-09-24
- Context: the kit's blocks are buttons ("opens the event for editing"), but the Edit event route (FAM-UI-03) does not exist yet and the design does not say (OQ-19).
- Decision: a block opens `/family/[clientId]/tasks/[occurrenceKey]` (Task detail, which has an Edit link). Change to the edit route when FAM-UI-03 lands if the human prefers.
- Human confirmation required: yes, when convenient (non-blocking).

### FD-10 — Kit differences from the design, left as the kit draws them
- Date: 2026-09-24
- Differences: `WeekGrid` highlights today's column, not the selected day (it has no selected-day prop), so picking TUE 1 changes the Tasks panel but not the grid. Blocks show title then time range ("Physiotherapy / 11:30–13:00"); the design shows the start time then the title. Short blocks truncate the title (UI-01's density tiers). `Checkbox` is a native input; the Tasks panel sets `accent-primary` locally so it is brand teal.
- Kit need: a `selected` prop on `WeekGrid`. Suggest a shared PR.
- Human confirmation required: no. Flagged in the PR.

### FD-11 — `src/app/dev-preview-calendar-kit` not deleted
- Date: 2026-09-24
- Context: that route's comment says to delete it once a real screen renders the three grids against `src/server/**` data, which this screen now does.
- Decision: left in place. It is outside Lane F's folders. Raise with Lane S.
- Human confirmation required: no.

### FD-12 — Keyboard shortcuts and Today (CHG-007)
- Date: 2026-09-24
- Decision: a window `keydown` listener (`use-calendar-shortcuts.ts`, no new dependency). D/W/M change view (pressing the current view's key does nothing), ←/→ step, T goes to today. Skipped when a modifier is held (so Cmd+← and browser shortcuts still work), on key repeat (each step is a server navigation), and when focus is in a text input, textarea, select or contenteditable; checkboxes and buttons do not block them. Keys act on the day picked on screen, not only the URL's first date.
- Today uses the contract's `getToday()` (the fixtures' 30 Nov in mock mode, the real Melbourne day once wired), so in mock mode it disagrees with the shell's header date, as FD-07 already notes. In the month view Today opens today's own month (30 Nov → November), unlike M, which opens the month of the selected week's Thursday (FD-08). If today is already in the visible range, Today selects it locally with no navigation.
- The Today button is the kit `Button` (secondary, 44px) after the Next arrow. The arrows and Today carry `aria-keyshortcuts` and a `title` tooltip. The kit `SegmentedControl` does not accept `aria-keyshortcuts` on its radios; not edited (shared folder).
- Human confirmation required: no. Flagged in the PR.
