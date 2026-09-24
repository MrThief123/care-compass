# Acceptance Criteria — FAM-UI-02 Family Calendar screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given no view param, when the calendar renders, then W is selected and '30 Nov – 6 Dec 2026' is shown. | MET |
| AC-02 | US-01 | happy | Given fixtures, when the week renders, then Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4. | MET |
| AC-03 | US-01 | happy | Given a user selects TUE 1, when the Tasks panel updates, then its subtitle reads 'Tuesday 1 December'. | MET |
| AC-04 | US-01 | happy | Given Physiotherapy unticked, when ticked, then its label is struck through (local state). | MET |
| AC-05 | US-01 | happy | Given the week view, when M is pressed, then a December 2026 month grid is shown. | MET |
| AC-06 | US-01 | happy | Given the calendar, when D, W or M is pressed, then that view is shown; when ← or → is pressed, then the calendar moves back or forward one day, week or month, by view. Not while typing in a text field or with Ctrl/Cmd/Alt held. (CHG-013) | MET |
| AC-07 | US-01 | happy | Given any date in any view, when Today (button beside the range heading) is clicked or T is pressed, then the same view shows today, with today selected; the month view opens today's month. (CHG-013) | MET |
| AC-08 | US-01 | happy | Added by CHG-016. Given a task in the Tasks panel, when it is ticked, then its block in the week, day and month views shows Done at once on the same page, with the signed-in person's name where the view shows one ("Done · Helen Doyle"); when unticked, it shows its original status again (a task that was Done shows Planned, without its old name). Nothing is saved, the Log is unchanged, and the tick survives picking another day in the range. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
