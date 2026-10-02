# Acceptance Criteria — ADM-09 Admin — Edit, extend or cancel a shift

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-01 is the original. AC-02 to AC-09 were added before implementation started, from the human's answers on 2026-10-03 (FD-01 to FD-05) and PD-053. Per CLAUDE.md §9 this records answered decisions.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a 07:00–11:00 shift extended to 13:00, when `carer_on_active_shift` runs at 12:00 as Aisha, then it returns true. | MET |
| AC-02 | US-01 | permission | Given a shift that has not ended, when an admin of its organisation (AAL2) changes its start, end or carer (an active carer of that organisation), then the row is updated and an `audit_log` UPDATE row records before and after and the admin; when the carer, family, another organisation's admin, an admin at AAL1 or no session tries, then nothing changes. | MET |
| AC-03 | US-02 | happy | Given a shift that has not ended, when an admin cancels it, then `cancelled_at` is set, the row is kept, `carer_on_active_shift` is false for it, and the audit log records the change. | MET |
| AC-04 | US-03 | edge | Given a shift that has ended or is cancelled, when an admin tries to change or cancel it, or to move the end of a live shift into the past, or to clear `cancelled_at`, then nothing changes. | MET |
| AC-05 | US-01 | permission | Given an admin editing a shift, when they set the carer to a deactivated carer or one of another organisation, or change the client, then it is refused and the shift is unchanged. | MET |
| AC-06 | US-01 | error | Given `updateShift` and `cancelShift` (mock mode), when called with a blank id, a malformed time, or an end not after the start, then VALIDATION with the shared message and field errors; an unknown id returns NOT_FOUND; a valid call returns the shift with new times (same date) or the cancelled id, and persists nothing. | MET |
| AC-07 | US-01 | happy | Given a signed-in admin on the local stack, when `updateShift` runs, then the stored times are the Melbourne times on the shift's own date, `getAdminManage` shows them, an ended shift returns NOT_FOUND, an other-organisation admin is refused, and overlapping another shift is not blocked. `cancelShift` likewise sets `cancelled_at` and `getAdminManage` no longer lists it. | MET |
| AC-08 | US-01, US-03 | happy | Given Manage with shifts on the selected day, when it renders, then Edit and Cancel buttons appear only on shifts with `editable` true; Edit opens a panel pre-filled with the shift's carer, start and end and the fixed date; Save calls `updateShift` with exactly those values, the row and date dots update and a status message shows; the overlap warning names the carer's other overlapping shift and never the shift being edited; an end before the start shows the time error and calls nothing; a failed save shows the server's message and keeps the old times. | MET |
| AC-09 | US-02 | happy | Given an editable shift, when the admin presses Cancel, then a dialog names carer, client, date and times; Keep shift closes it and calls nothing; Cancel shift calls `cancelShift`, removes the row and the date's dot (if it was the last that day) and shows a status message; a failure shows an alert and keeps the shift. The panel passes axe with the dialog open. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
