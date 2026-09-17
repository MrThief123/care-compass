# ADM-UI-02 — Admin Manage screen (UI)

| Field | Value |
|---|---|
| Feature ID | ADM-UI-02 |
| Dashboard / stream | Admin |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-ui-manage` |
| Documentation | `docs/development/admin-dev/admin-ui-manage/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D4–D5 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Admin · Manage UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Admin · Manage screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Admin

## Scope
- Route `/admin/manage` inside the admin layout.
- Staff column (290px) and Clients column (290px) with search and `SelectableListRow`s.
- Assign shift panel: summary 'Aisha Rahman → Margaret' + Clear; Date `DatePickerGrid` with dots; Time slot `ChipGroup` incl. Custom; `InlineAlert` overlap warning computed from fixture shifts; Cancel + Assign shift (local only).
- No Repeat control (D31).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Out of Scope
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload.

## UI / UX Requirements
- Pixel-level match to the design image in `docs/design/screens/`; attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-01 (Calendar kit: week/day/month grids, event blocks, date picker), UI-02 (Forms kit: fields, settings cards, side panels, chips, modal, event form), UI-03 (Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-09, OQ-21, OQ-39

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
- Sources: Design: Admin · Manage; UI-§7.14, D20, D30, D31
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
