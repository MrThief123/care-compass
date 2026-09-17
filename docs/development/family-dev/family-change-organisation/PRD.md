# FAM-13 — Family — Change organisation

| Field | Value |
|---|---|
| Feature ID | FAM-13 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-change-organisation` |
| Documentation | `docs/development/family-dev/family-change-organisation/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D11 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-06**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Transfer the client between organisations safely.

## Problem
Transfer is destructive and irreversible from the family side; the picker is not designed and the 3/9 meeting asked for Add/Delete organisation instead (OQ-06).

## Description
Lets the family move the client to another organisation: history retained, nurse assignments and future shifts cleared, old organisation loses access immediately.

## User value
Families can leave a provider without losing any records (CIS3, CIS5).

## Users
- Family

## Scope
- Change organisation card: 'Currently registered with Banksia Home Care.' and 'Change' button.
- Organisation picker listing organisations registered with Care Compass (UI not designed — OQ-06).
- Confirmation modal (destructive tone): title 'Change organisation?', body 'Switching Margaret's care to a new organisation keeps her routines, events, budget, documents and history. Assigned nurses and all future shifts will be cleared, and Banksia Home Care will lose access immediately. This can't be undone from your side.', buttons Cancel / Change organisation, close X.
- Postgres function `transfer_client_organisation(client_id, new_org_id)`: verify family authority; update clients.organisation_id; end active carer assignments; cancel shifts starting after now(); audit; single transaction.

## Out of Scope
- Organisation registration (PL-18)
- Notifying organisations by email (not specified)
- Incoming organisation's view of old history (OQ-15 decides RLS)

## Functional Requirements
- Outgoing admin and carers lose access on their next request.
- Routines, events, budgets, documents and completions unchanged.

## UI / UX Requirements
- Modal focus-trapped, Escape closes, focus returns to Change button.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-10 (Shifts schema, active-shift function and conflict query), FAM-UI-06 (Family Settings screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-06, OQ-15
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-28

## Inputs
- new organisation

## Outputs
- Transferred client

## Error / Edge Cases
- Selecting the current organisation → Change organisation button disabled/absent (PROPOSED).
- Carer currently mid-shift → shift after now() cancelled; current in-progress shift PROPOSED ended at now().

## Security / Permissions
- Only family with authority (OQ-16) can execute; function is SECURITY DEFINER with explicit checks.

## Technical Considerations
- Single RPC call from Server Action.

## Traceability
- Product requirements: REQ-04 (A client belongs to one organisation at a time; the family can move the client to another …), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: CIS3 Order of Access 4, #9; CIS5 Q&A multi-organisation; UI-D3, D24, D36, §7.6; ADR-03 consequence (transfer); US P-13–P-15; Design: Family · Settings 'Change organisation'; Design: States sheet confirmation modal
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
