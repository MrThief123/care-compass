# CAR-05 — Carer — Calendar (shifts) and selected-shift tasks

| Field | Value |
|---|---|
| Feature ID | CAR-05 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-calendar-shifts` |
| Documentation | `docs/development/carer-dev/carer-calendar-shifts/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D9–D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Show shifts and their tasks.

## Problem
The design's 'Shifts' blocks match event times/titles rather than Manage time slots, and the task panel shows checklist sub-steps that exist nowhere else (OQ-33).

## Description
The Carer Calendar screen: calendar blocks labelled '09:00 Margaret — Morning m…' and a task panel for the selected block.

## User value
Carers see their roster and what each shift involves (D8).

## Users
- Carer

## Scope
- Route `/carer/calendar`; title 'Calendar', section 'Shifts', D/W/M default W; reuse calendar components from FAM-04.
- Blocks show time and '<Client> — <title>' truncated with ellipsis.
- Selecting a block shows 'Tasks for the selected shift' with subtitle '09:00 · Margaret — Morning medication' and a checklist (content per OQ-33).

## Out of Scope
- Ticking tasks (CAR-06)
- Shift editing (admin only)

## Functional Requirements
- Per OQ-33.

## UI / UX Requirements
- Ignore any calendar dot from wireframes (D13).

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), F0-11 (Care events, occurrence overrides and append-only completions), CAR-UI-03 (Carer Calendar screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-33
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-32

## Inputs
- view
- date
- selected

## Outputs
- Calendar

## Error / Edge Cases
- No shifts in week → empty week grid with no blocks (PROPOSED).

## Security / Permissions
- Carer's own shifts only.

## Technical Considerations
- Shared calendar components.

## Traceability
- Product requirements: REQ-25 (Carers see all their assigned shifts in a calendar with the tasks for a selected shift.)
- Sources: UI-D8, D13; Design: Carer · Calendar ('Shifts', 'Tasks for the selected shift')
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
