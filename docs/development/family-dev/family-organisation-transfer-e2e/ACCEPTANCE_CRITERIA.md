# Acceptance Criteria — INT-02 End-to-end: organisation transfer journey

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen transfers Margaret to a second organisation, when Priya reloads Clients, then Margaret is absent, and when Aisha reloads Patients, Margaret is absent. | NOT MET |
| AC-02 | US-01 | happy | Given the transfer, when Helen opens the Task log, then all previous completions still show. | NOT MET |
| AC-03 | US-01 | happy | Given the second organisation's admin, when they open Clients, then Margaret is listed. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
