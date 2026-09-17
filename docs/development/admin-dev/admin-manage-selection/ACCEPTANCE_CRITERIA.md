# Acceptance Criteria — ADM-06 Admin — Manage: staff and client selection

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha Rahman and Margaret are selected, when rendered, then both rows are solid-filled with checks and the summary reads 'Aisha Rahman → Margaret'. | NOT MET |
| AC-02 | US-01 | happy | Given a selection, when Clear is clicked, then both selections are removed. | NOT MET |
| AC-03 | US-01 | happy | Given search 'Sar' in Staff, when submitted, then only Sarah Nguyen is listed. | NOT MET |
| AC-04 | US-01 | permission | Given another organisation's staff, when the Staff column loads, then they are absent. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
