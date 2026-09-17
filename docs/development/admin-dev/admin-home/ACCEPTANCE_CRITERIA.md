# Acceptance Criteria — ADM-01 Admin Home — counts and overdue events

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data, when Admin Home loads for Priya, then Clients shows the organisation's client count and Staff the active carer count. | NOT MET |
| AC-02 | US-01 | happy | Given overdue items, when rendered, then a row shows 'Margaret', 'Wound dressing check', 'Aisha R.' and an Overdue pill. | NOT MET |
| AC-03 | US-01 | permission | Given another organisation's overdue events, when Priya's home loads, then they are not included. | NOT MET |
| AC-04 | US-01 | empty | Given no overdue events, when rendered, then 'All caught up' is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
