# Acceptance Criteria — FAM-UI-02 Family Calendar screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given no view param, when the calendar renders, then W is selected and '30 Nov – 6 Dec 2026' is shown. | NOT MET |
| AC-02 | US-01 | happy | Given fixtures, when the week renders, then Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4. | NOT MET |
| AC-03 | US-01 | happy | Given a user selects TUE 1, when the Tasks panel updates, then its subtitle reads 'Tuesday 1 December'. | NOT MET |
| AC-04 | US-01 | happy | Given Physiotherapy unticked, when ticked, then its label is struck through (local state). | NOT MET |
| AC-05 | US-01 | happy | Given the week view, when M is pressed, then a December 2026 month grid is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
