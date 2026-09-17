# INT-08 — Release readiness and client handover

| Field | Value |
|---|---|
| Feature ID | INT-08 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-release-readiness-handover` |
| Documentation | `docs/development/shared/shared-release-readiness-handover/` |
| Lane | I — Integration |
| Sprint | STRETCH · planned D13 |
| Status / owner | See PROGRESS.md |

## Purpose
Release and handover.

## Problem
Hosting and availability targets are undecided.

## Description
Prepares the application and documentation for release to main and handover to a non-technical client.

## User value
The client can keep using and extending the system after the team leaves (NFR-9, CM-0309).

## Users
- Client (Peter)
- Future developers

## Scope
- docs/handover/USER_GUIDE.md per role with screenshots.
- docs/handover/GLOSSARY.md.
- docs/handover/DEPLOYMENT_RUNBOOK.md incl. environments, secrets, backups, restore test.
- docs/handover/COSTS.md (running costs; CIS3 asked about fees).
- Release checklist for dev → main promotion.

## Out of Scope
- Operating the production system

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: INT-02 (End-to-end: organisation transfer journey), INT-03 (End-to-end: carer care delivery journey), INT-04 (End-to-end: admin rostering journey)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-17
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-18

## Inputs
- System

## Outputs
- Handover pack

## Error / Edge Cases
- —

## Security / Permissions
- No secrets in docs.

## Technical Considerations
- —

## Traceability
- Product requirements: REQ-N9 (Maintainable with comprehensive plain-English handover documentation.), REQ-N11 (Deployment accessible to multiple users; 99.9% availability, daily backups, 1-hour redeplo…)
- Sources: BRIEF 'Clients Wish to Accomplish' (comprehensive access code and instructions); CIS1 #4 (explain simply, define terms); CM-0309 (comprehensive handover documentation); NFR-8, NFR-9; ADR-01 (free tier not sufficient for 99.9%)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
