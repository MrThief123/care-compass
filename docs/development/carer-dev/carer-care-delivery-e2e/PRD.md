# INT-03 — End-to-end: carer care delivery journey

| Field | Value |
|---|---|
| Feature ID | INT-03 |
| Dashboard / stream | Carer |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-care-delivery-e2e` |
| Documentation | `docs/development/carer-dev/carer-care-delivery-e2e/` |
| Lane | I — Integration |
| Sprint | SPRINT · planned D12 |
| Status / owner | See PROGRESS.md |

## Purpose
Cross-dashboard verification.

## Problem
—

## Description
Carer signs in, opens a rostered patient, completes and (when CAR-07/08 exist) adds a task with cost and documentation; family sees results.

## User value
Proves carer actions flow through to the family view.

## Users
- Carer
- Family

## Scope
- Playwright journey; include CAR-07/CAR-08 steps only if those features are merged.

## Out of Scope
- New functionality

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: CAR-06 (Carer — Mark tasks done), FAM-01 (Family Home — Today day-view timeline)
- Blocking open decisions (must be answered before START FEATURE): OQ-33
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Seed

## Outputs
- E2E suite

## Error / Edge Cases
- Carer off shift cannot complete.

## Security / Permissions
- —

## Technical Considerations
- Clock control for shift windows.

## Traceability
- Product requirements: REQ-18 (Family and Carers can create events and mark them Done; no approval step.), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…)
- Sources: Sequence UC2; UI-D26, D33
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
