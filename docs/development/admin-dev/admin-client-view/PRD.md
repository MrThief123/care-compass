# ADM-11 — Admin — Client view: a client's Family screens with full access

| Field | Value |
|---|---|
| Feature ID | ADM-11 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-client-view` |
| Documentation | `docs/development/admin-dev/admin-client-view/` |
| Lane | A — Admin |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> Added by **CHG-020** (PD-058, 2026-09-25). Renders the Family screens already built and wired by Lane F; it does not rebuild them.

## Purpose
Let an organisation admin see and do everything the family can for one of their clients.

## Problem
The client told us that when a family is no longer there, someone still has to run the client's care and budget. Admins had no way into a client beyond the Clients list, and could not edit client information (PD-023, now superseded).

## Description
In Admin · Clients, each client's name links to `/admin/clients/<clientId>/home`. The admin then sees that client's Family screens (Home, Info, Calendar, Budget, Care log, Add / Edit event, Task detail) inside the admin layout, with a bar naming the client and a "Back to clients" link. Every Family action is available, and every change records the admin as the one who made it.

## User value
Care and money keep being managed when a family steps away, without a second copy of any screen.

## Users
- Organisation admin (own organisation's clients only)

## Scope
- Client names in the Admin · Clients list link to `/admin/clients/<clientId>/home`.
- Routes under `/admin/clients/<clientId>/` for home, info, calendar, budget, log, events (new / edit) and task detail, each rendering the matching Family screen for that client.
- A client bar above the screen (client name, "Back to clients") and a client-level nav between the Family screens, inside the admin layout.
- Full Family write access: add / edit events and costs, mark tasks done, edit client information and documents, add or remove funds.
- Every write records the admin as its actor (History "Recorded by", Care log "Done by").
- An admin opening a client outside their organisation gets the not-found page.

## Out of Scope
- Changing the client's organisation (Family only; see Security)
- Family Settings (family member's own profile and password)
- Any change to the Family screens' behaviour or layout

## Functional Requirements
- The Family screens take their client from the route, so the same screen renders under `/family/<clientId>/…` and `/admin/clients/<clientId>/…`.

## UI / UX Requirements
- The client bar and nav are not in the design. Built from the Figma "01 · Foundations" tokens and the existing admin layout, flagged **HUMAN REVIEW** in the PR (PD-052).

## Dependencies
- Features: ADM-04 (Admin — Clients list and add client), FAM-01 (Family Home — Today day-view timeline), FAM-04 (Family Calendar — day, week and month views), FAM-06 (Family — Add event (Enter event)), FAM-07 (Family — Edit event), FAM-09 (Family — Client info), FAM-10 (Family — Budget overview and history), FAM-11 (Family — Update funds), FAM-14 (Family — Task log), FAM-15 (Family — Task detail)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- clientId (route); admin session

## Outputs
- The same writes Family makes, attributed to the admin

## Error / Edge Cases
- Client removed from the organisation while the admin is viewing it: the next request shows not-found.
- Unknown clientId: not-found.

## Security / Permissions
- RLS grants admins of the client's current organisation the same read and write rights as the client's family (F0-06, F0-11, F0-12, F0-13 policies). The UI never grants access on its own.
- Changing organisation stays Family only (PD-058, human answer 2026-09-25).

## Technical Considerations
- If reusing the Family screens needs code moved out of `src/features/family-*` (Lane F folders), that move goes through a shared PR first (CLAUDE.md §4.2); ADM-11 does not edit Lane F folders.
- Read `node_modules/next/dist/docs/` on nested dynamic routes and layouts before building.

## Traceability
- Product requirements: REQ-38, REQ-07, REQ-29
- Sources: Human, 2026-09-25 (PD-058, CHG-020)

## Labels
CONFIRMED · PROPOSED · UNKNOWN · AMBIGUOUS — HUMAN DECISION REQUIRED
