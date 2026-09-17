# Acceptance Criteria — CAR-09 Carer — Settings

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha's profile, when Settings renders, then Name 'Aisha Rahman', Phone '0423 987 654', Email 'aisha.r@banksiahomecare.com.au', Role 'Registered Nurse' are shown. | NOT MET |
| AC-02 | US-01 | permission | Given Aisha, when she updates her own job_title, then RLS/column privileges reject it. | NOT MET |
| AC-03 | US-01 | happy | Given Reset clicked, when the action runs, then a reset email is requested. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
