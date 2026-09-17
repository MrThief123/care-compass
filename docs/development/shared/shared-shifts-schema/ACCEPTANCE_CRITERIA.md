# Acceptance Criteria — F0-10 Shifts schema, active-shift function and conflict query

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha has a shift for Margaret from 07:00 to 11:00 today, when `carer_on_active_shift(Margaret)` runs as Aisha at 09:00, then it returns true. | NOT MET |
| AC-02 | US-01 | edge | Given the same shift, when the function runs at 11:00 exactly, then it returns false. | NOT MET |
| AC-03 | US-01 | permission | Given the shift is cancelled, when the function runs at 09:00, then it returns false. | NOT MET |
| AC-04 | US-02 | happy | Given Aisha has a shift 11:30–13:00, when `overlapping_shifts` is called for 12:00–15:00, then that shift is returned. | NOT MET |
| AC-05 | US-02 | happy | Given an overlap exists, when Priya inserts the overlapping shift, then the insert succeeds. | NOT MET |
| AC-06 | US-02 | permission | Given Aisha is a carer, when she inserts a shift, then the insert is rejected by RLS. | NOT MET |
| AC-07 | US-02 | permission | Given Helen is Margaret's family, when she selects shifts, then she sees Margaret's shifts only. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
