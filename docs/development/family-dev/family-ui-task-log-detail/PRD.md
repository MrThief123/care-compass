# FAM-UI-07 — Family Task log and Task detail screens (UI)

| Field | Value |
|---|---|
| Feature ID | FAM-UI-07 |
| Dashboard / stream | Family |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-ui-task-log-detail` |
| Documentation | `docs/development/family-dev/family-ui-task-log-detail/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D6–D7 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Family · Task log and Task detail UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Family · Task log and Task detail screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Family

## Scope
- Route `/family/[clientId]/tasks` inside the family layout.
- Task log: title, search field, 'Status' select (All statuses/Planned/Done/Overdue), `DataTable` DATE · TASK · NURSE · STATUS with chevrons.
- Task detail `/family/[clientId]/tasks/[occurrenceKey]`: 'Back to Task log', title, 'Monday 30 November 2026 · Assigned to Aisha R.', Status card with 'Completed at 09:14', Description card with Edit link to edit event, Documents card.
- Search, Status filter and paging are server-driven through `getTaskLog(clientId, {q, status, page})` and cover the whole history, not only the rows on screen (changed by CHG-005, confirmed by the human 2026-09-19; was: client-side over fixtures, D32). The URL is the state: `/family/[clientId]/tasks?q=<text>&status=<planned|done|overdue>&page=<n>`, all optional, absent status = all, page defaults to 1. Invalid or hostile values fall back safely (bad status = all, bad page = 1, page past the last = the last page, q trimmed and capped at 200 characters). A pager shows 'Showing 21-40 of 137', Previous / Next and the current page.
- Task detail links carry the validated q / status / page, and 'Back to Task log' returns to that exact view. Any task in the history can be opened, past or future.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Out of Scope
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload, except the Task log's search, Status and page, which live in the URL so links, Back/Forward and reloads show the same view (CHG-005).
- Must hold for the data users build up over time: hundreds of log rows across many pages, exactly one page, exactly one page size, one over, none; titles up to 120 characters, names up to 60, non-ASCII text.

## UI / UX Requirements
- Pixel-level match to the design image in `docs/design/screens/`; attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-03 (Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view), UI-02 (Forms kit: fields, settings cards, side panels, chips, modal, event form)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-29, OQ-31

## Inputs
- Fixtures

## Outputs
- Screen UI

## Error / Edge Cases
- Very long names/text wrap or truncate without breaking layout.

## Security / Permissions
- Mock role switch available only in development.

## Technical Considerations
- Compose shared kit components; screen-only components in `src/features/<screen>/`. Do not edit `src/components/shared/**` in this feature — request kit changes through a shared PR.

## Traceability
- Product requirements: REQ-02 (Three separate role dashboards — Family, Carer, Admin — each with its own navigation; cont…), REQ-N1 (Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; des…), REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…), REQ-N3 (Visual system follows Figma Foundations tokens, IBM Plex Sans, 88px rail, 76px header, 144…)
- Sources: Design: Family · Task log, Task detail; UI-D27, D32, D33, D35
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
