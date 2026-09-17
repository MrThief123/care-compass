# Acceptance Criteria — CAR-05 Carer — Calendar (shifts) and selected-shift tasks

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data for Aisha, when week of 30 Nov renders, then MON 30 shows blocks at 09:00, 11:30 and 15:00 labelled with 'Margaret —'. | NOT MET |
| AC-02 | US-01 | happy | Given the 09:00 block is selected, when the task panel renders, then its subtitle reads '09:00 · Margaret — Morning medication'. | NOT MET |
| AC-03 | US-01 | permission | Given Daniel's shifts exist, when Aisha's calendar loads, then none of Daniel's shifts appear. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
