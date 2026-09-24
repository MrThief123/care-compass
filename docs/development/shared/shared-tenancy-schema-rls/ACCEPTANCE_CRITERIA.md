# Acceptance Criteria — F0-06 Identity, organisation and client access schema with RLS

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen is linked to Margaret, when Helen selects from `clients`, then only Margaret's row is returned. | MET |
| AC-02 | US-01 | permission | Given Helen is not linked to Robert, when Helen selects Robert's row by id, then zero rows are returned. | MET |
| AC-03 | US-02 | happy | Given Priya is admin of Banksia Home Care, when she selects from `clients`, then exactly the clients whose organisation_id is Banksia are returned. | MET |
| AC-04 | US-02 | permission | Given a client belongs to another organisation, when Priya selects it, then zero rows are returned. | MET |
| AC-05 | US-03 | happy | Given Aisha has an active assignment to Margaret, when Aisha selects from `clients`, then Margaret is returned. | MET |
| AC-06 | US-03 | permission | Given Aisha belongs to Banksia but has no assignment to Robert, when Aisha selects Robert, then zero rows are returned. | MET |
| AC-07 | US-03 | edge | Given Aisha's assignment to Margaret has ended_at in the past, when Aisha selects Margaret, then zero rows are returned. | MET |
| AC-08 | US-03 | permission | Given Aisha's profile is_active is false, when she selects from `clients`, then zero rows are returned. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
