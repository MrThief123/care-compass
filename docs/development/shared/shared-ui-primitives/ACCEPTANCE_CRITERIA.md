# Acceptance Criteria — F0-14 Core UI primitives and state components

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a done occurrence completed by Aisha Rahman, when the Status pill renders, then its text reads 'Done · Aisha R.' and includes a check icon. | NOT MET |
| AC-02 | US-01 | happy | Given an overdue occurrence, when the Status pill renders, then it shows a warning icon and the text 'Overdue'. | NOT MET |
| AC-03 | US-01 | happy | Given a Search field with query 'Zoe' and no results, when rendered in no-results state, then the text 'No matches for "Zoe".' is shown. | NOT MET |
| AC-04 | US-01 | error | Given ErrorState with an onRetry handler, when Retry is clicked, then the handler is called once. | NOT MET |
| AC-05 | US-01 | happy | Given each primitive, when checked with axe, then no violations are reported. | NOT MET |
| AC-06 | US-01 | happy | Given a Segmented control with no value prop, when rendered, then 'W' is selected. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
