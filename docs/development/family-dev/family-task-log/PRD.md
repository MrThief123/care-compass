# FAM-14 — Family — Task log

| Field | Value |
|---|---|
| Feature ID | FAM-14 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-task-log` |
| Documentation | `docs/development/family-dev/family-task-log/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D11 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-07**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Browse the full task history.

## Problem
Perpetual recurrence means 'every task' must be bounded (OQ-31); search must query the server (D32).

## Description
Drill-down page (no rail item) listing every task occurrence up to today with search and filtering.

## User value
Families can audit care history over time (D27).

## Users
- Family

## Scope
- Route `/family/[clientId]/tasks`; title 'Task log'; no rail item, Home/Calendar rail stays unselected (PROPOSED: Home active).
- Search field 'Search tasks' (server query by title, debounced) with loading and no-results states.
- Status select 'All statuses' / Planned / Done / Overdue.
- Table: DATE ('Mon 30 Nov'), TASK, NURSE ('Aisha R.' or '—'), STATUS pill, chevron; rows clickable to FAM-15.
- Range: occurrences up to end of today, newest first (PROPOSED per design, OQ-31).
- Pagination/incremental loading (PROPOSED 25 rows + load more).
- Wire 'View all' on Home Recent activity and Calendar Log.

## Out of Scope
- Admin/Carer task logs (Q14, parked PL-20)

## Functional Requirements
- Search and filter combine.

## UI / UX Requirements
- Align NURSE column consistently (design image misaligns Planned rows — OQ-39).

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), FAM-UI-07 (Family Task log and Task detail screens (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-29
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-31, OQ-39

## Inputs
- q
- status
- page

## Outputs
- Task rows

## Error / Edge Cases
- Search 'Zoe' no results → 'No matches for "Zoe".'

## Security / Permissions
- Linked family only; search input parameterised.

## Technical Considerations
- Server Component with searchParams; query built on F0-11 layer with SQL-side filtering where possible.

## Traceability
- Product requirements: REQ-21 (Task log lists tasks with date, nurse and status, with server-side search and filter; each…)
- Sources: UI-D27, D32, D35, §7.7; US P-4, P-9; Design: Family · Task log; Design: States sheet search no-results
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
