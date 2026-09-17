# ADM-08 — Admin — Manage carer-client assignments

| Field | Value |
|---|---|
| Feature ID | ADM-08 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-carer-assignments` |
| Documentation | `docs/development/admin-dev/admin-carer-assignments/` |
| Lane | A — Admin |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Manage assignments.

## Problem
No UI; depends on assignment definition.

## Description
Lets admins end a carer's access to a client independently of shifts.

## User value
Clients have the right carers; removed carers lose access (A-3).

## Users
- Admin

## Scope
- Assignment list and remove/reassign actions (design required).

## Out of Scope
- —

## Functional Requirements
- Removal ends assignment and future shifts for that pair (PROPOSED).

## UI / UX Requirements
- BLOCKED until designed.

## Dependencies
- Features: ADM-07 (Admin — Assign shift)
- Blocking open decisions (must be answered before START FEATURE): OQ-09, OQ-19
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- carer, client

## Outputs
- Assignment change

## Error / Edge Cases
- —

## Security / Permissions
- Own organisation.

## Technical Considerations
- DB function.

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…), REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…)
- Sources: CM-0309 (admins manage carers and client assignments); US A-3; FR-5.7
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
