# ADM-10 — Admin — Settings

| Field | Value |
|---|---|
| Feature ID | ADM-10 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-settings` |
| Documentation | `docs/development/admin-dev/admin-settings/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-05**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Manage organisation details.

## Problem
Save action missing in design.

## Description
Admin Settings screen for organisation details and password reset.

## User value
Organisation details used across the app stay correct (e.g. header subline, POA/business details per CIS5).

## Users
- Admin

## Scope
- Route `/admin/settings`; Organisation info card: Organisation name, ABN, Phone, Address; Reset card reused.

## Out of Scope
- Organisation registration/deletion (PL-18)

## Functional Requirements
- ABN format 11 digits (PROPOSED validation).

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-07 (Sign-in, sign-out, password reset and role-based routing), ADM-UI-05 (Admin Settings screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-35
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Org fields

## Outputs
- Updated organisation

## Error / Edge Cases
- —

## Security / Permissions
- Admin of that organisation only.

## Technical Considerations
- Server Action + Zod.

## Traceability
- Product requirements: REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…)
- Sources: CIS5 Q&A (business name, ABN, contact details); Design: Admin · Settings
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
