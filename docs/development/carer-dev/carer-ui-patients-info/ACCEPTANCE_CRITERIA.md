# Acceptance Criteria — CAR-UI-02 Carer Patients and patient info screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-04 reworded and AC-05 to AC-12 added by CHG-028 (human, 2026-09-26). AC-03 and AC-07 reworded and AC-14, AC-15 added by CHG-029 (human, 2026-09-26). The reference "now" is Mon 30 Nov 2026 09:00 Melbourne time. Aisha is on shift with Margaret (08:00–12:00) and has only future shifts with the other six patients.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Patients renders, then 7 cards appear in the order Margaret, Robert, Elsie, Frank, Doris, Harold, Jean, including 'Margaret' '78 years · Preston VIC' and 'Jean' '88 years · Fairfield VIC'. | MET |
| AC-02 | US-01 | empty | Given no patients, when rendered, then 'No patients assigned yet' is shown and no search field appears. | MET |
| AC-03 | US-01 | happy | Given a card for Margaret, when clicked, then the patient page for Margaret opens (`/carer/patients/client-margaret`, which goes to the Home tab). | MET |
| AC-04 | US-01 | permission | Given the carer is not on shift with the patient, when patient Info renders, then no Edit button and no 'Add file' control exist. | MET |
| AC-05 | US-01 | permission | Given the carer is on shift with Margaret, when patient Info renders, then 'Edit Description', 'Edit Habits', 'Edit Medical history' and 'Add file' are present. | MET |
| AC-06 | US-01 | happy | Given Patients, when the carer types 'je' in 'Search patients', then only Jean's card shows; when they type 'zz', then no cards show and the no-results message names 'zz'. | MET |
| AC-07 | US-01 | happy | Given a patient page, when it renders, then it shows a 'Back to patients' link to `/carer/patients`, the name 'Margaret' with '78 years · Preston VIC', and tabs Home, Info, Calendar, Care log linking to `/carer/patients/client-margaret/{home,info,calendar,tasks}`, the current tab marked `aria-current="page"`. | MET |
| AC-08 | US-01 | happy | Given the Home, Calendar or Care log tab, when it renders, then it shows 'Coming soon' and no controls. | MET |
| AC-09 | US-01 | permission | Given a patient the carer can't see (not in their patients list), when their patient page is opened, then Next.js not-found is triggered. | MET |
| AC-10 | US-01 | error | Given the patients read or the Info read rejects, when the screen renders, then 'Something went wrong' and a 'Try again' button show, and the log line carries no client data. | MET |
| AC-11 | US-01 | loading | Given the Patients or Info route is loading, when the skeleton renders, then it announces 'Loading' and holds no data. | MET |
| AC-12 | US-01 | a11y | Given Patients (populated, empty, error, loading) and patient Info, when rendered, then axe finds no violations. | MET |
| AC-13 | US-01 | contract | Given fixtures, `getCarerPatients('staff-aisha')` returns the 7 patients with `onShift` true for Margaret only; an unknown carer gets `[]`; a carer whose only shift has ended gets `[]`. | MET |
| AC-14 | US-01 | permission | Given the carer is not on shift with Robert, when patient Info renders, then a 'View only' notice says they can edit Robert's information once their shift with him starts; on shift with Margaret, no 'View only' notice shows. | MET |
| AC-15 | US-01 | permission | Given fixtures, when Patients renders, then Margaret's card reads 'On shift · can edit' and each of the other six reads 'View only', as text; axe finds no violations. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
