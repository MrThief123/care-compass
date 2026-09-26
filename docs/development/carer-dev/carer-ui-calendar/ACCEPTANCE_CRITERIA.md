# Acceptance Criteria — CAR-UI-03 Carer Calendar screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-01 and AC-02 were rewritten, and AC-04 to AC-10 added, by CHG-025 and CHG-030 (2026-09-26), before implementation started. The original AC-01 read "MON 30 shows blocks '09:00 Margaret — Morning m…', '11:30 Margaret — Physiother…', '15:00 Margaret — Afternoon c…'", and the original AC-02 read "Given the 09:00 block is selected, the subtitle reads '09:00 · Margaret — Morning medication' with three checklist items".

Fixtures: the carer Aisha (`staff-aisha`), today Mon 30 Nov 2026. Her shifts: Mon 30 Nov 08:00–12:00, Tue 1 Dec 09:00–11:00 and Wed 2 Dec 13:00–17:00, all with Margaret. Sarah has Mon 30 Nov 13:00–17:00 with Margaret.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures and the carer Aisha, when the week of 30 Nov renders, then there are three shift blocks, each titled 'Margaret': MON 30 '08:00–12:00', TUE 1 '09:00–11:00', WED 2 '13:00–17:00'; no status pill, no event title, and not Sarah's shift. | MET |
| AC-02 | US-01 | happy | Given fixtures, when rendered, then there is no 'Tasks for the selected shift' panel and no checkbox. | MET |
| AC-03 | US-01 | happy | Given no view param, when rendered, then W is selected, the 'Shifts' heading shows, and the week of today is read (30 Nov – 6 Dec). | MET |
| AC-04 | US-01 | happy | Given a shift block, when it is clicked, then the app goes to `/carer/patients/<clientId>` (Margaret's patient page). | MET |
| AC-05 | US-01 | happy | Given `?view=day&date=2026-12-01`, then D is selected and one block 'Margaret' '09:00–11:00' shows; given `?view=month&month=2026-12`, then M is selected and the 30 Nov, 1 Dec and 2 Dec cells each show a 'Margaret' chip. | MET |
| AC-06 | US-01 | happy | Given the week of 30 Nov, when Next week, Previous week, Today or M is pressed, then the URL becomes `/carer/calendar?view=week&date=2026-12-07`, `…date=2026-11-23`, `…date=2026-11-30`, and `…view=month&date=2026-11-30&month=2026-12` respectively. | MET |
| AC-07 | US-01 | happy | Given the mock data source, `getCarerShifts(carerId, {from, to})` returns only that carer's shifts starting on those Melbourne days, earliest first, with `clientFirstName`; an unknown carer gets `[]`; an invalid range rejects. | MET |
| AC-08 | US-01 | edge | Given the carer has no shifts in the visible range, then 'No shifts' shows, and the D/W/M and arrows are still there. | MET |
| AC-09 | US-01 | error | Given a contract query rejects, then the States-sheet error state shows, 'Try again' re-runs the route (router refresh), and the error log holds no message text (no PII); given the route is loading, then a skeleton announces 'Loading' and shows no data. | MET |
| AC-10 | US-01 | a11y | Given the populated, empty, error and loading states, then axe reports no violations. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
