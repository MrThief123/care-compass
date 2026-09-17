# Acceptance Criteria — FAM-15 Family — Task detail

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Morning medication on 30 Nov done by Aisha Rahman at 09:14, when Task detail renders, then it shows 'Done · Aisha R.' and 'Completed at 09:14'. | NOT MET |
| AC-02 | US-01 | happy | Given the task, when rendered, then the subline reads 'Monday 30 November 2026 · Assigned to Aisha R.'. | NOT MET |
| AC-03 | US-01 | happy | Given the Overdue card on Home, when the chevron on 'Wound dressing check' is clicked, then its Task detail opens. | NOT MET |
| AC-04 | US-01 | validation | Given an occurrence key for Robert's event under Margaret's route, when requested, then a not-found page is returned. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
