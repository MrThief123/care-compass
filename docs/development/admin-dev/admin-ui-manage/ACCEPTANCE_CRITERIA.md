# Acceptance Criteria — ADM-UI-02 Admin Manage screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha Rahman and Margaret selected, when rendered, then both rows are selected and the summary reads 'Aisha Rahman → Margaret'. | MET |
| AC-02 | US-01 | happy | Given Clear is clicked, when rendered, then no rows are selected. | MET |
| AC-03 | US-01 | happy | Given fixture shift 11:30–13:00 and slot 11:00–15:00 selected, when rendered, then the warning mentions 11:30–13:00 and Assign shift remains enabled. | MET |
| AC-04 | US-01 | happy | Given the panel, when rendered, then no Repeat control exists. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
