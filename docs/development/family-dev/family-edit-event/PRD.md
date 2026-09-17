# FAM-07 — Family — Edit event

| Field | Value |
|---|---|
| Feature ID | FAM-07 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-edit-event` |
| Documentation | `docs/development/family-dev/family-edit-event/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Modify events safely without losing history.

## Problem
Editing a recurring series vs one occurrence is not designed; Status chips include 'Overdue' which should be system-derived.

## Description
The 'Edit event' screen, prefilled, reached from Task detail 'Edit' or a calendar event block.

## User value
Care needs change over time (CIS5); families can adjust without re-entering.

## Users
- Family

## Scope
- Route `/family/[clientId]/events/[eventId]/edit?occurrence=<originalStart>`; header title 'Edit event'.
- Prefilled EventForm; Status chips Planned / Done / Overdue per OQ-10 resolution.
- Edit scope (this occurrence / this and future / entire series) per OQ-11 — not built until answered.
- Save writes event update or occurrence override; history (completions) untouched.
- Entry points: clicking an event block in FAM-04 and 'Edit' in Task detail (FAM-15).

## Out of Scope
- Deleting events (not designed; use deactivate per FR-1.2 later)
- Carer editing (CAR-07)

## Functional Requirements
- Changes are audited (F0-08).

## UI / UX Requirements
- Match Edit event frame exactly.

## Dependencies
- Features: FAM-06 (Family — Add event (Enter event))
- Blocking open decisions (must be answered before START FEATURE): OQ-10, OQ-11, OQ-22
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- eventId
- occurrence
- form

## Outputs
- Updated event or override

## Error / Edge Cases
- Edit an occurrence that is already Done → completion remains attached to originalStart.

## Security / Permissions
- Linked family only.

## Technical Considerations
- Reuses EventForm.

## Traceability
- Product requirements: REQ-14 (Schedules are perpetual: recurrences carry forward indefinitely without re-entry and can b…), REQ-15 (A single occurrence can be cancelled or modified without affecting the series.), REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …)
- Sources: UI-D9 (editable); CIS5 (change cycles later); FR-2.5; US C-6; Design: Family · Edit event
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
