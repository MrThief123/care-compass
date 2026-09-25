# Acceptance Criteria — FAM-UI-08 Family event cost fields (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Cover: happy path, validation, errors, permissions, empty states, relevant edge cases.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the Add event form on fixtures, when the family enters a cost of '90' and picks 'NDIS', then the form holds a cost of $90.00 paid from NDIS, and the picker shows each bucket's remaining balance. | MET |
| AC-02 | US-01 | validation | Given a cost of '0', '-5' or '12.345', when the form is submitted, then it is refused with a message on the Cost field; given a cost with no bucket, then it is refused with a message on the bucket picker; given no cost, then no bucket is required. | MET |
| AC-03 | US-02 | edge | Given a bucket whose balance is $0, or a bucket with pending costs, when the picker opens, then that bucket is struck through, reads "No funds left", and cannot be selected (by pointer or keyboard). | MET |
| AC-04 | US-02 | edge | Given a cost larger than a selectable bucket's balance, when that bucket is picked, then a warning says the cost will be held as pending until funds are added, and the bucket stays selected. | MET |
| AC-05 | US-01 | happy | Given a recurring event with a cost, when the form renders, then it reads "Charged each time it's completed". | MET |
| AC-06 | US-03 | happy | Given a fixture event with a $90 cost paid from NDIS, when its Edit event form opens, then Cost shows $90.00, NDIS is selected, and the form says a change applies to future completions only. | MET |

Types: happy · validation · error · permission · empty · edge · security.
Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
