# INT-06 — Accessibility verification across dashboards

| Field | Value |
|---|---|
| Feature ID | INT-06 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-accessibility-verification` |
| Documentation | `docs/development/shared/shared-accessibility-verification/` |
| Lane | I — Integration |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

## Purpose
Accessibility assurance.

## Problem
—

## Description
Verifies WCAG 2.1 AA across Family, Carer and Admin screens.

## User value
Older and less technical users can use the app (NFR-2, top client complaint).

## Users
- All users

## Scope
- @axe-core/playwright on each route.
- Keyboard-only traversal of primary journeys.
- docs/ACCESSIBILITY_REPORT.md; each defect becomes a dashboard bug feature.

## Out of Scope
- Fixing defects inside this feature (raised separately)

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: FAM-15 (Family — Task detail), CAR-09 (Carer — Settings), ADM-10 (Admin — Settings)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- App

## Outputs
- Report + tests

## Error / Edge Cases
- —

## Security / Permissions
- —

## Technical Considerations
- —

## Traceability
- Product requirements: REQ-N1 (Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; des…), REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…)
- Sources: UI-§5.4; DD §7; NFR-2
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
