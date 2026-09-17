# Acceptance Criteria — ADM-UI-01 Admin Home screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Admin Home renders, then 'Clients' shows 42 and 'Staff' shows 17. | NOT MET |
| AC-02 | US-01 | happy | Given fixtures, when rendered, then overdue rows include 'Robert · Medication review · Daniel K.'. | NOT MET |
| AC-03 | US-01 | empty | Given no overdue fixtures, when rendered, then 'All caught up' is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
