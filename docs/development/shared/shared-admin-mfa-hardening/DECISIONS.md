# Decisions — F0-20 Admin TOTP MFA hardening

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| — | None open. Policy answered by CHG-040. | no | — |

## Feature decisions log

### FD-01 — Admin MFA stays mandatory; family and carer never get it
- Date: 2026-09-30
- Context: PD-040 and CHG-010 said MFA is not mandatory and the forced admin gate should be removed.
- Decision: root CHG-040 (human-confirmed, Dhruv Verma, 2026-09-30) supersedes both: mandatory for admins, never for family or carer.
- Reason: human wants 2FA kept and reliable; matches OQ-08's original answer.
- Alternatives considered: optional admin MFA (more work, new settings UI); MFA for all roles (much larger).
- Consequences: F0-07 AC-09/AC-10 and T-09/T-10 stay as they are.
- Human confirmation required: done.
- Test changes caused: none.

### FD-02 — Enrol from the client once, not during server render
- Date: 2026-09-30
- Context: `/mfa/enroll` called `enrollMfaFactor()` in the server component. The page renders 2 to 5 times per sign-in, so concurrent renders raced (422 `mfa_factor_name_conflict`), and a later render deleted the factor an earlier render had shown ("404 Factor not found" on challenge).
- Decision: the page renders a client component that calls the `enrollMfaFactor` Server Action once on mount (guarded by a ref, so React StrictMode does not double it), with loading and retry states. Each enrolment uses a unique `friendlyName` (`admin-totp-<uuid>`). Cleanup only removes unverified TOTP factors older than 60 seconds, so it cannot delete a factor another request has just created; verified factors are never touched.
- Reason: rendering must be free of side effects; a mount effect runs once per real page view. Client components already call Server Actions here (`verifyMfaCode`), so this is the same pattern, not a second one.
- Alternatives considered: unique name only (fixes the 422 but not the delete race); an explicit "Start setup" button (an extra click for no benefit); reusing a stored factor (Supabase returns the secret only once, so impossible).
- Consequences: a refresh creates a new factor and the previous one is cleaned after 60 s; an older tab whose factor was cleaned gets the "setup expired, reload" message.
- Human confirmation required: no (no second pattern).
- Test changes caused: none.
