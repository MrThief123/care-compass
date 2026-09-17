# Acceptance Criteria — CAR-UI-02 Carer Patients and patient info screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Patients renders, then 7 cards appear including 'Margaret' '78 years · Preston VIC' and 'Jean' '88 years · Fairfield VIC'. | NOT MET |
| AC-02 | US-01 | empty | Given no patients, when rendered, then 'No patients assigned yet' is shown. | NOT MET |
| AC-03 | US-01 | happy | Given a card for Margaret, when clicked, then the patient info page for Margaret opens. | NOT MET |
| AC-04 | US-01 | permission | Given fixture onShift=false, when patient info renders, then no Edit links exist. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
