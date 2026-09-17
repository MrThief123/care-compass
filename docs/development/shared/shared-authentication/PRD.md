# F0-07 — Sign-in, sign-out, password reset and role-based routing

| Field | Value |
|---|---|
| Feature ID | F0-07 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-authentication` |
| Documentation | `docs/development/shared/shared-authentication/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D5 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2:** sign-in page uses UI-02 form components; role layouts from F0-15 already exist — add server-side guards to them.

## Purpose
Authenticate users and put each role in its own dashboard.

## Problem
No sign-in screen is designed; the Settings designs imply email-based password reset.

## Description
Implements authentication with Supabase Auth and routes Family, Carer and Admin users to their separate dashboards, blocking cross-role access server-side.

## User value
Users get in 'as simply as their online bank' (CIS3) and never see another role's dashboard.

## Users
- Family
- Carer
- Admin

## Scope
- `/sign-in` page: email + password, submit, error message on failure, link 'Forgot password?' (layout built from existing primitives and tokens — no bespoke visual design exists, OQ-19).
- Password reset: request page sending Supabase reset email; `/reset-password` page to set a new password from the emailed link.
- Reusable `requestPasswordReset()` server action used later by the Settings 'Reset' buttons (FAM-12, CAR-09, ADM-10).
- Sign-out action (placed in the top bar by F0-15).
- Post-sign-in redirect by role: family → `/family/[clientId]/home` (first linked client), carer → `/carer/home`, admin → `/admin/home`.
- Route-group guards: `(family)`, `(carer)`, `(admin)` layouts verify role server-side; wrong role → redirect to own home.
- Inactive profile → signed out with 'Your access has been withdrawn' message.
- MFA for admin per OQ-08 answer (not implemented until answered).
- Replace the mock `getCurrentUser()` data source with the Supabase session; keep the contract signature unchanged.

## Out of Scope
- Account creation/invitations (ADM-02, ADM-04 per OQ-08)
- Client switcher for multi-client family (OQ-30, parked)
- Organisation SSO (ADR-03 deferred)

## Functional Requirements
- Unauthenticated access to any dashboard route redirects to `/sign-in`.
- Role checks happen on the server; the client UI never decides access (NFR-3 / UI-DD 'controls absent not disabled').

## UI / UX Requirements
- Plain-language error copy; inputs and buttons use F0-14 primitives; 44×44px targets.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-15 (Role app shell: rail, header and layouts), UI-02 (Forms kit: fields, settings cards, side panels, chips, modal, event form)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-08
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-30

## Inputs
- Email
- Password

## Outputs
- Session cookie
- Redirect

## Error / Edge Cases
- Family user with no linked client → neutral page 'No client linked to your account yet' (copy PROPOSED; confirm).
- Expired reset link → message and option to request a new link.

## Security / Permissions
- Generic error for wrong email or password (no account enumeration).
- Rate limiting relies on Supabase Auth defaults (record in DECISIONS).
- Session expiry/refresh per Supabase defaults via middleware (NFR-3).

## Technical Considerations
- Server Actions for sign-in/out; `redirect()` after success.

## Traceability
- Product requirements: REQ-01 (Users sign in simply and securely; users can reset their password by email.), REQ-02 (Three separate role dashboards — Family, Carer, Admin — each with its own navigation; cont…), REQ-09 (MFA available/required for Admin accounts.)
- Sources: CIS3 Order of Access 1; CIS5 Q&A (email and password arrangement); UC-S01; FR-5.4; NFR-3; ADR-03; Design: Settings 'Reset username / password — We'll email you a secure link'
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
