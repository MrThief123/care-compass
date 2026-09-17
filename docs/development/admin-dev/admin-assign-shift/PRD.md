# ADM-07 — Admin — Assign shift

| Field | Value |
|---|---|
| Feature ID | ADM-07 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-assign-shift` |
| Documentation | `docs/development/admin-dev/admin-assign-shift/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Create shifts.

## Problem
Whether a shift implies client assignment is undecided; the design example warning text does not actually overlap (OQ-39).

## Description
Assign panel body on Manage: creates a shift for the selected carer and client.

## User value
Rostering in a few clicks with overlap awareness but no hard block (D30).

## Users
- Admin

## Scope
- Date: month grid (MON–SUN), prev/next, dots where the selected carer already has shifts, selected date filled.
- Time slot chips; 'Custom' reveals start/end time inputs (not drawn — PROPOSED two time inputs).
- Soft conflict inline alert: 'Aisha already has a shift with Margaret from 11:30–13:00 that overlaps this time. You can still assign it.' generated from `overlapping_shifts`.
- Cancel (clears date/slot) and 'Assign shift' (creates shift; success message PROPOSED).
- No Repeat control (D31).

## Out of Scope
- Editing/extending shifts (ADM-09)
- Recurring shifts (excluded)

## Functional Requirements
- Assign disabled until staff, client, date and slot chosen (PROPOSED: button absent/disabled state — confirm).

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), ADM-06 (Admin — Manage: staff and client selection)
- Blocking open decisions (must be answered before START FEATURE): OQ-09
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-21, OQ-39

## Inputs
- carer, client, date, slot

## Outputs
- Shift

## Error / Edge Cases
- Custom end before start → validation error.
- Overlap with a different client → warning names that client.

## Security / Permissions
- Admin of both carer's and client's organisation.

## Technical Considerations
- Server Action + F0-10 functions.

## Traceability
- Product requirements: REQ-23 (Admins assign a carer to a client for a date and time slot (or custom time); overlapping s…)
- Sources: UI-§7.14, D30, D31; Sequence UC3; CM-1908; Design: Admin · Manage Assign shift panel
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
