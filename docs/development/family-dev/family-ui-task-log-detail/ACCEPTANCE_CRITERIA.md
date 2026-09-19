# Acceptance Criteria — FAM-UI-07 Family Task log and Task detail screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Task log renders, then 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha Rahman · Done · Aisha Rahman' (full names per PD-038, see DECISIONS.md FD-01; the design shows 'Aisha R.'). | BLOCKED (FD-02: shared fixtures lack the design's rows; proven on design-matching rows, not yet on shared fixtures) |
| AC-02 | US-01 | happy | Given status filter Overdue, when applied, then only Weekly weigh-in and Medication review remain, each with nurse '—'. | BLOCKED (FD-02: shared fixtures lack the design's rows; proven on design-matching rows, not yet on shared fixtures) |
| AC-03 | US-01 | empty | Given search 'Zoe', when applied, then 'No matches for "Zoe".' is shown. | MET |
| AC-04 | US-01 | happy | Given the Morning medication detail, when rendered, then 'Done · Aisha Rahman' and 'Completed at 09:14' are shown (full name per PD-038, see DECISIONS.md FD-01). | BLOCKED (FD-02: shared fixture says 'Completed at 09:05'; proven with 09:14 on design-matching data) |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
