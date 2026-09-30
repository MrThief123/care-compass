# F0-20 — Admin TOTP MFA hardening

| Field | Value |
|---|---|
| Feature ID | F0-20 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — shared foundations (added after F0-07 and F0-17) |
| PR target | `main` (CHG-036) |
| Feature branch | `feature/shared-admin-mfa-hardening` |
| Documentation | `docs/development/shared/shared-admin-mfa-hardening/` |
| Jira | — |
| Status | See PROGRESS.md |

## Purpose
Admin TOTP MFA (F0-07 AC-09/AC-10) works reliably and is covered by tests, from unit level to a real browser.

## Problem
Hand-testing on 2026-09-30 found four defects: (1) the QR code does not render; (2) enrolment fails with "Couldn't start MFA enrollment" because the enrol page enrols as a side effect of every server render, and renders overlap; (3) the 6-digit field keeps its text after a failed attempt, so a retry sends "881452881452"; (4) the dev server log prints the sign-in email and password. CHG-040 keeps MFA and reverses the earlier "remove it" note (PD-040, CHG-010).

## Description
Keep the mandatory admin gate exactly as F0-07 defined it and fix the four defects, with a test suite that proves the path works consistently.

## User value
An admin can set up and use two-factor sign-in first time, every time.

## Users
- Admin (gated). Family and carer are never gated (CHG-040).

## Scope
- QR image renders from Supabase's `qr_code` value (already a `data:` URI) and from raw SVG markup.
- Enrolment starts once from the client (a Server Action called on mount, guarded so it runs once), not as a side effect of rendering `/mfa/enroll`. Each enrolment gets a unique friendly name.
- Stale unverified factors are cleaned up without deleting a factor another request has just created.
- The code field clears after a failed attempt on both enrol and verify; the error stays announced to assistive tech.
- Clear message when the factor no longer exists or the code expired.
- Confirm whether the credentials in the dev log come from Next's Server Action logging, and that none of our code logs credentials.
- Tests: unit, component, server-action (mocked Supabase), integration (local Supabase, real TOTP), Playwright e2e, each run 10 times.

## Out of Scope
- Optional MFA, MFA for family or carer, backup or recovery codes, MFA reset by an admin, phone/SMS factors, an MFA settings screen (all parked; none planned).
- Removing the gate (cancelled by CHG-040).

## Functional Requirements
- Unchanged routing: admin with no verified TOTP factor goes to `/mfa/enroll`; admin below AAL2 goes to `/mfa/verify`; success goes to `/admin/home`.
- Two enrolments at the same time both succeed with different factor names and never show an error.
- Verify with a wrong, expired or missing-factor case returns a clear message, never a thrown error.

## UI / UX Requirements
- Existing enrol and verify cards (F0-07); a loading state while the enrolment starts; error state with a retry if it fails; tokens only; 44×44px targets; error is `role="alert"`.

## Dependencies
- Features: F0-07, F0-17 (both merged)
- Blocking open decisions: None (CHG-040 answered the policy question)
- Non-blocking open decisions: None

## Inputs
- 6-digit TOTP code; the signed-in admin's session.

## Outputs
- Verified factor and an AAL2 session; redirect to `/admin/home`.

## Error / Edge Cases
- Enrolment fails (network or Supabase error): message with a retry button.
- Two tabs open: the older tab's factor may be cleaned up; its verify says the setup expired and to reload.
- Expired code (TOTP 30 s window): same message as a wrong code.

## Security / Permissions
- Admin only is gated; RLS unchanged. AAL1 admin sessions cannot read admin data routes. No credentials, codes or secrets in our logs (CLAUDE.md §7).

## Technical Considerations
- `enrollMfaFactor` is already a Server Action, and forms already call `verifyMfaCode` from the client, so calling enrolment from a client component is the same pattern, not a second one (FD-02).
- Test-only TOTP helper (RFC 6238, SHA-1, 30 s, 6 digits) in `tests/helpers/totp.ts`; no new dependency.
- Integration and e2e run only against local Supabase (`supabase status -o env` values in the shell; `.env.local` is the hosted project).
