# Decisions — INT-02 End-to-end: organisation transfer journey

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-06 | Organisation change model | YES | Family-initiated change per the latest design; Admin 'Remove' detaches without deleting. Picker design required. |
| OQ-15 | Incoming organisation's visibility of history | YES | Incoming organisation sees full history, labelled with the organisation that recorded it. |

## Feature decisions log

### FD-01 — Run Playwright on a dedicated port (`E2E_PORT`), never the default 3000
- Date: 2026-10-01
- Context: port 3000 had another `npm run dev` already listening (not started by this session). `playwright.config.ts`'s `reuseExistingServer: !process.env.CI` silently attached to it instead of starting a fresh build, and that dev server (pointed at the hosted project, mid some other work) produced a confusing symptom: clicking "Sign in" fell back to a native GET form submission and every `waitForURL` hung forever with no error — nothing about this pointed at "wrong server" directly.
- Decision: always pass `E2E_PORT=3101` (or any free, dedicated port) when running this spec locally, never the bare default. Did not stop or touch the process on port 3000.
- Reason: that process is someone else's session, not this test's to manage; `E2E_PORT` already exists for exactly this (`admin-mfa.spec.ts`'s own header comment documents the same escape hatch).
- Alternatives considered: killing whatever was on port 3000 — rejected, not this test's process to kill.
- Consequences: none for the test itself; a reader running this spec without `E2E_PORT` on a machine with something already on 3000 could hit the same confusing hang. Worth a header comment (added) rather than a DEVELOPMENT_WORKFLOW.md change, since this is a general Playwright/port fact, not specific to this feature.
- Human confirmation required: no (informational)
- Test changes caused: none

### FD-02 — Seeded admins pre-enrol and pre-verify a TOTP factor via the API before the journey starts
- Date: 2026-10-01
- Context: F0-07's forced admin TOTP enrolment is live on `main` (F0-20's hardening, which would relax this, is not yet merged). An admin's sign-in always redirects to `/mfa/enroll` the first time, and to `/mfa/verify` (a fresh code) on every sign-in after a factor exists. INT-02's two admins (Priya, Omar) need to reach `/admin/clients`, not an MFA screen.
- Decision: each seeded admin signs in once via the API and completes TOTP enrol + verify (`tests/helpers/totp.ts`'s `totpCode()`, the same technique `admin-mfa.spec.ts` uses) before the Playwright journey begins; the shared `signIn()` helper also completes the sign-in-time challenge (computing a fresh code) if the UI sign-in lands on `/mfa/verify`.
- Reason: MFA mechanics are F0-20's own feature with its own e2e coverage; INT-02 is about the transfer, not about re-testing TOTP. Pre-enrolling via the API keeps the journey test focused and fast.
- Alternatives considered: driving the QR-code enrolment screen in the UI for both admins — rejected as unnecessary UI surface for what this feature is verifying, and slower.
- Consequences: if F0-20 changes the MFA flow's shape (e.g. different gate timing), this test's `signIn()`/`enrolAdminTotp()` may need a matching update. None expected to be urgent, flagging for awareness only.
- Human confirmation required: no (informational)
- Test changes caused: none

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
