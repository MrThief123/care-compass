# FAM-02 — Family Home — Overdue card and Recent activity

| Field | Value |
|---|---|
| Feature ID | FAM-02 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-home-overdue-activity` |
| Documentation | `docs/development/family-dev/family-home-overdue-activity/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Highlight what needs attention.

## Problem
Overdue care must be obvious without colour alone.

## Description
Shows overdue occurrences and the most recent five activity items for the client on the Family landing screen.

## User value
Problems surface immediately; recent history is one glance away.

## Users
- Family

## Scope
- Overdue card (alert tone): warning icon + 'Overdue' title, alert count badge with total, rows with title, date ('Fri 27 Nov'), Overdue pill, chevron.
- Recent activity card: title, 'View all' link, 5 most recent items (title, date, status pill, chevron).
- When no overdue items: EmptyState 'All caught up / There are no overdue tasks right now.' inside the card (from States sheet).
- Chevrons and 'View all' render as links to routes owned by FAM-15 and FAM-14; until those merge, links are omitted (controls absent, not dead links).

## Out of Scope
- Task log (FAM-14)
- Task detail (FAM-15)
- Enter event button (FAM-06)

## Functional Requirements
- Overdue list = occurrences with derived status overdue, newest first (PROPOSED order matches design: Fri 27, Sat 28, Sun 29 → oldest first; confirm).
- Recent activity = latest 5 past-or-today occurrences with status Done or Overdue ordered by occurrence date desc (PROPOSED from design).

## UI / UX Requirements
- Design shows overdue ordered oldest→newest; recent activity newest→oldest.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), FAM-UI-01 (Family Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-10, OQ-31

## Inputs
- clientId

## Outputs
- Two cards

## Error / Edge Cases
- More than 5 overdue → PROPOSED show first 5 and a loading/more tile (UI-D11).

## Security / Permissions
- Same authorisation as FAM-01.

## Technical Considerations
- Reuse F0-11 query with status filter.

## Traceability
- Product requirements: REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-21 (Task log lists tasks with date, nurse and status, with server-side search and filter; each…)
- Sources: UI-§7.1; UI-D5, D27, D35; US P-4; Design: Family · Home right column
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
