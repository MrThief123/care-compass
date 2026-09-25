# FAM-UI-06 — Family Settings screen (UI)

| Field | Value |
|---|---|
| Feature ID | FAM-UI-06 |
| Dashboard / stream | Family |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-ui-settings` |
| Documentation | `docs/development/family-dev/family-ui-settings/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D6 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Family · Settings UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Family · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Family

## Scope
- Route `/family/[clientId]/settings` inside the family layout.
- 'Change organisation' `SettingsActionCard` ('Currently registered with Banksia Home Care.'); 'Change' opens the destructive `ConfirmationModal` with the D36 wording (organisation picker undesigned — OQ-06).
- Family info `DetailsFormCard`: Name, Phone, Email, Address, with a 'Save' button (PD-054). Save checks the fields and keeps them in local state (FD-03).
- 'Change organisation' confirm: the dialog closes and says the picker is not available yet (FD-01).
- Reset `SettingsActionCard` with 'Reset'. It shows a simulated "emailed you a link" message and sends nothing (FD-02).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states (FD-05).
- Data only via `src/server/**` contract functions (mock data source): `getClientHeaderSummary` for the organisation name, and `getFamilyContactDetails` (added by CHG-023) for the Family info card.

## Out of Scope
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload.

## UI / UX Requirements
- Pixel-level match to the design image in `docs/design/screens/`; attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-02 (Forms kit: fields, settings cards, side panels, chips, modal, event form)
- Blocking open decisions (must be answered before START FEATURE): None
- Answered decisions applied: OQ-06 → PD-036 (family-initiated change, picker undesigned); OQ-35 → PD-054 (Save per card; email is the contact email, not the login email)
- Controlled changes: CHG-023 (contact details contract and fixtures; AC-01 shows the full name)

## Inputs
- Fixtures via `getClientHeaderSummary(clientId)`, `getCurrentUser("family")` and `getFamilyContactDetails(profileId)`

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
- Sources: Design: Family · Settings; Design: States sheet confirmation modal; UI-D36
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
