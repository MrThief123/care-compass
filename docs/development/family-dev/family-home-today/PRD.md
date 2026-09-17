# FAM-01 — Family Home — Today day-view timeline

| Field | Value |
|---|---|
| Feature ID | FAM-01 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-home-today` |
| Documentation | `docs/development/family-dev/family-home-today/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Reassure the family about today's care.

## Problem
Families (often 55–80) need a simple, calm view of today, not raw counts.

## Description
The left 'Today' panel on the Family landing screen: an hour-gutter timeline listing today's occurrences for the client.

## User value
The family sees at a glance what care is happening today and whether it has been done.

## Users
- Family

## Scope
- Route `/family/[clientId]/home` page shell with left Today panel region (right column and budget strip are FAM-02/FAM-03).
- Card title 'Today' and right-aligned caption 'Mon 30 Nov · day view'.
- Hour gutter 07:00–18:00, 44px rows; past hours shown in text/muted per design.
- Event blocks positioned by start time and sized by duration with #0C9BA9 left stripe, title (Body/Emphasis), carer name (e.g. 'Aisha R.'), duration ('1 hr', '1 hr 30 min'), status pill at right.
- Empty state when no events today (EmptyState primitive; copy PROPOSED 'Nothing scheduled today').
- Loading skeleton and ErrorState with Retry.

## Out of Scope
- Clicking an event block (behaviour not designed; no navigation in this feature)
- Enter event button (FAM-06)
- Overdue and Recent activity cards (FAM-02)
- Budget strip (FAM-03)

## Functional Requirements
- Occurrences from `getOccurrences(clientId, today)` in Australia/Melbourne.
- Status per F0-11 derivation.

## UI / UX Requirements
- Matches Family · Home Figma frame; tabular numerals for times.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), F0-16 (Development seed data from the design content), FAM-UI-01 (Family Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-29
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-10

## Inputs
- clientId
- today

## Outputs
- Rendered timeline

## Error / Edge Cases
- Event starting before 07:00 or ending after 18:00 → PROPOSED extend gutter to include it; record decision.
- Overlapping events → render side by side (PROPOSED).

## Security / Permissions
- Page server-renders only if the user is linked family of clientId; otherwise redirect to own home (no data leak).

## Technical Considerations
- Server Component data fetch; pure layout helper `positionBlocks()` unit-tested.

## Traceability
- Product requirements: REQ-16 (Calendar offers day, week and month views, defaulting to week, with normal conventions.), REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-26 (Family sees which carer is assigned each day.)
- Sources: UI-§7.1; UI-D14, D21, D25, D33; US P-3; Design: Family · Home
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
