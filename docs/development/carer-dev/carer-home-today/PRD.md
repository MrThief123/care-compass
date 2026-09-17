# CAR-01 — Carer Home — Today's calendar and Tasks

| Field | Value |
|---|---|
| Feature ID | CAR-01 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-home-today` |
| Documentation | `docs/development/carer-dev/carer-home-today/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Show the carer's day.

## Problem
Whether 'today' includes all assigned clients' events or only those within the carer's shifts is undecided (OQ-33).

## Description
The Carer Home screen's top cards listing today's occurrences across the carer's assigned clients.

## User value
A carer on a shared laptop mid-shift sees one clear list of what to do next.

## Users
- Carer

## Scope
- Route `/carer/home`; header 'Home' with bell (bell behaviour CAR-02).
- 'Today's calendar' card: rows '09:00 · Margaret — Morning medication · status pill'.
- 'Tasks' card: checkbox list of the same occurrences (completion behaviour in CAR-06; here read-only checked state).
- Empty state 'Nothing scheduled today' (PROPOSED), skeleton and error states.

## Out of Scope
- Notifications card (CAR-02)
- Ticking tasks (CAR-06)

## Functional Requirements
- Occurrence scope per OQ-33 (default PROPOSED: occurrences for clients with a shift today overlapping the occurrence time).

## UI / UX Requirements
- Match Carer · Home frame.

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), F0-11 (Care events, occurrence overrides and append-only completions), CAR-UI-01 (Carer Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-33, OQ-09
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- session carer

## Outputs
- Today lists

## Error / Edge Cases
- Carer with no shifts today → empty state.

## Security / Permissions
- Only assigned clients' occurrences (RLS).

## Technical Considerations
- Server query `getCarerTodayOccurrences(carerId, date)`.

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…), REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …), REQ-25 (Carers see all their assigned shifts in a calendar with the tasks for a selected shift.)
- Sources: UI-§4 screen 9; DD §1 (Carer: one clear next action); US C-7; Design: Carer · Home
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
