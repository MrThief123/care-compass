# Acceptance Criteria — CAR-06 Carer — Mark tasks done

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha has a shift in progress with Margaret, when she ticks Physiotherapy in Margaret's Calendar Tasks panel, then Margaret's Family Calendar shows Physiotherapy done by 'Aisha Rahman'. | MET |
| AC-02 | US-01 | permission | Given Aisha has no shift in progress with Margaret, when she opens Margaret's Calendar, then the tasks are listed with their status and have no checkboxes, and the View only notice shows. | MET |
| AC-03 | US-01 | error | Given the server rejects the completion, when Aisha ticks a task, then the checkbox reverts and an error is shown. | MET |
| AC-04 | US-01 | happy | Given Aisha is on shift, when she ticks a task, then it is marked done at once, `setOccurrenceDone` is called with that occurrence, and unticking it calls `setOccurrenceUndone`. | MET |
| AC-05 | US-01 | permission | Given the shift ends before the tick is sent, when the server is asked, then it refuses (42501), nothing is recorded, and the completion's actor is always the signed-in carer. | MET |
| AC-06 | US-02 | happy | Given Aisha opens Margaret's Calendar, Home or Care log, then each shows Margaret's real data and every link (view and date controls, log rows, task detail, Back) stays under `/carer/patients/<id>/`, never `/family/`. | MET |
| AC-07 | US-02 | permission | Given any carer patient screen, then there is no Add event, Edit event or Budget 'View breakdown' link, on shift or not; and the Home tab has no tick boxes. | MET |
| AC-08 | US-02 | regression | Given a family member opens the Family Home, Calendar, Care log or Task detail, then nothing changes: same links under `/family/<id>/`, the Add event and Edit event links, and tick boxes. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
Rewritten before implementation by CHG-043 (2026-10-01): AC-01 to AC-03 reworded for CHG-026 and CHG-032 (tick-off in the patient's Calendar, full names), AC-04 to AC-08 added.
