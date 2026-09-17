# ADM-03 — Admin — Deactivate staff

| Field | Value |
|---|---|
| Feature ID | ADM-03 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-staff-deactivate` |
| Documentation | `docs/development/admin-dev/admin-staff-deactivate/` |
| Lane | A — Admin |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Withdraw staff access.

## Problem
No deactivate control appears in the Staff design.

## Description
Deactivates a carer account so they can no longer access organisation information while their completions remain attributed.

## User value
Access is withdrawn when staff leave (CIS5).

## Users
- Admin

## Scope
- Deactivate action and confirmation (design required).
- Sets is_active false; ends assignments; cancels future shifts (PROPOSED).

## Out of Scope
- Hard delete

## Functional Requirements
- Past completions keep actor names.

## UI / UX Requirements
- BLOCKED until designed.

## Dependencies
- Features: ADM-02 (Admin — Staff list and add/edit staff)
- Blocking open decisions (must be answered before START FEATURE): OQ-36, OQ-19
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- staff id

## Outputs
- Inactive profile

## Error / Edge Cases
- Deactivated mid-shift → next request signed out.

## Security / Permissions
- Own organisation only.

## Technical Considerations
- DB function.

## Traceability
- Product requirements: REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: CIS3 Order of Access 3; CIS5 Q&A (access withdrawn when staff leaves); FR-5.6; US A-2
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
