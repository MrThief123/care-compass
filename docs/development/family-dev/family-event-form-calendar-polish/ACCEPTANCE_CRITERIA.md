# Acceptance Criteria — FAM-16 Family — Event form and calendar polish

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a task due Monday 30 November at 09:00 and completed Wednesday 2 December at 12:00, when Helen opens its Task detail, then the Status card shows "Completed at 12:00" and "Completed 2 days, 3 hours late". | NOT MET |
| AC-02 | US-01 | edge | Given a task completed on time, early, or less than a minute late, a task not done (planned or overdue), or a plain event, then no late note shows on Task detail or the Log. | NOT MET |
| AC-03 | US-01 | happy | Given a Done task completed late, then its Log row shows the same note without overlapping the status pill, on the Family Care log and the Carer Care log. | NOT MET |
| AC-04 | US-01 | boundary | The note reads "N days, M hours" from one day, "N hours, M minutes" from one hour, otherwise "N minutes"; a zero part is left out; 1 is singular ("1 day", "1 hour", "1 minute"). | NOT MET |
| AC-05 | US-02 | happy | Given any "Pick a date" calendar showing today's Melbourne date, then that day has a light ring and `aria-current="date"`, no other day does, and a selected day keeps its fill. | NOT MET |
| AC-06 | US-02 | happy | Given the event form with a date in another month than the one first shown, then the calendar opens on that date's month; when the date changes to another month, the calendar moves to it; the Previous/Next arrows still page. | NOT MET |
| AC-07 | US-02 | regression | Given the Admin Manage "Shift date" picker, then choosing a date, paging months and the dots still work and today is ringed. | NOT MET |
| AC-08 | US-03 | happy | Given the Add event form, then it has Start time and End time and no Duration; with Start 09:30 and End 10:15 it saves `durationMinutes: 45`; a blank End saves 0. | NOT MET |
| AC-09 | US-03 | error | Given End not later than Start, or a malformed End, when saving, then the field shows "End time must be after the start time." or "Enter an end time (HH:mm)." and nothing is saved. | NOT MET |
| AC-10 | US-03 | happy | Given an event of 45 minutes starting 09:30, when Edit event opens, then End time shows 10:15; an event of 0 minutes shows a blank End. | NOT MET |
| AC-11 | US-03 | regression | Given an on-shift carer's Add and Edit event forms, then they show the same Start and End time fields and call `createEvent`/`updateEvent` with `durationMinutes` as before; Family behaviour and every other field are unchanged. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
