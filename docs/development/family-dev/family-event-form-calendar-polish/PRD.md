# FAM-16 — Family — Event form and calendar polish

| Field | Value |
|---|---|
| Feature ID | FAM-16 |
| Dashboard / stream | Family (also touches shared and Carer screens) |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` |
| Feature branch | `feature/family-event-form-calendar-polish` |
| Documentation | `docs/development/family-dev/family-event-form-calendar-polish/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D18 |
| Status / owner | See PROGRESS.md |

## Purpose
Three small usability fixes found while reviewing CAR-07, built together (parking-lot item PL-27, promoted by CHG-051).

## Problem
A task done long after it was due looks the same as one done on time. The "Pick a date" calendar does not mark today and can show a different month from the date it is editing. The event form asks for Duration in minutes, while shift assignments take a start and an end time.

## Description
1. **Late-completion note.** A task completed after its due time (the occurrence start, `dueTime`) says how late: "Completed 2 days, 3 hours late". On the Task detail Status card and on each Log row.
2. **Date picker.** "Pick a date" rings today's date lightly and always shows the month of the active (selected) date. Applies wherever the picker is used, for every role.
3. **Start and end time.** The event form has Start time and End time instead of Duration. The stored value is unchanged: `durationMinutes = end - start`.

## User value
Families and carers see at a glance how late care was, find today on the calendar, and enter an event's time the way they already enter a shift.

## Scope
- **Late note** (`src/features/family-task-log/late-completion.ts`, used by `TaskDetailView` and `TaskLogTable`). Shown only for a Done task whose `completedAt` is at least one minute after its start. Wording: days and hours ("2 days, 3 hours"), hours and minutes ("1 hour, 30 minutes"), or minutes ("45 minutes"); a zero part is left out; singular for 1. Added beside the existing "Completed at HH:mm" (kept). The Carer Care log and carer Task detail reuse these components, so carers get it too.
- **Date picker** (flagged Lane S edit, see FD-02): `DatePickerGrid` marks today (Melbourne date; light ring, `aria-current="date"`, `data-today`); `EventForm` opens on the month of `values.date` and moves to it whenever `values.date` changes (paging with the arrows still works). The admin Manage "Shift date" picker keeps working and gains the today ring.
- **Event form** (`src/features/family-event-form/`): `EventDetailsFields` shows Title, Start time, End time (24-hour `HH:mm`). End time may be left blank (duration 0). End must be after Start, on the same day (no overnight). Edit opens with End = start + duration (blank for 0). Used by Family and Carer (CAR-07) screens alike.

## Out of Scope
- Any migration, contract or Zod change: `care_events.duration_minutes`, `createEvent` and `updateEvent` keep taking `durationMinutes`.
- Overnight events; a new "overdue" definition (due time stays the occurrence start); Admin task log (PL-20).
- Redesigning the calendar, a month/year jump control, or time pickers.

## Functional Requirements
- Late = `completedAt - start` of at least 1 whole minute, measured in elapsed time.
- The note is absent for on-time, early, not-done, and plain-event occurrences.
- "Today" and the form's dates are Australia/Melbourne.
- End time errors: "Enter an end time (HH:mm)." for a malformed value; "End time must be after the start time." when end is not later than start.

## UI / UX Requirements
- The note is plain text (not colour alone), wraps, and never overlaps the status pill, at 1920 to 768 px.
- The today ring is light (`border-border-brand` token, 1px); the selected day keeps its fill; targets stay as they are.
- No new design exists for these items (OQ-19): built from tokens and flagged "design gap, built from tokens, please review" in the PR.

## Dependencies
- Features: FAM-06, FAM-07, FAM-14, FAM-15, CAR-07, UI-01, UI-02 — all merged.
- Blocking open decisions: None.
- Non-blocking open decisions: None.

## Inputs
- An occurrence's `start`, `status`, `completedAt`; the event form's Start and End time.

## Outputs
- Text on two screens; a ring and a month on the picker; `durationMinutes` to the existing contract.

## Error / Edge Cases
- Existing event with `start + duration` past midnight: End shows the next-day clock time and fails the "after start" check; the person sets an End time on the same day to save (FD-03).
- Completed within the same minute as due: no note.
- Clock times across a daylight-saving change: lateness is elapsed time.

## Security / Permissions
- None added; no data access changes. Authorisation stays in RLS.

## Technical Considerations
- Lane S edit is additive with defaults: `DatePickerGrid` new optional `today` prop; `EventForm` month sync.
- `formatDuration` (shared) is not used for the note, which has its own wording.

## Traceability
- Product requirements: REQ-17 (Overdue state), REQ-19, REQ-21 (completion shown), REQ-18; PD-047 (event fields).
- Controlled change: CHG-051 (promotes PL-27, parked by CHG-049)
- Sources: human, 2026-10-02 (CAR-07 review)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements.
