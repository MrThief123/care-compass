# Acceptance Criteria — FAM-13 Family — Change organisation

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Margaret at Banksia with 3 future shifts and 1 active assignment, when Helen transfers her to a second organisation, then clients.organisation_id changes, future shifts are cancelled and the assignment is ended. | MET |
| AC-02 | US-01 | happy | Given the transfer completed, when Priya (Banksia admin) selects Margaret, then zero rows are returned. | MET |
| AC-03 | US-01 | happy | Given the transfer completed, when Margaret's events, budget entries, documents and completions are counted, then counts equal the pre-transfer counts. | MET |
| AC-04 | US-01 | happy | Given Change organisation is confirmed from the picker, when the modal opens, then it shows the destructive title 'Change organisation?' and the retained/cleared wording. | MET |
| AC-05 | US-01 | happy | Given the modal is open, when Cancel is pressed, then no transfer action is called. | MET |
| AC-06 | US-01 | permission | Given Aisha (carer), when she calls `transfer_client_organisation`, then it raises a permission error. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
