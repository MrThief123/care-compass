# INT-05 — Access-control regression matrix

| Field | Value |
|---|---|
| Feature ID | INT-05 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-access-control-regression` |
| Documentation | `docs/development/shared/shared-access-control-regression/` |
| Lane | I — Integration |
| Sprint | STRETCH · planned D12–D13 |
| Status / owner | See PROGRESS.md |

## Purpose
Security hardening.

## Problem
Policies accumulate across features; gaps appear at boundaries.

## Description
A single, maintained suite proving every role can do exactly what it should across all tables and routes.

## User value
Protects vulnerable people's health and financial data against regressions.

## Users
- System

## Scope
- docs/security/PERMISSION_MATRIX.md generated from tests.
- pgTAP matrix covering all client-scoped tables.
- Route access tests for every dashboard route per role.
- OWASP checks: input validation, no service-role in client bundle, signed URLs expiry.

## Out of Scope
- Penetration testing by third party

## Functional Requirements
- —

## UI / UX Requirements
- —

## Dependencies
- Features: FAM-15 (Family — Task detail), CAR-06 (Carer — Mark tasks done), ADM-07 (Admin — Assign shift)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Schema

## Outputs
- Matrix + tests

## Error / Edge Cases
- New table without RLS → test fails (enumerate tables from catalog).

## Security / Permissions
- —

## Technical Considerations
- Catalog query asserting `relrowsecurity` on all public tables.

## Traceability
- Product requirements: REQ-03 (Authorisation enforced by the database (RLS) on every read and write.), REQ-N4 (Security: TLS, hashed credentials, session expiry/refresh, input validation, OWASP Top 10 …), REQ-N5 (Privacy aligned with Australian Privacy Principles; data download only with family/POA app…)
- Sources: NFR-3; ADR-01..03; TM-2808 (integration tests for access policies, every role); TM-0409 (negative tests)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
