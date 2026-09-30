# Acceptance Criteria — F0-21 Auth security audit

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | security | Given an admin signed in with a password only (AAL1), when they call the data API for admin-scoped tables, then RLS returns nothing and refuses writes; at AAL2 the same calls work. | NOT MET |
| AC-02 | US-03 | security | Given a signed-in session, when its cookies are inspected, then the flags are recorded; `Secure` and `SameSite` are set, and `HttpOnly` is set wherever the library allows it, with the reason written down where it cannot. | NOT MET |
| AC-03 | US-02 | permission | Given two families and two organisations, when a user from one swaps IDs to read, insert, update or delete the other's rows (every client-scoped table, plus the `/family/[clientId]` and `/admin` routes), then nothing is returned or changed. | NOT MET |
| AC-04 | US-03 | security | Given repeated wrong passwords, wrong reset requests or wrong TOTP codes, when the limit is reached, then further attempts are refused; the limits in use are recorded, and any gap in Supabase's limits is closed. | NOT MET |
| AC-05 | US-03 | security | Given the sign-in form is submitted before the page has hydrated, when it submits, then no email or password appears in the URL. | NOT MET |
| AC-06 | US-03 | happy | Given the audit is finished, when the PR is opened, then `AUDIT_REPORT.md` lists each item, its finding, evidence and status. | NOT MET |

Types: happy · validation · error · permission · empty · edge · security.
