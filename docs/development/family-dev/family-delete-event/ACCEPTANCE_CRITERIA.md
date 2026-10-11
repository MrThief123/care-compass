# Acceptance Criteria — FAM-18 Family — Delete event and recurrence end date

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen viewing a not-done occurrence of an event, when Task detail loads, then a 'Delete event' button is shown beside 'Edit event'. | NOT MET |
| AC-02 | US-01 | happy | Given a one-off event, when Helen presses 'Delete event' and confirms, then the event no longer shows on the Calendar or the Log and she returns to where she came from. | NOT MET |
| AC-03 | US-02 | happy | Given a recurring event, when Helen presses 'Delete event', then a dialog offers 'This occurrence' (selected) and 'This and all future occurrences'. | NOT MET |
| AC-04 | US-02 | happy | Given a weekly event, when Helen deletes 'This occurrence' of 14 Oct, then 14 Oct no longer shows and 7 Oct and 21 Oct still do. | NOT MET |
| AC-05 | US-02 | happy | Given a weekly event with a Done occurrence on 7 Oct, when Helen deletes 'This and all future occurrences' from 14 Oct, then 14 Oct and later no longer show, and 7 Oct and its completion still show in the Log. | NOT MET |
| AC-06 | US-02 | edge | Given a weekly event, when Helen deletes 'This and all future occurrences' from its first occurrence, then no occurrence of the event shows. | NOT MET |
| AC-07 | US-02 | edge | Given the delete dialog is open, when Helen presses Cancel or Esc, then nothing is deleted and the dialog closes. | NOT MET |
| AC-08 | US-01 | permission | Given a Done occurrence, when Task detail loads, then there is no 'Delete event' button, and the server refuses a delete for it. | NOT MET |
| AC-09 | US-01 | permission | Given a carer on shift for Margaret, when they view her event, then 'Delete event' is shown and works; given the carer is off shift, then the button is absent and the server refuses the delete. | NOT MET |
| AC-10 | US-01 | permission | Given Robert's family member, when they call delete for Margaret's event, then it is refused and nothing changes. | NOT MET |
| AC-11 | US-01 | error | Given the save fails, when Helen confirms a delete, then "Couldn't delete. Please try again." shows, the dialog stays open and nothing is deleted. | NOT MET |
| AC-12 | US-03 | happy | Given the Add event form, when 'Recurring' is 'Does not repeat' then there is no 'Ends' field; when it is any repeat option, then an optional 'Ends' date field shows, empty (Never). | NOT MET |
| AC-13 | US-03 | happy | Given a weekly event from 7 Oct with Ends 21 Oct, when saved, then 7, 14 and 21 Oct show and 28 Oct does not. | NOT MET |
| AC-14 | US-03 | validation | Given Date 7 Oct and Ends 1 Oct, when Helen saves, then an Ends error is shown and nothing is saved. | NOT MET |
| AC-15 | US-03 | happy | Given an event with an end date, when Helen opens Edit event, then Ends shows that date; changing it applies to the whole series, and clearing it makes the series repeat forever again. | NOT MET |
| AC-16 | US-01 | permission | Given an Admin viewing a client's event read-only, when Task detail loads, then there is no 'Delete event' button. | NOT MET |
| AC-17 | US-01 | a11y | Given Task detail and the delete dialog, when axe runs, then there are no violations; the button is at least 44×44px, named 'Delete event', and the dialog traps focus and closes on Esc. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
