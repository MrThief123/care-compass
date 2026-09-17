# ADM-04 — Admin — Clients list and add client

| Field | Value |
|---|---|
| Feature ID | ADM-04 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-clients` |
| Documentation | `docs/development/admin-dev/admin-clients/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
List and add clients.

## Problem
Admin adding clients conflicts with the ownership model where family sets up the record (CIS3, CM-1908) — OQ-07; how the family contact gets an account is undefined.

## Description
Admin views the organisation's clients and adds a client with a family contact; admin cannot edit client information (D28).

## User value
Organisations onboard the people they care for.

## Users
- Admin

## Scope
- Route `/admin/clients`; Client list with '+ Add client'; columns NAME, FAMILY CONTACT, REMOVE (Remove handled by ADM-05; link absent until then).
- Add client panel: Client name, Family contact name, Family contact email, Notes; 'Add client' button.
- On add: create client in admin's organisation and family contact link/invite per OQ-07/OQ-08.
- No edit of client info (D28).

## Out of Scope
- Remove client (ADM-05)
- Editing client information (forbidden D28)

## Functional Requirements
- Family contact email validated.

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), ADM-UI-04 (Admin Clients screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-07, OQ-08
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Add client form

## Outputs
- Client + family link/invite

## Error / Edge Cases
- Family contact email already a family user → link existing account (PROPOSED).

## Security / Permissions
- Admin sees only own organisation's clients.

## Technical Considerations
- Server Action; account/invite per OQ-08.

## Traceability
- Product requirements: REQ-07 (Admins add and remove clients for their organisation but cannot edit client information.)
- Sources: UI-D28, §7.16; US A-1; Design: Admin · Clients
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
