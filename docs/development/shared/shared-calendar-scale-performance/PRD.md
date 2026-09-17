# INT-07 — Scale and performance verification

| Field | Value |
|---|---|
| Feature ID | INT-07 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-calendar-scale-performance` |
| Documentation | `docs/development/shared/shared-calendar-scale-performance/` |
| Lane | I — Integration |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

## Purpose
Performance assurance.

## Problem
On-demand recurrence expansion could be slow at scale.

## Description
Checks the app remains responsive with unlimited care items over long periods.

## User value
Meets 'hundreds of items, no limitation' (brief item 2) and NFR-5.

## Users
- System

## Scope
- Scale seed script (e.g. 500 recurring events per client, 50 clients).
- Measure server render times locally; PROPOSED budget p95 < 1 s for Home, Calendar week, Task log first page.
- EXPLAIN ANALYZE key queries; add indexes via migration.

## Out of Scope
- Production load testing (needs hosting, OQ-17)

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: FAM-14 (Family — Task log), ADM-01 (Admin Home — counts and overdue events)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-17

## Inputs
- Scale seed

## Outputs
- docs/PERFORMANCE_REPORT.md
- Index migrations

## Error / Edge Cases
- —

## Security / Permissions
- —

## Technical Considerations
- —

## Traceability
- Product requirements: REQ-N8 (Performs with hundreds of care items per client over a lifetime.)
- Sources: BRIEF item 2; FR-1.3; NFR-5; ADR-01 (indexing)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
