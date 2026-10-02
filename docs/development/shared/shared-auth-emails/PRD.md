# F0-24 — Auth emails: working reset and invite links, set-password page

| Field | Value |
|---|---|
| Feature ID | F0-24 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (with small Admin and auth-page changes) |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/shared-auth-emails` |
| Documentation | `docs/development/shared/shared-auth-emails/` |
| Lane | S — Shared |
| Sprint | SPRINT · planned D15–D16 |
| Status / owner | See PROGRESS.md |

> **Added by CHG-047, 2026-10-02.** Found by sending real emails on the local stack and following the links.

## Purpose
Every email the app depends on for access (password reset, carer invite) leads to a working screen, and the hosted project is set up to deliver them.

## Problem
Checked on the local stack on 2026-10-02:
- **Reset:** `resetPasswordForEmail` (PKCE) sends a link that Supabase verifies and redirects to `/auth/confirm?code=…&next=/reset-password`. `src/app/(auth)/auth/confirm/route.ts` reads only `token_hash` and `type`, so it always redirects to `/sign-in?reason=reset-link-expired`. The unit tests only feed it a `token_hash` URL.
- **Invite:** `inviteUserByEmail` (service role, no PKCE) sends a link that redirects to `<site_url>#access_token=…&type=invite`. The token is in the URL hash, which a server cannot read, and no page or handler uses it. An invited carer has no way to set a password, and "Forgot password" is broken (above).
- No custom email templates exist (`supabase/templates` is absent; `config.toml` has them commented out). No test reads an email.
- Hosted: the built-in Supabase mail sender is heavily rate-limited and, as of writing, delivers only to project team members; custom SMTP, the site URL and the redirect allow-list for the hosted project are not recorded anywhere.

## Description
1. **Templates.** Add `supabase/templates/recovery.html` and `invite.html`  that link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<path>`, and register them in `supabase/config.toml`. This form works for both the app's reset (PKCE) and the admin API's invite (no code verifier).
2. **Confirm route.** Keep `token_hash` + `type` as the primary path. Also accept `?code=` (`exchangeCodeForSession`) so a link generated the default way still works. Keep F0-21 FD-09's same-origin `next` rule. An expired, used or malformed link goes to `/sign-in?reason=reset-link-expired`.
3. **Set-password page** for invited carers: `/set-password`, reusing the reset-password form and layout with welcome wording. After saving, the carer is signed in and sent to the role home (`resolvePostSignInPath`).
4. **Resend invite** for an admin, for a carer who has not yet signed in (Admin Staff edit panel). Admin-only, AAL2 as everything else under F0-21. Refused for an account that has already accepted.
5. **End-to-end tests** that read the local Mailpit (`http://127.0.0.1:54324/api/v1`): reset, and invite.
6. **Hosted checklist** (in this feature's DECISIONS.md and `docs/DEVELOPMENT_WORKFLOW.md` release notes if the human wants it there): custom SMTP, sender address and domain (SPF/DKIM), site URL, redirect allow-list including `/auth/confirm`, the templates pasted or pushed with `supabase config push`, OTP expiry, and the Auth email rate limits.

## User value
A new carer can accept an invite and sign in; anyone who forgets a password can get back in. Without this, carers cannot be onboarded.

## Users
Carers (invited), all roles (reset), Admins (resend invite).

## Scope
- The templates and config; the confirm route; `/set-password`; the resend-invite action and button; tests; the hosted checklist.
- Nothing for sign-up confirmation: email confirmation is not required (FD-02).

## Out of Scope
- Email change, MFA reset or recovery codes, magic-link sign-in, SMS.
- Budget and care-alert emails (INT-01, INT-09). They use Resend directly, not Supabase Auth.
- Branding or redesign of the emails beyond plain, accessible wording.

## Functional Requirements
- A reset link from a real email, used once before it expires, lets the user set a new password and signs them in.
- An invite link lets the invited person set a password once and signs them in to their role home.
- Reused, expired, tampered and missing-token links fail the same way and create no session.
- The request-reset response never reveals whether the email is registered (F0-07 AC-08 stays true).

## UI / UX Requirements
- `/set-password` has the same layout, fields, states and tokens as `/reset-password` (OQ-19: no auth-page designs; follow the kit). Heading "Set your password"; the field rules are those of reset.
- Resend invite is a plain button in the staff edit panel, shown only for staff who have not signed in, with a success and an error message. No new tokens.

## Dependencies
- Features: F0-07 (auth actions, `/auth/confirm`), F0-17 (sign-up), ADM-02 (staff invite, `inviteStaffAccount`). All merged.
- Blocking open decisions (must be answered before START FEATURE): None

## Inputs
- The emailed link (`token_hash`, `type`, `next`, or `code`); the new password; an admin's resend request for a staff member.

## Outputs
- A session and a role home redirect; a new invite email.

## Error / Edge Cases
- Email scanners that pre-open links can consume a one-time token. If that happens the user sees the expired-link path and can request a new one (invite: ask the admin to resend). Record in FD if observed.
- Invite for an email that already has an account: refused with the existing generic message (ADM-02).
- Resend for an account that has already signed in: refused.
- Invite or reset link opened on a different device or browser: works (token_hash needs no code verifier).
- Password rules are those of F0-07 (`min 8`).

## Security / Permissions
- `next` stays same-origin only (F0-21 FD-09). The confirm route and set-password page grant nothing beyond the session the token represents.
- Resend invite checks the caller is an active admin of the staff member's organisation under their own session; the service-role call lives only in `src/server/jobs/admin-invite-staff.ts` (ADR-02). Reuse the existing admin guard; no new service-role import elsewhere.
- No PII in logs. Do not log tokens or links.

## Technical Considerations
- Read `node_modules/next/dist/docs/` for route handlers and Server Actions before changing them (CLAUDE.md §14).
- Templates use Supabase's Go template variables; test them against the local Mailpit, not by reading them.
- `src/server/admin/**` is ADM-02's contract file. If another feature is changing it, sequence after it (CLAUDE.md §3).
- Dropping `config.toml` template paths does not change the hosted project; it needs `supabase config push` or pasting. Say which in PROGRESS.

## Traceability
- Product requirements: REQ-01, REQ-06
- Sources: CHG-047; F0-07; ADM-02 FD-01; local email check 2026-10-02.

## Labels
None PROPOSED.
