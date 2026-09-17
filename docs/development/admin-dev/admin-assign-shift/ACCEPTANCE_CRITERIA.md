# Acceptance Criteria — ADM-07 Admin — Assign shift

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha and Margaret selected, date 1 Dec 2026 and slot 07:00–11:00, when Assign shift is clicked, then a shift 07:00–11:00 on 1 Dec exists and a dot appears on 1 Dec. | NOT MET |
| AC-02 | US-01 | happy | Given an overlapping existing shift 11:30–13:00 and selected slot 11:00–15:00, when the slot is chosen, then the warning names 11:30–13:00 and Assign shift remains available. | NOT MET |
| AC-03 | US-01 | validation | Given Custom with end 10:00 before start 12:00, when Assign is pressed, then a time error is shown. | NOT MET |
| AC-04 | US-01 | happy | Given the panel, when rendered, then no Repeat control exists. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
