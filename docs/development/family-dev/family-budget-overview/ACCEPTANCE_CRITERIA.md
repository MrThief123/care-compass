# Acceptance Criteria — FAM-10 Family — Budget overview and history

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data, when Budget renders, then three bucket cards NDIS, Fixed, Government appear with remaining $14,880, $2,750, $240. | NOT MET |
| AC-02 | US-01 | happy | Given seed fund entries, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | NOT MET |
| AC-03 | US-01 | empty | Given no fund entries, when History renders, then the empty state is shown. | NOT MET |
| AC-04 | US-01 | happy | Given Home, when 'View breakdown' is clicked, then the Budget page opens. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
