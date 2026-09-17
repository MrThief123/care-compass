# F0-10 — Shifts schema, active-shift function and conflict query

| Field | Value |
|---|---|
| Feature ID | F0-10 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-shifts-schema` |
| Documentation | `docs/development/shared/shared-shifts-schema/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D4–D5 |
| Status / owner | See PROGRESS.md |

## Purpose
Model shifts as the basis of carer access and schedule visibility.

## Problem
Carer edit rights depend on being on shift; admins need overlap warnings, not hard blocks (D30); shifts never recur (D31).

## Description
Stores non-recurring shifts assigning a carer to a client for a time window, exposes whether a carer is currently on shift for a client, and detects overlapping shifts without blocking them.

## User value
Enables shift-based edit rights, the Admin assign-shift flow, the Carer calendar and 'which carer is on today' for families.

## Users
- Admin
- Carer
- Family

## Scope
- `shifts` table: id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at, cancelled_at null.
- Constraints: ends_at > starts_at; carer's organisation = client's current organisation at insert (trigger).
- Function `carer_on_active_shift(client_id)` → boolean for auth.uid() at now().
- Function `overlapping_shifts(carer_id, starts_at, ends_at)` → rows (used for soft warning).
- Behaviour of carer_client_assignments on shift insert per OQ-09 answer.
- RLS: admin of the client's organisation can insert/update/cancel; carer can read own shifts; family can read shifts for linked clients (carer display name only).
- pgTAP tests.

## Out of Scope
- Assign-shift UI (ADM-07)
- Shift edit/extend UI (ADM-09)
- Recurring shifts (explicitly excluded, D31)

## Functional Requirements
- Overlaps never raise an error.
- Cancelled shifts do not grant active-shift rights.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-09
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-21, OQ-27

## Inputs
- Shift rows

## Outputs
- Shift data
- Active-shift function
- Overlap query

## Error / Edge Cases
- Shift crossing midnight is valid.
- now() exactly equal to ends_at → not active (half-open interval, PROPOSED).

## Security / Permissions
- Carers cannot insert or modify shifts.
- Family sees carer first name + initial only (PROPOSED view, OQ-13).

## Technical Considerations
- timestamptz; half-open [starts_at, ends_at).

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…), REQ-23 (Admins assign a carer to a client for a date and time slot (or custom time); overlapping s…), REQ-25 (Carers see all their assigned shifts in a calendar with the tasks for a selected shift.), REQ-26 (Family sees which carer is assigned each day.)
- Sources: CM-1908 (timetable); CM-0409 (edit during active shift); UI-D8, D25, D30, D31; CIS5 Staff Time Table Rostering; Design: Admin Manage
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
