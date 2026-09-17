# INT-02 — End-to-end: organisation transfer journey

| Field | Value |
|---|---|
| Feature ID | INT-02 |
| Dashboard / stream | Family |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-organisation-transfer-e2e` |
| Documentation | `docs/development/family-dev/family-organisation-transfer-e2e/` |
| Lane | I — Integration |
| Sprint | SPRINT · planned D12 |
| Status / owner | See PROGRESS.md |

## Purpose
Cross-dashboard verification.

## Problem
Individual feature tests do not prove the combined journey.

## Description
Verifies the full transfer: family changes organisation, old admin and carers lose access, new admin sees the client, history retained.

## User value
Proves the highest-risk privacy workflow works across dashboards.

## Users
- Family
- Admin
- Carer

## Scope
- Playwright multi-user test using seed data.
- Fix-forward only for defects inside scope; other defects logged as new features.

## Out of Scope
- New functionality

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: FAM-13 (Family — Change organisation), ADM-04 (Admin — Clients list and add client), CAR-03 (Carer — Patients)
- Blocking open decisions (must be answered before START FEATURE): OQ-06, OQ-15
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Seed

## Outputs
- E2E suite

## Error / Edge Cases
- Old carer has open page during transfer → next action rejected.

## Security / Permissions
- —

## Technical Considerations
- Separate browser contexts per role.

## Traceability
- Product requirements: REQ-04 (A client belongs to one organisation at a time; the family can move the client to another …), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: Sequence UC1; UI-D24, D36; CIS5 multi-organisation
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
