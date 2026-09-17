# Acceptance Criteria — CAR-06 Carer — Mark tasks done

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha on an active shift for Margaret, when she ticks Physiotherapy on Home, then Family Home shows 'Done · Aisha R.' for Physiotherapy. | NOT MET |
| AC-02 | US-01 | permission | Given Aisha is not on shift, when Home renders, then task checkboxes are not interactive. | NOT MET |
| AC-03 | US-01 | error | Given the server rejects the completion, when ticked, then the checkbox reverts and an error is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
