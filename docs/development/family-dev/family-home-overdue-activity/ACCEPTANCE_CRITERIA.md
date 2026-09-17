# Acceptance Criteria — FAM-02 Family Home — Overdue card and Recent activity

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given 3 overdue occurrences, when the Overdue card renders, then the badge shows '3' and three rows each show an 'Overdue' pill with warning icon. | NOT MET |
| AC-02 | US-01 | empty | Given no overdue occurrences, when the card renders, then 'All caught up' and 'There are no overdue tasks right now.' are shown. | NOT MET |
| AC-03 | US-01 | happy | Given the seed data, when Recent activity is queried, then exactly 5 items are returned ordered Mon 30 Nov, Sun 29 Nov, Sun 29 Nov, Sat 28 Nov, Sat 28 Nov. | NOT MET |
| AC-04 | US-01 | happy | Given FAM-14 is available, when 'View all' is clicked, then the user navigates to `/family/<clientId>/tasks`. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
