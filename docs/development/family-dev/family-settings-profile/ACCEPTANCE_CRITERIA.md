# Acceptance Criteria — FAM-12 Family — Settings: family info and password reset

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen's phone '0412 345 678', when she changes it and saves (per OQ-35), then the new number is shown after reload. | MET |
| AC-02 | US-01 | validation | Given an invalid email 'helen@', when saved, then an email error is shown. | MET |
| AC-03 | US-01 | happy | Given Helen clicks Reset, when the action runs, then a reset email is requested for her address and a confirmation message is shown. | MET |
| AC-04 | US-01 | permission | Given Helen, when she updates another profile's row, then RLS rejects it. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
