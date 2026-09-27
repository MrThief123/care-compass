# CAR-UI-03 — Carer Calendar screen (UI)

| Field | Value |
|---|---|
| Feature ID | CAR-UI-03 |
| Dashboard / stream | Carer |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-ui-calendar` |
| Documentation | `docs/development/carer-dev/carer-ui-calendar/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D5–D6 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Carer · Calendar UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Carer · Calendar screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Carer

## Scope
Rewritten by CHG-025 and CHG-030 (2026-09-26), before implementation started; amended by CHG-031 (2026-09-26): the calendar is part of Carer Home, not a route of its own.
- Carer Home's calendar card (`/carer/home`), with Notifications beside it from 1280px and below it under that. No `/carer/calendar` route and no Carer rail Calendar item.
- Section 'Shifts' with D/W/M, Previous/Next and Today; the URL holds `?view=&date=&month=` as on Family · Calendar (default Day, today). Family's `calendar-params` helpers are imported, not edited. The arrows and Today are a design gap, built from tokens.
- Blocks are the signed-in carer's shifts: client first name and time range, no status pill, no event titles (`WeekGrid` in Week, `DayTimeline` in Day, `MonthGrid` in Month).
- Clicking a shift block opens `/carer/patients/[clientId]`.
- No 'Tasks for the selected shift' panel and no checklist (CHG-025).
- New contract `getCarerShifts(carerId, range)` in `src/server/shifts/queries.ts` with its mock (CHG-030, flagged for review).
- Loading skeleton, empty state and error state (States sheet).
- Data only via `src/server/**` contract functions (mock data source).

## Out of Scope
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload.

## UI / UX Requirements
- Pixel-level match to the design image in `docs/design/screens/`; attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-01 (Calendar kit: week/day/month grids, event blocks, date picker), UI-03 (Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions: none (OQ-33 is ANSWERED; PD-043 (a) is amended by CHG-025)

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
- Sources: Design: Carer · Calendar; UI-D8, D13
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
