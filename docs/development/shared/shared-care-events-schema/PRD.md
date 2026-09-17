# F0-11 — Care events, occurrence overrides and append-only completions

| Field | Value |
|---|---|
| Feature ID | F0-11 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-care-events-schema` |
| Documentation | `docs/development/shared/shared-care-events-schema/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D5–D6 |
| Status / owner | See PROGRESS.md |

## Purpose
Provide one correct, secure source of occurrences and their status for every dashboard.

## Problem
Status must be derived consistently (Overdue after due time passes without Done), completion history must be immutable, and permissions differ by role and shift.

## Description
Stores care events (the Care Need Items as designed: 'events'), their occurrence overrides and an append-only completion history; provides a server query that returns occurrences with status and actor for a date range.

## User value
The heart of the product: what care is due, when, and who did it.

## Users
- Family
- Carer
- Admin

## Scope
- `care_events`: id, client_id, title, description, starts_at (anchor), duration_minutes, recurrence (jsonb validated by F0-09 schema), recurrence_until null, is_active, created_by, created_at, updated_at (final fields per OQ-22).
- `care_event_overrides`: event_id, original_start, kind ('cancelled'|'modified'), new_starts_at, new_duration_minutes, created_by.
- `care_event_completions` (append-only): id, event_id, original_start, action ('done'|'undone' per OQ-10), actor_id, actor_display_name snapshot, organisation_id snapshot, occurred_at.
- Postgres function `set_occurrence_done(event_id, original_start)` — authorises (family of client, or carer on active shift per OQ-09) and inserts completion.
- TypeScript `deriveStatus(occurrence, latestCompletion, now)` → 'planned'|'done'|'overdue' with actor.
- Server query `getOccurrences(clientId, range)` combining events + F0-09 expansion + overrides + latest completion + assigned carer (per OQ-29).
- RLS: family read/write events of linked clients; assigned carer read; carer write per OQ-09; admin read (for Admin Home overdue) — writes by admin not in design.
- Attach audit trigger (F0-08).

## Out of Scope
- UI screens (FAM/CAR/ADM features)
- Event notes/comments (OQ-34, parked)
- Shift checklist sub-tasks (OQ-33)
- Expense linkage (CAR-08)

## Functional Requirements
- Status Overdue iff now ≥ occurrence end (PROPOSED: start) and no current 'done' completion (OQ-10).
- Deactivated events stop generating future occurrences but keep past completions visible (FR-1.2).

## UI / UX Requirements
- None directly; supplies `Done · Aisha R.` actor labels (D33).

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-09 (Recurrence engine (pure TypeScript)), F0-10 (Shifts schema, active-shift function and conflict query), F0-08 (Append-only audit log capture)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-10, OQ-22, OQ-29, OQ-09, OQ-33
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-34

## Inputs
- Event data
- Completion actions

## Outputs
- Occurrence list with status, actor, assignee

## Error / Edge Cases
- Completion recorded against an occurrence later cancelled → completion remains in history.
- Two users mark Done simultaneously → single effective Done; both attempts audited (PROPOSED idempotency).

## Security / Permissions
- Completions cannot be updated or deleted by any role.
- Actor identity taken from auth.uid(), never from client input.

## Technical Considerations
- Occurrence key = `${eventId}:${originalStartISO}`.
- Index (client_id, starts_at) and (event_id, original_start).

## Traceability
- Product requirements: REQ-13 (Care events (Care Need Items) can be one-off or recurring, with no limit on number.), REQ-14 (Schedules are perpetual: recurrences carry forward indefinitely without re-entry and can b…), REQ-15 (A single occurrence can be cancelled or modified without affecting the series.), REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …), REQ-18 (Family and Carers can create events and mark them Done; no approval step.), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: BRIEF I, II, items 1–4, 7; FR-1.x, FR-2.x, FR-3.x; TM-0409 (append-only completions); UI-D18, D26, D33; CM-0309 (tasks require date and time; no approval); Design: Family Home, Calendar, Edit event, Task log, Task detail
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
