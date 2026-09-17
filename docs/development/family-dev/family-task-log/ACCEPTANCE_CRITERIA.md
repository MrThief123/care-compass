# Acceptance Criteria — FAM-14 Family — Task log

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data, when the task log is loaded with no filters, then the first rows are Mon 30 Nov Morning medication (Done · Aisha R.), Physiotherapy (Planned), Afternoon check-in (Planned). | NOT MET |
| AC-02 | US-01 | happy | Given status filter Overdue, when applied, then only Weekly weigh-in (Sun 29 Nov) and Medication review (Sat 28 Nov) are listed, each with nurse '—'. | NOT MET |
| AC-03 | US-01 | empty | Given search 'Zoe', when results are empty, then 'No matches for "Zoe".' is displayed. | NOT MET |
| AC-04 | US-01 | happy | Given a row, when clicked, then the Task detail for that occurrence opens. | NOT MET |
| AC-05 | US-01 | edge | Given weekly recurring events extending forever, when the log loads, then no occurrence after today is returned. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
