# Acceptance Criteria — FAM-UI-03 Family Add / Edit event screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the Physiotherapy fixture, when Edit event renders, then Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description text are shown. | NOT MET |
| AC-02 | US-01 | validation | Given the Add event form with no date, when Save event is pressed, then a Date error is shown. | NOT MET |
| AC-03 | US-01 | happy | Given Edit event, when rendered, then document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile are shown. | NOT MET |
| AC-04 | US-01 | happy | Given Family Home, when 'Enter event' is clicked, then the Add event screen opens. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
