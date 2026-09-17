# Acceptance Criteria — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given NDIS total $24,000 and expenses $9,120, when the summary runs, then remaining is 14880.00 and percent_used is 38. | NOT MET |
| AC-02 | US-01 | happy | Given Government total $3,000 and expenses $2,760, when the summary runs, then percent_used is 92 and threshold_state is 'alert' (under 70/90/100 thresholds; recalculated once OQ-03 is answered). | NOT MET |
| AC-03 | US-01 | edge | Given expenses exceed the total, when the summary runs, then remaining is negative and threshold_state is 'depleted'. | NOT MET |
| AC-04 | US-01 | validation | Given `record_expense` is called with amount 0 or -5, when executed, then it raises a validation error and nothing is inserted. | NOT MET |
| AC-05 | US-01 | permission | Given a user not linked to Margaret, when they select Margaret's buckets, then zero rows are returned. | NOT MET |
| AC-06 | US-01 | validation | Given the decimal string '12.345', when parsed by the money schema, then validation fails (max 2 decimal places). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
