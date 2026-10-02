# Acceptance Criteria — CAR-07 Carer — Add and edit events for a patient

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha has a shift in progress with Margaret, when she opens 'Enter event' on Margaret's Calendar, fills Title, Start time, Duration and Date, and saves, then the event appears on Margaret's Family Calendar for Helen. | MET |
| AC-02 | US-01 | permission | Given Aisha has no shift in progress with Margaret (none, not started, or already ended), when she calls the create-event action, then it is refused (`NOT_ALLOWED`) and no event is created; the same for the update action on an existing event. | MET |
| AC-03 | US-01 | permission | Given Aisha is on shift with Margaret, then 'Enter event' (Calendar toolbar and Home) and 'Edit event' (Task detail) exist and link under `/carer/patients/<id>/`, and the Patients card has no event link; given she is off shift, none exists. | MET |
| AC-04 | US-01 | happy | Given the carer Add event form, when Aisha saves with Date or Title missing, then the field shows an error and nothing is submitted; when complete, then `createEvent` is called with Margaret's client id and the form returns to the Calendar view it was opened from (else the patient's Home); Cancel creates nothing. All paths stay under `/carer/patients/<id>/`. | MET |
| AC-05 | US-02 | happy | Given Aisha opens 'Edit event' from a task's detail, then the form opens with that event's values (and the occurrence/series choice if it recurs); when she changes it and saves, then `updateEvent` is called and she returns to that task's carer Task detail; and a family-created event edited by an on-shift carer shows the change on the Family Calendar. | MET |
| AC-06 | US-01 | error | Given Aisha's shift ends while the form is open, when she saves, then the server refuses, the form keeps what she typed, no navigation happens, and "Your shift with Margaret has ended, so this event wasn't saved." shows (add and edit). | MET |
| AC-07 | US-01 | permission | Given Aisha is off shift with Margaret, when she opens `/carer/patients/<id>/events/new` or `/events/<eventId>/edit`, then she is redirected to Margaret's Calendar and no form renders; a patient she has no shift with redirects to Patients. | MET |
| AC-08 | US-03 | regression | Given Helen opens the Family Calendar, Task detail, Add event and Edit event, then they keep their `/family/<id>/` links and behaviour, with no `/carer/` link and the Add event, Edit event and cost fields as before. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
Rewritten before implementation by CHG-048 (2026-10-02): AC-01 and AC-02 reworded, AC-03 to AC-08 added (2 → 8). CAR-06 AC-07 ("no Add/Edit event link on any carer screen") is superseded for on-shift carers by AC-03.

CHG-049 (2026-10-02): AC-03's Patients card link replaced by 'Enter event' on the carer Home. All 8 MET on 2026-10-02 (component, integration and e2e on the local stack).
