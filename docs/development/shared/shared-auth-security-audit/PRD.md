# F0-21 — Auth security audit

| Field | Value |
|---|---|
| Feature ID | F0-21 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (added by CHG-041) |
| Lane | S — Shared |
| Sprint | SPRINT · planned D12 |
| PR target | `main` (CHG-036) |
| Feature branch | `feature/shared-auth-security-audit` |
| Documentation | `docs/development/shared/shared-auth-security-audit/` |
| Jira | — |
| Status | See PROGRESS.md |

## Purpose
Client data is health and financial information. Authentication and authorisation must hold at the database, not only in the screens.

## Problem
F0-20 found that MFA is enforced only by the app route guard: no RLS policy checks `aal`. Other common weaknesses of generated code have not been checked: cookie flags, ID swapping (IDOR), rate limiting, and credentials in a URL.

## Description
Audit each weakness, write a failing test for every gap, fix it, and record an audit report.

## User value
Protected client data even if someone skips the UI and calls the Supabase API directly.

## Users
- Every signed-in role (admin, family, carer) and signed-out visitors.

## Scope
- RLS: admin-only data requires an AAL2 session (additive migration, shown to the human before it is applied).
- Session cookies: record and, where feasible, harden `HttpOnly`, `Secure`, `SameSite`.
- IDOR: a cross-tenant test for every client-scoped table (read, insert, update, delete by swapped IDs), and for `/family/[clientId]/...` and `/admin/...` routes.
- Rate limits: confirm Supabase Auth limits (local `config.toml` and hosted) for sign-in, password reset and TOTP verify; add our own only where there is a gap.
- Sign-in and other auth forms never put credentials in the URL (POST or hydration-safe submit).
- Written audit report: each item, finding, evidence, status.

## Out of Scope
- New auth features (SSO, passkeys, recovery codes), password policy changes, penetration testing of the hosted project, anything needing a hosted-project change without the human.

## Functional Requirements
- An AAL1 admin session cannot read or write admin-scoped rows through the data API.
- A user cannot read or write another family's or organisation's rows by swapping IDs.
- Repeated wrong passwords or TOTP codes are throttled.

## UI / UX Requirements
- None new. The sign-in form looks and behaves as today.

## Dependencies
- Features: F0-07, F0-20 (F0-20 must be merged first)
- Blocking open decisions: None
- Non-blocking open decisions: which role claim RLS reads for the AAL check (proposed default: `auth.jwt() ->> 'aal'`).

## Inputs
- Existing RLS policies, Supabase config, cookie settings, auth forms.

## Outputs
- Additive migration(s), tests, hardening changes, `AUDIT_REPORT.md` in this folder.

## Error / Edge Cases
- Existing admin sessions at AAL1 are sent to `/mfa/verify` (no lockout beyond that).
- Seed and test helpers that use the service role keep working.

## Security / Permissions
- Migrations additive only (add, backfill, drop in a later PR). Local Supabase only for tests; `supabase db reset` only with the human's say-so.

## Technical Considerations
- Create migrations with `supabase migration new`. Tests use dedicated fresh users, never the seeded accounts.
- Reuse `tests/helpers/totp.ts` (F0-20) to obtain AAL2 sessions.
