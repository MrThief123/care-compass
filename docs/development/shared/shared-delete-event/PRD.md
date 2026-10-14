# F0-27 Delete event (provisional ID; plan row and CHG pending human confirmation)

## Scope
- A **Delete event** button on the event edit screen for Family, and for a Carer on an active shift (the same people who may edit, OQ-09). Admins never write, so they get no button.
- One-off event: delete removes it (a cancelled override on its only occurrence).
- Recurring event: a choice, **Delete this event** (only the viewed occurrence) or **Delete all future events** (this one and every later one).
- Confirmation before anything is deleted.
- History stays: past occurrences, ticks, the task log and costs already charged are not touched.

## Out of scope
- Deleting past occurrences or refunding charged costs. Restoring a deleted event.

## How it works (no new table, no new policy)
- This occurrence: upsert a `cancelled` override for (event, original_start).
- All future: set `care_events.recurrence_until` to the day before the viewed occurrence. If the viewed occurrence is the series' first, deactivate the event (`is_active = false`).
- A one-off event: cancelled override.
