# Acceptance Criteria — ADM-02 Admin — Staff list and add/edit staff

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Priya completes Name, Phone, Email and Role 'Enrolled Nurse' and saves, then the new staff member appears in the list with role 'Enrolled Nurse'. | NOT MET |
| AC-02 | US-01 | validation | Given Email is empty, when Save is pressed, then an Email error is shown. | NOT MET |
| AC-03 | US-01 | happy | Given Aisha's row, when Edit is clicked, then the panel shows her Name, Phone, Email and Role. | NOT MET |
| AC-04 | US-01 | permission | Given Priya, when she updates a profile in another organisation, then RLS rejects it. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
