# Acceptance Criteria — ADM-UI-04 Admin Clients screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Clients renders, then rows include 'Margaret · Helen' and 'Doris · Tom' with 'Remove' links. | NOT MET |
| AC-02 | US-01 | validation | Given Add client with empty Client name, when submitted, then an error is shown. | NOT MET |
| AC-03 | US-01 | permission | Given the Clients screen, when rendered, then no edit control for client information exists (D28). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
