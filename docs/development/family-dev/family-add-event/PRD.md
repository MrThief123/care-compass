# FAM-06 — Family — Add event (Enter event)

| Field | Value |
|---|---|
| Feature ID | FAM-06 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-add-event` |
| Documentation | `docs/development/family-dev/family-add-event/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Create care events.

## Problem
The designed form has no title, time or duration fields although those appear on every other screen (OQ-22).

## Description
Creates a one-off or recurring event for the client using the event form shown in the Edit event design.

## User value
Families can put care needs into the perpetual schedule themselves.

## Users
- Family

## Scope
- 'Enter event' primary button in the Home right column linking to `/family/[clientId]/events/new`.
- Form fields per design: Date (input with calendar icon), Recurring (select), Description (textarea), Documents (file tiles — upload handled by FAM-08, rendered as disabled-absent until merged).
- Additional fields required by data model pending OQ-22 (title, start time, duration).
- 'Pick a date' side panel month grid with dots on days that already have events; selected day filled.
- Save event (primary) and Cancel (secondary) buttons; Cancel returns to previous page.
- Status chips excluded from Add (new events are Planned) — PROPOSED, subject to OQ-10.
- Zod validation shared with server action; plain-language field errors.

## Out of Scope
- Editing existing events (FAM-07)
- Document upload (FAM-08)
- Calendar entry point (not designed)

## Functional Requirements
- On save, event persists and user returns to Home (PROPOSED) with the new occurrence visible.

## UI / UX Requirements
- Match Edit event frame; header title 'Add event' (PROPOSED).

## Dependencies
- Features: F0-09 (Recurrence engine (pure TypeScript)), F0-11 (Care events, occurrence overrides and append-only completions), FAM-UI-03 (Family Add / Edit event screens (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-22, OQ-12, OQ-10
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-19

## Inputs
- Form values

## Outputs
- care_events row

## Error / Edge Cases
- Recurring 'Weekly' with date in the past → allowed; past occurrences immediately appear Overdue? PROPOSED: occurrences before creation time are not generated; confirm.

## Security / Permissions
- Server action verifies family link; client_id not trusted from hidden input without check.

## Technical Considerations
- Reuse EventForm from the UI kit (UI-02).

## Traceability
- Product requirements: REQ-13 (Care events (Care Need Items) can be one-off or recurring, with no limit on number.), REQ-14 (Schedules are perpetual: recurrences carry forward indefinitely without re-entry and can b…), REQ-18 (Family and Carers can create events and mark them Done; no approval step.)
- Sources: UI-§4 screen 3; CM-0309 (family can create tasks; tasks require date and time); US C-5 / P; Design: Family · Edit event (form reused for add); Design: Family · Home 'Enter event' button
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
