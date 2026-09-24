# Acceptance Criteria — F0-07 Sign-in, sign-out, password reset and role-based routing

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen has an active family account linked to Margaret, when she signs in with correct credentials, then she lands on `/family/<Margaret id>/home`. | MET |
| AC-02 | US-01 | error | Given incorrect credentials, when sign-in is submitted, then a generic error is shown and no session cookie is set. | MET |
| AC-03 | US-02 | happy | Given Aisha (carer) signs in, when sign-in succeeds, then she lands on `/carer/home`. | MET |
| AC-04 | US-02 | permission | Given Aisha is signed in, when she requests `/admin/home`, then the server redirects her to `/carer/home`. | MET |
| AC-05 | US-02 | permission | Given no session, when `/family/<id>/home` is requested, then the response redirects to `/sign-in`. | MET |
| AC-06 | US-02 | permission | Given Aisha's profile is deactivated, when she makes her next request, then she is signed out and sees the withdrawn-access message. | MET |
| AC-07 | US-03 | happy | Given a registered email, when a reset is requested, then Supabase sends a reset email and the page confirms 'We'll email you a secure link'. | MET |
| AC-08 | US-03 | edge | Given an unregistered email, when a reset is requested, then the same confirmation is shown (no enumeration). | MET |
| AC-09 | US-02 | happy | Given Priya (admin) has no enrolled TOTP factor, when she signs in with correct credentials, then she is routed to MFA enrollment before reaching `/admin/home`. | MET |
| AC-10 | US-02 | permission | Given Priya has a verified TOTP factor, when she signs in and enters an incorrect code at the MFA challenge, then access to `/admin/home` is refused and a generic error is shown; a correct code grants access. | MET |

AC-09 and AC-10 added 2026-09-22 (CHG-001, see DECISIONS.md) — OQ-08 answered TOTP MFA required for admins, and the human confirmed implementing it in this feature rather than deferring it.

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
