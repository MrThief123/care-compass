# Acceptance Criteria — CAR-08 Carer — Record an expense

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Government remaining $240, when Aisha records a $40 expense, then remaining becomes $200. | NOT MET |
| AC-02 | US-01 | edge | Given remaining $240, when a $300 expense is recorded, then it saves and state is 'depleted'. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
