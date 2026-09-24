# Acceptance Criteria — FAM-UI-03 Family Add / Edit event screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the Physiotherapy fixture, when Edit event renders, then Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description text are shown. | MET |
| AC-02 | US-01 | validation | Given the Add event form with no date, when Save event is pressed, then a Date error is shown. | MET |
| AC-03 | US-01 | happy | Given Edit event, when rendered, then document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile are shown. | MET |
| AC-04 | US-01 | happy | Given Family Home, when 'Enter event' is clicked, then the Add event screen opens. | MET |
| AC-05 | US-01 | happy | Given the Add event form, when it renders, then the switch 'This is a task — must be ticked off' is On, and pressing it turns it Off and back On (local state only). Added by CHG-009. | MET |
| AC-06 | US-01 | happy | Given Edit event, when it renders, then the task switch shows the event's current value: On for Physiotherapy (a task), Off for Afternoon walk (a plain event). Added by CHG-009. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
