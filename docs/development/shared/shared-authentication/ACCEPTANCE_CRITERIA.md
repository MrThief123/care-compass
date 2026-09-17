# Acceptance Criteria — F0-07 Sign-in, sign-out, password reset and role-based routing

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen has an active family account linked to Margaret, when she signs in with correct credentials, then she lands on `/family/<Margaret id>/home`. | NOT MET |
| AC-02 | US-01 | error | Given incorrect credentials, when sign-in is submitted, then a generic error is shown and no session cookie is set. | NOT MET |
| AC-03 | US-02 | happy | Given Aisha (carer) signs in, when sign-in succeeds, then she lands on `/carer/home`. | NOT MET |
| AC-04 | US-02 | permission | Given Aisha is signed in, when she requests `/admin/home`, then the server redirects her to `/carer/home`. | NOT MET |
| AC-05 | US-02 | permission | Given no session, when `/family/<id>/home` is requested, then the response redirects to `/sign-in`. | NOT MET |
| AC-06 | US-02 | permission | Given Aisha's profile is deactivated, when she makes her next request, then she is signed out and sees the withdrawn-access message. | NOT MET |
| AC-07 | US-03 | happy | Given a registered email, when a reset is requested, then Supabase sends a reset email and the page confirms 'We'll email you a secure link'. | NOT MET |
| AC-08 | US-03 | edge | Given an unregistered email, when a reset is requested, then the same confirmation is shown (no enumeration). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
