# FAM-12 — Family — Settings: family info and password reset

| Field | Value |
|---|---|
| Feature ID | FAM-12 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-settings-profile` |
| Documentation | `docs/development/family-dev/family-settings-profile/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-06**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Manage own profile.

## Problem
The design shows editable-looking fields but no Save action (OQ-35).

## Description
The Family Settings screen apart from Change organisation: personal contact details and requesting a reset link.

## User value
Contact details stay current for staff and notifications; users can recover access themselves.

## Users
- Family

## Scope
- Route `/family/[clientId]/settings`; page title 'Settings'.
- Family info card: Name, Phone, Email, Address inputs bound to the signed-in profile; save mechanism per OQ-35.
- Reset username / password card: description 'We'll email you a secure link to reset your credentials.' and 'Reset' button calling `requestPasswordReset()` from F0-07 with confirmation message.
- Layout slot for Change organisation card (FAM-13).

## Out of Scope
- Change organisation (FAM-13)
- Changing login email (Supabase email change flow not designed)

## Functional Requirements
- Phone and email validated.

## UI / UX Requirements
- Match Family · Settings frame.

## Dependencies
- Features: F0-07 (Sign-in, sign-out, password reset and role-based routing), FAM-UI-06 (Family Settings screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-35
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-08

## Inputs
- Profile fields

## Outputs
- Updated profile
- Reset email

## Error / Edge Cases
- Email field edited → PROPOSED contact email only, not login email, until clarified.

## Security / Permissions
- Users edit only their own profile row.

## Technical Considerations
- Server Action + Zod.

## Traceability
- Product requirements: REQ-01 (Users sign in simply and securely; users can reset their password by email.)
- Sources: Design: Family · Settings; CIS3 Data Entry 6b (salutation/email used for emails)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
