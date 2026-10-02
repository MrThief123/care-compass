# Acceptance Criteria — ADM-03 Admin — Deactivate staff

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-01 and AC-02 are the originals. AC-03 to AC-09 were added before implementation started, from the human's answers on 2026-10-02 (FD-01 to FD-03). "Marcus" in AC-01/AC-02 is any carer; the tests use the seed carers.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Marcus is deactivated, when he queries clients, then zero rows are returned. | NOT MET |
| AC-02 | US-01 | happy | Given Marcus completed tasks previously, when the family task log loads, then those tasks still show 'Done · Marcus C.'. | NOT MET |
| AC-03 | US-01 | happy | Given an admin deactivates a carer, when the function returns, then the carer's profile is kept with is_active false, their future shifts (every client) are cancelled, the shift running now ends now, and past shifts, already-cancelled shifts and other carers' shifts are unchanged. | NOT MET |
| AC-04 | US-01 | permission | Given a caller who is not an active admin at AAL2 of the carer's organisation (the carer, another carer, family, another organisation's admin, an admin without MFA, no session), or a target who is not a carer of that organisation, when they call admin_deactivate_staff, then it is refused (42501) and nothing changes. | NOT MET |
| AC-05 | US-01 | edge | Given a carer who is already deactivated, when an admin deactivates them again, then it succeeds and changes no shift. | NOT MET |
| AC-06 | US-01 | happy | Given a signed-in carer is deactivated, when their next request runs, then their profile is not readable as active and they are signed out (`/sign-in?reason=inactive`). | NOT MET |
| AC-07 | US-01 | happy | Given an admin opens a carer in the Staff panel, when they press Deactivate, then a dialog names the carer, says future shifts are cancelled and records are kept, does nothing on Cancel, and on Confirm calls deactivateStaff, shows a success message and moves the carer to the Inactive section. Deactivate is absent when adding staff and for an inactive carer. | NOT MET |
| AC-08 | US-01 | happy | Given some carers are inactive, when the Staff list loads, then active carers are in the main list and inactive carers are in an 'Inactive' section below it with an 'Inactive' tag; with none inactive the section is absent. | NOT MET |
| AC-09 | US-01 | error | Given deactivateStaff fails, when the admin confirms, then the carer stays in the active list, an alert says it could not be done and the dialog closes; the action itself returns VALIDATION for a blank id, NOT_FOUND for an unknown carer in mock mode and NOT_ALLOWED for a refused caller. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
