# CAR-UI-02 — Carer Patients and patient info screens (UI)

| Field | Value |
|---|---|
| Feature ID | CAR-UI-02 |
| Dashboard / stream | Carer |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-ui-patients-info` |
| Documentation | `docs/development/carer-dev/carer-ui-patients-info/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D4–D5 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Carer · Patients (and patient info) UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Carer · Patients (and patient info) screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Carer

## Scope
Updated by CHG-026 and CHG-028 (human, 2026-09-26).
- Route `/carer/patients` inside the carer layout: `PersonCard` grid, 4 columns, one card per patient the carer can see, i.e. has a current or future shift with (PD-041). Card meta is `<age> years · <suburb>`. Order: soonest shift first (FD-03).
- Search field 'Search patients': client-side filter on first name, case-insensitive; zero matches shows the kit's no-results message.
- Each card is a link to `/carer/patients/[clientId]`, which redirects to the patient's Home tab (CHG-029). Each card states in text whether the patient is 'On shift · can edit' or 'View only' (CHG-029).
- Patient area `/carer/patients/[clientId]/…`: the carer rail stays with Patients active. A patient header shows 'Back to patients', the avatar, first name and `<age> years · <suburb>`, and a tab strip: **Home · Info · Calendar · Care log** (`home`, `info`, `calendar`, `tasks`, CHG-029). The current tab has `aria-current="page"`.
- **Info** tab reuses `FamilyInfoView` (Family Info layout) with `canEdit` = the carer is on a shift with this patient right now. Off shift, the Edit and Add file controls are absent, not disabled, and a 'View only' notice says the carer can edit once their shift with the patient starts (CHG-029).
- **Home, Calendar, Care log** tabs have routes that show a holding state ('Coming soon') for now. The Family components hardcode `/family/…` links and have no read-only mode, and Lane C may not edit them (CHG-026), so they are wired later by CAR-04 after a Lane F change (CHG-028).
- A patient the carer can't see (no current or future shift, or an unknown id) renders Next.js not-found.
- Loading skeleton, empty state ('No patients assigned yet') and error state ('Something went wrong' / 'Try again'), for the grid and for Info.
- Data only via `src/server/**` contract functions (mock data source): a new `getCarerPatients(carerId)` in `src/server/shifts/queries.ts`.

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload.

## UI / UX Requirements
- Pixel-level match to the design image in `docs/design/screens/`; attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-03 (Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-09, OQ-19

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
- Sources: Design: Carer · Patients; Design: States sheet; UI-D10, D29; CM-0309
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
