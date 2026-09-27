# CAR-UI-01 — Carer Home screen (UI)

| Field | Value |
|---|---|
| Feature ID | CAR-UI-01 |
| Dashboard / stream | Carer |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-ui-home` |
| Documentation | `docs/development/carer-dev/carer-ui-home/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D4 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Carer · Home UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Carer · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Carer

## Scope
_Rewritten by CHG-025 (2026-09-26); the original scope listed event rows, a Tasks card and Admin/Family notifications._
- Route `/carer/home` inside the carer layout.
- 'Today's calendar' card: one row per shift the signed-in carer has today, showing the time range and the client's first name (e.g. '08:00–12:00 · Margaret'). No status pill, no event rows.
- 'Notifications' card to the right of 'Today's calendar' (where the design's 'Tasks' card was): `NotificationRow`s, shift assigned/changed/cancelled only, each with the 'Admin' chip.
- No 'Tasks' card and no checkboxes on the screen.
- Header 'Home' with bell (already rendered by the carer layout, F0-15).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source): `getCarerTodayShifts(carerId)` and `getCarerNotifications(carerId)`, added by this feature under CHG-025.

## Out of Scope
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload.

## UI / UX Requirements
- Match the design image in `docs/design/screens/carer-01-home.png` for header, card, row and chip styling. The layout and calendar rows differ from the image under CHG-025 (design gap, built from tokens — flag for review); attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-03 (Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view)
- Blocking open decisions (must be answered before START FEATURE): None
- Decisions: OQ-14 (PD-048) and OQ-33 (PD-043) are ANSWERED, both amended by CHG-025. CHG-009 (tasks and plain events) no longer reaches this screen, which shows no events.

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
- Sources: Design: Carer · Home; UI-D34
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
