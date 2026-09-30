# ADM-10 — Admin — Settings

| Field | Value |
|---|---|
| Feature ID | ADM-10 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` (CHG-036) |
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
- ABN: 11 digits, spaces allowed, saved as `XX XXX XXX XXX`; no checksum (FD-03). Organisation name, phone and address must not be blank.
- Organisation info has its own Save button (PD-054). Save writes name, ABN, phone and address of the signed-in admin's own organisation only, through `admin_update_organisation` (FD-02).
- Reset card sends a password-reset link to the admin's sign-in email through `requestOwnPasswordReset` (FAM-12); it never takes an address from the caller.
- Reads: `getAdminSettings` reads the admin's own organisation from Supabase (RLS `organisations_select_member`).

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
- Save failure keeps what was typed, shows an error, no 'Saved.'. Reset failure shows an error.
- Missing organisation: empty state; Reset stays available.

## Security / Permissions
- Active admin of that organisation only. Carers, family and other organisations' admins are refused (42501). The organisation id is never taken from the caller.

## Technical Considerations
- Server Action + Zod, schema shared by screen and action (`src/server/admin/settings-schema.ts`). One additive migration: `admin_update_organisation` SECURITY DEFINER RPC, same shape as ADM-02's `admin_update_staff`. No direct `update` grant on `organisations`.

## Traceability
- Product requirements: REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…)
- Sources: CIS5 Q&A (business name, ABN, contact details); Design: Admin · Settings
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
