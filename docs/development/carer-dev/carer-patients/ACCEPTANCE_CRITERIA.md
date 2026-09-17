# Acceptance Criteria — CAR-03 Carer — Patients

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha is assigned to Margaret, Robert, Elsie, Frank, Doris, Harold and Jean, when Patients loads, then 7 cards are shown including 'Margaret' '78 years · Preston VIC'. | NOT MET |
| AC-02 | US-01 | happy | Given search 'Eld', when submitted, then only Elsie is shown. | NOT MET |
| AC-03 | US-01 | empty | Given no assignments, when Patients renders, then 'No patients assigned yet' is shown. | NOT MET |
| AC-04 | US-01 | permission | Given a client in the same organisation without assignment, when Patients loads, then that client is absent. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
