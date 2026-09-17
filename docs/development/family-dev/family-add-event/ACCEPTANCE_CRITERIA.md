# Acceptance Criteria — FAM-06 Family — Add event (Enter event)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen on Home, when she clicks 'Enter event', completes required fields with Recurring 'Weekly' and saves, then the event appears on the calendar every week from the chosen date. | NOT MET |
| AC-02 | US-01 | validation | Given the Date field is empty, when Save event is pressed, then an error is shown on Date and nothing is submitted. | NOT MET |
| AC-03 | US-01 | happy | Given the Pick a date panel for November 2026, when rendered with seed data, then days 24, 26, 27 show event dots and the selected day is filled. | NOT MET |
| AC-04 | US-01 | permission | Given a carer or unrelated user calls the create-event action for Margaret, when executed, then it is rejected. | NOT MET |
| AC-05 | US-01 | happy | Given Cancel is clicked, when the form has unsaved input, then no event is created. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
