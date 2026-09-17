# ADM-09 — Admin — Edit, extend or cancel a shift

| Field | Value |
|---|---|
| Feature ID | ADM-09 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-edit-shift` |
| Documentation | `docs/development/admin-dev/admin-edit-shift/` |
| Lane | A — Admin |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Maintain shifts.

## Problem
Workflow and UI undefined.

## Description
Supports the client's need to extend a shift when a manager asks a carer to stay longer.

## User value
Rosters reflect reality; edit rights follow actual working time.

## Users
- Admin

## Scope
- Edit/extend/cancel UI (design required) using F0-10 table.

## Out of Scope
- Recurring shifts

## Functional Requirements
- Extension updates ends_at; audited.

## UI / UX Requirements
- BLOCKED until designed.

## Dependencies
- Features: ADM-07 (Admin — Assign shift)
- Blocking open decisions (must be answered before START FEATURE): OQ-27, OQ-19
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- shift

## Outputs
- Updated shift

## Error / Edge Cases
- Extension creating overlap → soft warning (D30).

## Security / Permissions
- Admin only.

## Technical Considerations
- Server Action.

## Traceability
- Product requirements: REQ-24 (Shifts can be edited and extended.)
- Sources: CIS5 Staff Time Table Rostering (extend shift); CM-0309 (shifts editable; confirm extension workflow)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
