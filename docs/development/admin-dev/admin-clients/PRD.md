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

> **CHG-035 (2026-09-29): this PRD's Scope is corrected here, as CHG-010 (root DECISIONS.md,
> confirmed 2026-09-24) instructed ADM-04 to do "when it starts": PD-037 (2026-09-17) rejected
> admin-created clients in favour of family-created clients, so the original "Admin adds a client
> with a family contact" flow described below never applied. ADM-04 is the clients **list** only
> (read; Remove is ADM-05's separate, still-unstarted feature). Text below the Scope/Out of
> Scope/Dependencies/Error/Security/Technical Considerations sections is corrected; Purpose/Problem/
> Description above keep their original wording for history but are superseded by this note.**

## Purpose
List the organisation's clients.

## Problem
~~Admin adding clients conflicts with the ownership model where family sets up the record (CIS3,
CM-1908) — OQ-07; how the family contact gets an account is undefined.~~ Resolved by PD-037: the
family creates the client record; admin never does. Nothing left to solve here.

## Description
Admin views the organisation's clients and their family contact. Admin cannot edit client information
(D28) and cannot add one (PD-037) — full read/edit of a client's own screens belongs to ADM-11 (Admin
client view, not yet started), through a different route, not this list.

## User value
Organisations see who they care for and who to contact.

## Users
- Admin

## Scope
- Route `/admin/clients`; Client list; columns NAME, FAMILY CONTACT, REMOVE (Remove handled by ADM-05;
  the control is already drawn by ADM-UI-04 but stays a local, unwired preview until ADM-05 wires it
  for real — not this feature's write path).
- No Add-client panel (PD-037, CHG-010): removed from the screen, not merely left unwired, since
  admin-created clients is a rejected flow, not an undesigned one.
- No edit of client info (D28) — ADM-04 has no write action of its own at all now.

## Out of Scope
- Remove client, for real (ADM-05)
- Adding a client (rejected, PD-037 — family creates the client, not admin)
- Editing client information (forbidden D28; full access via a different route is ADM-11's scope)

## Functional Requirements
- None beyond reading the organisation's clients and each one's family contact.

## UI / UX Requirements
- Match design, minus the Add-client panel the design drew before PD-037.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), ADM-UI-04 (Admin Clients screen (UI))
- Blocking open decisions (must be answered before START FEATURE): none (OQ-07 is ANSWERED, PD-037;
  OQ-08 no longer applies to ADM-04 now that it creates no account)
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- session admin

## Outputs
- Client list

## Error / Edge Cases
- A client with no linked family member (shouldn't happen under PD-037's flow, but not impossible) →
  PROPOSED show "—" for Family contact rather than erroring.
- A client linked to more than one family member → PROPOSED show the first, alphabetically by first
  name, rather than trying to list several in one column (undesigned; the design shows one name).

## Security / Permissions
- Admin sees only own organisation's clients.

## Technical Considerations
- Read-only Server Component; no Server Action (nothing writes here any more).

## Traceability
- Product requirements: REQ-07 (Admins add and remove clients for their organisation but cannot edit client information.)
- Sources: UI-D28, §7.16; US A-1; Design: Admin · Clients
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
