# FAM-18 — Family — Delete event and recurrence end date

| Field | Value |
|---|---|
| Feature ID | FAM-18 |
| Dashboard / stream | Family (also Carer on shift, through the shared Task detail and event form) |
| Phase | Phase 3 — Data wiring & behaviour |
| PR target | `main` |
| Feature branch | `feature/family-delete-event` |
| Documentation | `docs/development/family-dev/family-delete-event/` |
| Lane | F — Family |
| Sprint | SPRINT · D21 |
| Change | CHG-060 (new requirement, human-approved in-session 2026-10-11) |
| Status / owner | See PROGRESS.md |

## Purpose
Let families and on-shift carers remove care that should no longer happen, and let a repeating event end on a date.

## Problem
There is no way to delete an event or a single occurrence (FAM-07 and CAR-07 left it out of scope). A repeating event always repeats forever: the form has no end date, although the recurrence engine and the database already support one (`until`, `care_events.recurrence_until`).

## Description
1. **Delete event** on Task detail (the screen that views an event). A one-off event gets a confirmation. A recurring event gets a choice: **This occurrence** or **This and all future occurrences**.
2. **Ends** on the event form: an optional end date for a repeating event, in Add and Edit.

## User value
Care plans stay accurate: cancelled appointments disappear, and a course of care (for example six weeks of physiotherapy) stops by itself.

## Users
- Family (linked to the client)
- Carer on shift for the client (same permission as editing events, CAR-07)
- Admin: read-only view, no delete

## Scope
- **Delete event button** on Task detail, beside 'Edit event', shown wherever 'Edit event' is shown (`canEdit`). Absent, not disabled, for a viewer who cannot edit. Absent for an occurrence that is already Done (completed care stays in the record).
- **One-off event:** a confirmation ("Delete this event?"), then the event no longer appears.
- **Recurring event:** a dialog with two choices, **This occurrence** (default) and **This and all future occurrences**, and Delete / Cancel.
  - *This occurrence* writes a `cancelled` override for that occurrence (PD-004). Other occurrences are untouched.
  - *This and all future* sets the series end date to the day before that occurrence, in `Australia/Melbourne`. Earlier occurrences and every completion stay. If that day is before the series' first occurrence, the whole event is removed from the calendar.
- After a delete the viewer returns to the screen they came from (the Calendar, or the Log), as Edit does.
- **Ends field** on the event form (Add and Edit), under 'Recurring', shown only when the event repeats. Optional. Empty means 'Never' (the existing perpetual default, PD-046). A date picker like Date. It must not be before the Date field. Saved to `recurrence_until`. On Edit it shows the saved end date, and changing or clearing it applies to the whole series (a series-level field, like Title; FAM-07 FD-01).
- Works for Family routes and for the Carer routes that reuse the same screens (on shift only, by RLS).
- Both changes are audited by the existing F0-08 triggers.

## Out of Scope
- Undoing a delete (a deleted occurrence or an ended series can be brought back by editing the end date for a series; there is no restore button).
- Deleting a Done occurrence, or deleting documents, costs or budget entries.
- Bulk delete, delete from the calendar popover, delete from the Edit event page.
- Admin delete.
- Any migration or RLS change (the columns and the update/insert policies already exist).
- A restore/trash screen.

## Functional Requirements
- Authorisation lives in RLS (`can_edit_care_events`): linked family, or a carer on an active shift. The UI hides the button but never grants access.
- History is never rewritten: completions are append-only and stay. Pending costs only exist for completed care, so they are not affected.
- End date is inclusive: an occurrence on the end date still happens.
- Dates are `YYYY-MM-DD` Melbourne local dates; recurrence maths only through `src/lib/recurrence`.

## UI / UX Requirements
- No Figma frame exists for either control (design gap, PD-052 style): built from kit tokens, flagged "design gap, built from tokens, please review" in the PR.
- Delete is a destructive-styled secondary button, 44×44px minimum, with an accessible name 'Delete event'. The dialog is the kit modal, focus-trapped, Esc cancels, and the chosen option is text, not colour alone.
- Error: "Couldn't delete. Please try again." in a `role="alert"`; the dialog stays open.

## Dependencies
- Features: FAM-06, FAM-07, FAM-15, CAR-07, F0-09, F0-11, UI-02 — all merged.
- Blocking open decisions: None.
- Non-blocking: pending-cost behaviour on delete (raised in CHG-020 for F0-12) is moot here, see FD-03.

## Inputs / Outputs
- Delete: `eventId`, `occurrenceKey`, `scope` (`occurrence` | `future`). Output: ok or error.
- Create/Update: optional `endDate` (`YYYY-MM-DD` or absent).

## Error / Edge Cases
- Delete a Done occurrence: button absent; the server also refuses.
- Shift ends while the dialog is open: the database refuses; error shown, nothing deleted.
- Another client's event, or a stale URL: refused with no data leaked.
- End date before the Date: validation error on the field.
- 'Ends' set, then the event changed to 'Does not repeat': the end date is cleared.
- Series with all its occurrences ended: Task detail of a deleted occurrence 404s.

## Security / Permissions
- Family of the client; carer on an active shift for the client. Nobody else. No physical delete: nothing is removed from the database.

## Technical Considerations
- New server action `deleteEventOccurrence` in `src/server/events/actions.ts` (mock and Supabase branches). Cancel uses the existing `care_event_overrides` upsert (kind `cancelled`); future sets `care_events.recurrence_until`. No new contract is shared with another in-flight feature, but `createEvent` / `updateEvent` gain an optional `endDate` (CLAUDE.md §3 contracts rule: checked, none other in flight).
- `EventFormValues` (shared forms kit) gains `endDate`: an additive, flagged Lane S edit kept in this PR (precedent CHG-051).
- Carer routes reuse the Family screens; any carer page edit is additive (props only).
