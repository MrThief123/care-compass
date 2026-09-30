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
- Decision: the page renders a client component that calls the `enrollMfaFactor` Server Action once on mount (guarded by a ref, so React StrictMode does not double it), with loading and retry states. Each enrolment uses a unique `friendlyName` (`admin-totp-<uuid>`). Cleanup only removes unverified TOTP factors older than 5 minutes, so it cannot delete a factor another request has just created; verified factors are never touched.
- Reason: rendering must be free of side effects; a mount effect runs once per real page view. Client components already call Server Actions here (`verifyMfaCode`), so this is the same pattern, not a second one.
- Alternatives considered: unique name only (fixes the 422 but not the delete race); an explicit "Start setup" button (an extra click for no benefit); reusing a stored factor (Supabase returns the secret only once, so impossible).
- Consequences: a refresh creates a new factor and the previous one is cleaned after 5 minutes; an older tab whose factor was cleaned gets the "setup expired, reload" message.
- Human confirmation required: no (no second pattern).
- Test changes caused: none.

### FD-03 — Defect 4 (credentials in the dev server log) is Next's dev-only Server Action logger
- Date: 2026-10-01
- Context: a sign-in form submit printed the form fields in the `next dev` terminal.
- Finding: the line comes from `next/dist/server/dev/server-action-logger.js`, which only runs in development. Reproduced with a made-up user. Our auth code logs no credentials (T-15 proves it for sign-in, sign-up and the MFA actions, success and failure).
- Decision: no code change; nothing to fix in our code. Production builds do not run this logger.
- Test changes caused: none.

### FD-04 — The aal2 gate is enforced only by the app route guard, not by RLS
- Date: 2026-10-01
- Finding: no migration checks `aal` in any RLS policy. An admin session at aal1 is stopped by the route guard (AC-08, T-14), but a direct database call with that session's token is not stopped by RLS.
- Decision: not fixed here (out of F0-20 scope). Tracked as F0-21 AC-01 (CHG-041).
- Test changes caused: none.

### FD-05 — T-04 (concurrent enrol, integration) passes on the old code
- Date: 2026-10-01
- Finding: real Supabase only produced the 422 when the two requests were staggered by a particular interval, so the two-at-once integration test passes against the old code too. The fake-based T-03 uses a deterministic race and does fail on the old code.
- Decision: T-03 is the proof of the race; T-04 stays as a guard against regressions on real Supabase.
- Test changes caused: none.

## Other findings and notes
- **Pre-hydration submit (F0-21 AC-05).** A click on Sign in before the page has hydrated submits the form as a native GET and puts the email and password in the URL. Seen in dev. Not caused by F0-20; tracked as F0-21 AC-05.
- **E2E red could not run on the old code.** A build of the pre-fix code fails typechecking on the missing `./mfa-enroll-flow` import (the test-first commit does not include it), so the e2e specs have no red run against a real build. The unit, component and integration tests were red for the expected reason first.
- **Test-only fixes in our own new tests** (no product code, no existing test): `toHaveFocus` changed to `waitFor` in `mfa-enroll.test.tsx` and `mfa-verify-form.test.tsx` (focus is set after a state update); in `admin-mfa.spec.ts` the alert locator is filtered by `hasText: "isn't right"` because the Next route announcer is also `role="alert"`.
- **Unrelated integration failure (not F0-20).** `tests/integration/family-home-budget-strip.test.ts` T-02 and T-03 fail when the UTC date and the Melbourne date fall in different months (the fixture uses the UTC date for `paid_on`; `budget_today()` is Melbourne). Seen on 1 Oct 2026 early morning Melbourne time. Belongs to FAM-03; not touched.
