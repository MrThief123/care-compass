# Test Plan — F0-24 Auth emails: working reset and invite links, set-password page

## Approach
Tests first (TESTING.md §2); confirm each fails for the expected reason before implementing. Test titles start `[F0-24][AC-xx]`. Email tests read the local Mailpit at `http://127.0.0.1:54324/api/v1` and use the local stack only, never the hosted project from `.env.local`.

## Test levels used
- **unit** → Vitest: confirm route (code, token_hash, missing, tampered, off-site `next`), resend-invite action (stubbed clients)
- **component** → Vitest render of `/set-password` and the Resend invite button
- **integration** → local Supabase: real recovery and invite emails, links parsed from Mailpit
- **e2e** → Playwright against the local stack and Mailpit

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Request a reset, open the emailed link, set a new password, sign in; old password refused. | Yes | PASS (e2e, local stack) |
| T-02 | AC-02 | unit + integration | Used twice, expired, tampered, no token → expired-link redirect and no session. | Yes | PASS (unit + integration) |
| T-03 | AC-03 | e2e | Admin invites a carer, carer follows the emailed link, sets a password, lands on `/carer/home`. | Yes | PASS (e2e, local stack) |
| T-04 | AC-04 | integration | Invite an existing email: no new user, no email. | Yes | PASS (integration) |
| T-05 | AC-05 | integration + component | Resend as same-org admin sends one email; refused for signed-in carer, other-org admin, carer, family. Button shows only before first sign-in. | Yes | PASS (integration for the email send; unit for the action's permission checks; component for the button) |
| T-06 | AC-06 | unit | Same response for registered and unregistered; off-site `next` ignored (extends the F0-21 tests). | Yes | PASS (unit + integration) |
| T-07 | AC-07 | review | Templates, config, `.env.example` and the checklist exist; human ticks the hosted items. | No | Pending the human (hosted checklist) |

## Regression
`vitest run`, `supabase test db`, auth e2e specs (`auth.spec.ts`, `sign-up.spec.ts`, `auth-hardening.spec.ts`, `admin-mfa.spec.ts`) must stay green.
