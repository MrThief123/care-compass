# ADM-06 — Admin — Manage: staff and client selection

| Field | Value |
|---|---|
| Feature ID | ADM-06 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-manage-selection` |
| Documentation | `docs/development/admin-dev/admin-manage-selection/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Select a staff member and a client.

## Problem
Hover vs selected must be unmistakable (D20).

## Description
The left two columns and selection summary of the Admin Manage screen.

## User value
Admins pick who to roster to whom quickly (dense but clear).

## Users
- Admin

## Scope
- Route `/admin/manage`; Staff column (290px) 'Search staff'; Clients column (290px) 'Search clients'.
- Selectable list rows: avatar + name; selected = solid #07727D with white text and check; hover = tint.
- Assign shift panel header with summary 'Aisha Rahman → Margaret' and 'Clear' (panel body is ADM-07).
- Selection state in URL (`staff`, `client`).

## Out of Scope
- Date/time assignment (ADM-07)

## Functional Requirements
- Search filters server-side (D32).

## UI / UX Requirements
- Match Admin · Manage frame.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), ADM-UI-02 (Admin Manage screen (UI))
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- staff
- client
- search

## Outputs
- Selection

## Error / Edge Cases
- Only one staff and one client selectable (PROPOSED from design).

## Security / Permissions
- Own organisation lists only.

## Technical Considerations
- Keyboard: rows are radio-group semantics.

## Traceability
- Product requirements: REQ-23 (Admins assign a carer to a client for a date and time slot (or custom time); overlapping s…)
- Sources: UI-§7.14, D20; Design: Admin · Manage
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
