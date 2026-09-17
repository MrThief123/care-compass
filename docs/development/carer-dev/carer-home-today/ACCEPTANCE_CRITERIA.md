# Acceptance Criteria — CAR-01 Carer Home — Today's calendar and Tasks

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data for Aisha on 30 Nov, when Home renders, then Today's calendar shows '09:00 Margaret — Morning medication' with 'Done · Aisha R.', '11:30 Margaret — Physiotherapy' Planned and '15:00 Margaret — Afternoon check-in' Planned. | NOT MET |
| AC-02 | US-01 | permission | Given Aisha is not assigned to Robert, when her today query runs, then no Robert occurrences are returned. | NOT MET |
| AC-03 | US-01 | empty | Given no occurrences, when Home renders, then the empty state is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
