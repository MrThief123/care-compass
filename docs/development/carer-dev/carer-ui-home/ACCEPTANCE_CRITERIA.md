# Acceptance Criteria — CAR-UI-01 Carer Home screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-01 and AC-02 were rewritten, and AC-04 to AC-10 added, by CHG-025 (2026-09-26), before implementation started. The original AC-01 read "Today's calendar shows 09:00, 11:30 and 15:00 rows for Margaret with Done/Planned/Planned pills".

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures and the carer Aisha, when Carer Home renders, then 'Today's calendar' shows one row, '08:00–12:00' with 'Margaret', and no status pill or event title. | NOT MET |
| AC-02 | US-01 | happy | Given fixtures, when rendered, then Notifications include 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' with an 'Admin' chip. | NOT MET |
| AC-03 | US-01 | happy | Given the Carer header, when rendered, then a bell button is present. | NOT MET |
| AC-04 | US-01 | happy | Given fixtures, when rendered, then there is no 'Tasks' card and no checkbox on the screen. | NOT MET |
| AC-05 | US-01 | happy | Given fixtures, when rendered, then 'Notifications' sits beside 'Today's calendar' in the same row (calendar first), not below it. | NOT MET |
| AC-06 | US-01 | happy | Given fixtures, when rendered, then every notification is a shift assigned, changed or cancelled notification naming the client, newest first, each with the 'Admin' chip; no 'Family' chip appears. | NOT MET |
| AC-07 | US-01 | edge | Given the carer has no shifts today, then 'Today's calendar' shows 'No shifts today'; given no notifications, then 'Notifications' shows 'No notifications'. | NOT MET |
| AC-08 | US-01 | error | Given either contract query rejects, then the screen shows the States-sheet error state, and 'Try again' re-runs the route (router refresh); the error log holds no message text (no PII). | NOT MET |
| AC-09 | US-01 | happy | Given the route is loading, then a skeleton announces 'Loading' and shows no data. | NOT MET |
| AC-10 | US-01 | a11y | Given the populated, empty, error and loading states, then axe reports no violations. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
