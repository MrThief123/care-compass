# INT-04 — End-to-end: admin rostering journey

| Field | Value |
|---|---|
| Feature ID | INT-04 |
| Dashboard / stream | Admin |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-assign-shift-e2e` |
| Documentation | `docs/development/admin-dev/admin-assign-shift-e2e/` |
| Lane | I — Integration |
| Sprint | SPRINT · planned D12 |
| Status / owner | See PROGRESS.md |

## Purpose
Cross-dashboard verification.

## Problem
—

## Description
Verifies rostering across Admin, Carer and Family dashboards.

## User value
Proves shifts drive carer access, notifications and family visibility.

## Users
- Admin
- Carer
- Family

## Scope
- Playwright journey across three contexts.

## Out of Scope
- New functionality

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: ADM-07 (Admin — Assign shift), CAR-02 (Carer — Notifications card and bell), CAR-05 (Carer — Calendar (shifts) and selected-shift tasks), FAM-01 (Family Home — Today day-view timeline)
- Blocking open decisions (must be answered before START FEATURE): OQ-09, OQ-33
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Seed

## Outputs
- E2E suite

## Error / Edge Cases
- Overlap warning shown but assignment proceeds.

## Security / Permissions
- —

## Technical Considerations
- —

## Traceability
- Product requirements: REQ-23 (Admins assign a carer to a client for a date and time slot (or custom time); overlapping s…), REQ-25 (Carers see all their assigned shifts in a calendar with the tasks for a selected shift.), REQ-26 (Family sees which carer is assigned each day.), REQ-32 (Carers have an in-app notifications panel (e.g. new shift, family updates).)
- Sources: Sequence UC3; UI-D8, D25, D34
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
