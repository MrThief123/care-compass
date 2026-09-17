# Acceptance Criteria — FAM-UI-01 Family Home screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Family Home renders, then the Today panel shows Morning medication (Done · Aisha R.), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned). | NOT MET |
| AC-02 | US-01 | happy | Given fixtures, when rendered, then the Overdue card badge is '3' and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov). | NOT MET |
| AC-03 | US-01 | happy | Given fixtures, when rendered, then the budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state. | NOT MET |
| AC-04 | US-01 | happy | Given Recent activity, when 'View all' is clicked, then navigation targets `/family/<id>/tasks`. | NOT MET |
| AC-05 | US-01 | empty | Given no overdue fixtures, when rendered, then 'All caught up' is shown in the Overdue card. | NOT MET |
| AC-06 | US-01 | error | Given the contract query rejects, when rendered, then 'Something went wrong' with Retry is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
