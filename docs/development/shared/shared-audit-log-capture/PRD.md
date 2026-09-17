# F0-08 — Append-only audit log capture

| Field | Value |
|---|---|
| Feature ID | F0-08 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-audit-log-capture` |
| Documentation | `docs/development/shared/shared-audit-log-capture/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D4 |
| Status / owner | See PROGRESS.md |

## Purpose
Record every create, update and delete with actor and before/after values.

## Problem
History must survive staff and organisation changes and must not be editable by anyone, including admins.

## Description
Creates the append-only audit table and generic trigger, attaches it to existing tables and defines the pattern later schema features must follow.

## User value
Safeguarding: actions are traceable to a person and time and cannot be rewritten.

## Users
- System

## Scope
- `audit_log` table: id, occurred_at, actor_id, actor_role, table_name, record_id, action (INSERT/UPDATE/DELETE), before jsonb, after jsonb, client_id (nullable, for scoping).
- Generic trigger function `audit_row_change()` using `auth.uid()`.
- Attach to tables from F0-06; document the one-line attach pattern in ARCHITECTURE.md for later tables.
- RLS: no UPDATE or DELETE policy for any role; INSERT only via trigger; SELECT policy none by default (viewer is parked PL-06).

## Out of Scope
- Audit log viewer UI (PL-06, FR-10.2)

## Functional Requirements
- Updates record both before and after row images.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Row changes

## Outputs
- Audit rows

## Error / Edge Cases
- Changes made by a service-role job record actor_id null and actor_role 'system'.

## Security / Permissions
- REVOKE UPDATE, DELETE on audit_log from authenticated and anon roles.

## Technical Considerations
- Trigger is AFTER INSERT/UPDATE/DELETE FOR EACH ROW.

## Traceability
- Product requirements: REQ-N7 (Actions are traceable to a user and time in an immutable audit log.), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: FR-10.1, 10.3, 10.4; NFR-7; ADR-01 consequence (append-only audit); ADR-03 (actor from session)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
