# Acceptance Criteria — CAR-09 Carer — Settings

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha's profile in Supabase, when Settings renders, then Name 'Aisha Rahman', Phone '0423 987 654', Email 'aisha.r@banksiahomecare.com.au', Role 'Registered Nurse' are shown. | NOT MET |
| AC-02 | US-01 | permission | Given Aisha, when she updates her own job_title (or role, organisation or active flag), then RLS/column privileges reject it, and nothing about her row changes. | NOT MET |
| AC-03 | US-01 | happy | Given Reset clicked, when the action runs, then a reset email is requested for her login address, and the screen says so. When it fails, the screen says it could not send and does not claim it was sent. | NOT MET |
| AC-04 | US-01 | happy | Given Aisha edits her name, phone or email and clicks Save, when the action runs, then the values are stored on her own profile row only (never job_title or address), 'Saved.' shows, and a reload shows the new values. The login email is unchanged (PD-054). | NOT MET |
| AC-05 | US-01 | error | Given an invalid Name, phone or email, when Save is clicked, then the server rejects it with a message on that field and writes nothing. Given the save fails, then the fields stay editable with what she typed, and an error is announced. | NOT MET |

AC-04 and AC-05 are added before implementation (FD-01): PD-054 requires a per-card Save, and CAR-UI-04 FD-06 left wiring it to this feature.

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
