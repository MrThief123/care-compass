# Acceptance Criteria — FAM-15 Family — Task detail

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

Rewritten at start (2026-09-30, FD-04): full names (CHG-032), AC-03 uses the seed's real Overdue row, and AC-05 to AC-08 added for plain events (CHG-009), cancelled-after-completion and the entry points.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Morning medication on 30 Nov done by Aisha Rahman at 09:14, when Task detail renders, then it shows 'Done · Aisha Rahman' and 'Completed at 09:14'. | MET |
| AC-02 | US-01 | happy | Given the task, when rendered, then the subline reads 'Monday 30 November 2026 · Assigned to Aisha Rahman'. Against real data the assignee is the carer whose shift covers the start, the actor once Done, and '—' when no shift covers it (PD-055). | MET |
| AC-03 | US-01 | happy | Given the Overdue card on Home, when the chevron on 'Weekly weigh-in' is clicked, then its Task detail opens showing the Overdue pill and 'Assigned to —'. | MET |
| AC-04 | US-01 | validation | Given an occurrence key for Robert's event under Margaret's route, or an unknown key, when requested, then a not-found page is returned. | MET |
| AC-05 | US-01 | happy | Given a plain event ('Afternoon walk'), when Task detail renders, then the Status card reads 'Event · No tick-off needed' with no status pill and no 'Completed at', and Back follows the origin (CHG-009, FD-02). | MET |
| AC-06 | US-01 | happy | Given a plain event in the database, when its key is requested under its own client, then it opens; under another client it is not found. | MET |
| AC-07 | US-01 | edge | Given an occurrence that was completed and then cancelled, when its key is requested, then Task detail still opens with status Done (FD-03). | MET |
| AC-08 | US-01 | happy | Given Recent activity on Home, the Log panel on the Calendar and a Task log row, when each is clicked, then the matching Task detail opens and Back returns to that origin. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
