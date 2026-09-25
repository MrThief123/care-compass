# Acceptance Criteria — ADM-UI-03 Admin Staff screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Staff renders, then rows include 'Sarah Nguyen · Enrolled Nurse' and 'Marcus Chen · Support Worker'. | MET |
| AC-02 | US-01 | happy | Given Edit on Aisha Rahman, when clicked, then the panel shows her Name, Phone, Email and Role 'Registered Nurse'. | MET |
| AC-03 | US-01 | validation | Given '+ Add staff' with empty Email, when Save is pressed, then an Email error is shown. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
