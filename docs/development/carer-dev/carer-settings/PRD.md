# CAR-09 — Carer — Settings

| Field | Value |
|---|---|
| Feature ID | CAR-09 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-settings` |
| Documentation | `docs/development/carer-dev/carer-settings/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Manage own profile.

## Problem
Save action missing; whether Role (job title) is editable by the carer is undecided.

## Description
Carer Settings screen for own details and password reset.

## User value
Carers keep their contact details current and recover access without help.

## Users
- Carer

## Scope
- Route `/carer/settings`; 'My info' card (Name, Phone, Email, Role); Reset card reusing shared component.
- Role displayed read-only (PROPOSED — job title set by admin in ADM-02).

## Out of Scope
- Changing login email

## Functional Requirements
- Shared ProfileForm from FAM-12.

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-07 (Sign-in, sign-out, password reset and role-based routing), CAR-UI-04 (Carer Settings screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-35
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-13

## Inputs
- Profile fields

## Outputs
- Profile update

## Error / Edge Cases
- —

## Security / Permissions
- Own profile only; carer cannot change job_title or role via API.

## Technical Considerations
- Reuse components.

## Traceability
- Product requirements: REQ-01 (Users sign in simply and securely; users can reset their password by email.)
- Sources: Design: Carer · Settings
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
