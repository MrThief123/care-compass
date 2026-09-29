# Acceptance Criteria — FAM-03 Family Home — Budget strip

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed budgets, when the strip renders, then the aggregate line reads '$17,870 remaining of $32,000 · 44% used'. | MET (component: FAM-UI-01; Supabase wiring proven via AC-02/AC-03) |
| AC-02 | US-01 | happy | Given Government at 92% used, when its card renders, then it uses the alert tone, shows a warning icon and '$240' 'of $3,000 · 92% used'. | MET |
| AC-03 | US-01 | happy | Given NDIS at 38%, when its card renders, then it uses the normal tone and shows '$14,880' 'of $24,000 · 38% used'. | MET |
| AC-04 | US-01 | empty | Given no buckets exist, when the strip renders, then the no-funding empty state is shown. | MET (component: FAM-UI-01; Supabase wiring: a client with no rows returns `[]`) |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
