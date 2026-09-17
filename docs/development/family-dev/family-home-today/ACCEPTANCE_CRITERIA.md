# Acceptance Criteria — FAM-01 Family Home — Today day-view timeline

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Morning medication 09:00 1 hr done by Aisha Rahman, when the Today panel renders, then a block at 09:00 shows 'Morning medication', 'Aisha R.', '1 hr' and pill 'Done · Aisha R.'. | NOT MET |
| AC-02 | US-01 | happy | Given Physiotherapy 11:30 lasting 90 minutes and not yet done, when rendered, then its block spans 11:30–13:00, shows '1 hr 30 min' and pill 'Planned'. | NOT MET |
| AC-03 | US-01 | happy | Given events at 09:00 (60 min) and 11:30 (90 min), when `positionBlocks` runs with 44px rows from 07:00, then tops are 88px and 198px and heights 44px and 66px. | NOT MET |
| AC-04 | US-01 | empty | Given no occurrences today, when rendered, then the empty state is shown instead of blocks. | NOT MET |
| AC-05 | US-01 | permission | Given Helen requests `/family/<Robert id>/home`, when the server renders, then she is redirected and Robert's data is not fetched. | NOT MET |
| AC-06 | US-01 | error | Given the occurrence query fails, when rendered, then ErrorState with Retry is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
