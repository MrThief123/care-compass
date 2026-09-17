# Acceptance Criteria — FAM-UI-05 Family Budget screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Budget renders, then NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown. | NOT MET |
| AC-02 | US-01 | happy | Given fixtures, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | NOT MET |
| AC-03 | US-01 | empty | Given no fund entries, when History renders, then an empty state is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
