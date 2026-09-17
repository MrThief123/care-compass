# ADM-02 — Admin — Staff list and add/edit staff

| Field | Value |
|---|---|
| Feature ID | ADM-02 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-staff` |
| Documentation | `docs/development/admin-dev/admin-staff/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D8–D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Manage staff.

## Problem
Account provisioning method and job-title list source are undecided.

## Description
Admin manages the organisation's carer accounts and job titles.

## User value
Organisations manage their own staff (CM-1908).

## Users
- Admin

## Scope
- Route `/admin/staff`; Staff list card with '+ Add staff'; columns NAME, ROLE, EDIT.
- Add / edit staff panel: Name, Phone, Email, Role (select: Registered Nurse, Enrolled Nurse, Support Worker per design; source per OQ-13); Save.
- Create account per OQ-08 (e.g. invite email) with role 'carer' in admin's organisation.
- Edit updates profile fields.

## Out of Scope
- Deactivate/remove staff (ADM-03)
- Creating additional admins (not designed)

## Functional Requirements
- Email unique across users.

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-07 (Sign-in, sign-out, password reset and role-based routing), ADM-UI-03 (Admin Staff screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-08, OQ-13
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-36

## Inputs
- Staff form

## Outputs
- Carer profile

## Error / Edge Cases
- Email already belongs to another organisation's user → error (PROPOSED).

## Security / Permissions
- Admin can only create/edit profiles in own organisation.

## Technical Considerations
- Account creation requires service role in an isolated server module (documented exception, PD-002) — confirm with OQ-08.

## Traceability
- Product requirements: REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…), REQ-08 (Staff are identified by name (and optional reference); organisations differ on showing ful…)
- Sources: CM-1908 (managers create staff accounts); CIS3 #3–4 (organisation-specific staff labels); CIS5 (name/surname or first name + initial; staff number optional); US A-2; Design: Admin · Staff
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
