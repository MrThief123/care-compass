# Acceptance Criteria — F0-20 Admin TOTP MFA hardening

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the enrol page has a QR value that is a `data:` URI or raw SVG, when it renders in a browser, then the image loads (non-zero natural size) and the manual key is shown. | NOT MET |
| AC-02 | US-01 | edge | Given two enrolments start at the same time for one admin, when both complete, then both succeed with different factor names and no error is shown. | NOT MET |
| AC-03 | US-01 | edge | Given an unverified factor older than the cleanup age exists, when a new enrolment starts, then the old one is removed and a factor created a moment earlier by another request is kept. | NOT MET |
| AC-04 | US-01 | happy | Given `/mfa/enroll` is rendered on the server (any number of times), when it renders, then no factor is created; enrolment happens once when the page mounts in the browser, and a failure shows a message and a retry. | NOT MET |
| AC-05 | US-02 | validation | Given a wrong code was submitted on enrol or verify, when the error appears, then the code field is empty and focused, the error is announced (`role="alert"`), and a retry sends only the new digits. | NOT MET |
| AC-06 | US-02 | error | Given a verify attempt, when the code is wrong or expired, then a clear "isn't right" message is returned; when the factor no longer exists, then a clear "setup expired, reload" message is returned; a correct code succeeds; nothing throws. | NOT MET |
| AC-07 | US-01 | happy | Given a new admin, when they sign in, enrol with a code from the manual key, sign out, sign in again and enter a fresh code, then they land on `/admin/home` both times (enrol, then verify). | NOT MET |
| AC-08 | US-03 | permission | Given an admin session at AAL1 with a verified factor, when it requests an admin route, then it is redirected to `/mfa/verify`; family and carer sessions are never sent to an MFA route; unenrolling the factor sends the admin back to `/mfa/enroll`. | NOT MET |
| AC-09 | US-03 | security | Given the sign-in, sign-up and MFA actions run, when they succeed or fail, then none of our code writes the email, password, TOTP code or secret to any log; the Next dev "signIn({...})" line is confirmed as framework Server Action logging (dev only) and recorded. | NOT MET |

Types: happy · validation · error · permission · empty · edge · security.
