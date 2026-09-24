# Acceptance Criteria — FAM-UI-04 Family Info screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order with the design text. | MET |
| AC-02 | US-01 | happy | Given Habits, when Edit is clicked, then a textarea with the current text and Save/Cancel appears. | MET |
| AC-03 | US-01 | happy | Given Documentation, when rendered, then tiles 'Care plan.pdf', 'Medication schedule.pdf' and 'Add file' are shown. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
