# Acceptance Criteria — FAM-UI-06 Family Settings screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Settings renders, then Name 'Helen', Phone '0412 345 678', Email 'helen@example.com', Address '12 Wattle St, Preston VIC 3072' are shown. | NOT MET |
| AC-02 | US-01 | happy | Given 'Change' is clicked, when the modal opens, then its title is 'Change organisation?' and the body states Banksia Home Care will lose access immediately. | NOT MET |
| AC-03 | US-01 | happy | Given the modal, when Cancel is clicked, then it closes and nothing else happens. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
