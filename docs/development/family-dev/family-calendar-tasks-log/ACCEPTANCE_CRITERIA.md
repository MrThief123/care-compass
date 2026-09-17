# Acceptance Criteria — FAM-05 Family Calendar — Tasks panel and Log panel

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Physiotherapy on Mon 30 Nov is Planned, when Helen ticks it, then it shows struck through and the completion is recorded with actor Helen. | NOT MET |
| AC-02 | US-01 | error | Given the save fails, when Helen ticks a task, then the checkbox returns to unticked and an error message is shown. | NOT MET |
| AC-03 | US-01 | happy | Given the selected date is Monday 30 November, when the Tasks panel renders, then its subtitle reads 'Monday 30 November' and lists that day's occurrences. | NOT MET |
| AC-04 | US-01 | happy | Given seed data, when the Log panel renders, then it lists Morning medication (Done · Aisha R.), Evening medication (Done · Aisha R.) and Weekly weigh-in (Overdue). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
