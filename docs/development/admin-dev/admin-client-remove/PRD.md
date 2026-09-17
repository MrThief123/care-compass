# ADM-05 — Admin — Remove client

| Field | Value |
|---|---|
| Feature ID | ADM-05 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-client-remove` |
| Documentation | `docs/development/admin-dev/admin-client-remove/` |
| Lane | A — Admin |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
End an organisation's service to a client.

## Problem
Whether Remove deletes, archives, or detaches the organisation, and its confirmation, are undefined.

## Description
Implements the Remove link on the Admin client list.

## User value
Organisations can stop serving a client cleanly.

## Users
- Admin

## Scope
- Remove action with confirmation (design required).
- PROPOSED: set clients.organisation_id null, end assignments, cancel future shifts — never delete data.

## Out of Scope
- Deleting client data

## Functional Requirements
- Family retains access.

## UI / UX Requirements
- BLOCKED until designed/decided.

## Dependencies
- Features: ADM-04 (Admin — Clients list and add client)
- Blocking open decisions (must be answered before START FEATURE): OQ-06, OQ-07, OQ-19
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- client id

## Outputs
- Detached client

## Error / Edge Cases
- —

## Security / Permissions
- Own organisation only.

## Technical Considerations
- Reuse transfer function patterns.

## Traceability
- Product requirements: REQ-04 (A client belongs to one organisation at a time; the family can move the client to another …), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: UI-D28; CIS3 #9 (data must not be lost); Design: Admin · Clients 'Remove'
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
