# F0-06 — Identity, organisation and client access schema with RLS

| Field | Value |
|---|---|
| Feature ID | F0-06 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-tenancy-schema-rls` |
| Documentation | `docs/development/shared/shared-tenancy-schema-rls/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D3–D4 |
| Status / owner | See PROGRESS.md |

## Purpose
Put authorisation in the database so every query is filtered correctly.

## Problem
Care data is health and financial information about a vulnerable person; a missed application-layer check would leak it (ADR-03).

## Description
Creates the core access model: which organisation a client currently belongs to, which family members hold authority, which carers are assigned, and database-enforced visibility for each role.

## User value
Implements the central security requirement: users only ever see clients they are authorised for.

## Users
- Family
- Carer
- Admin

## Scope
- Enums: `app_role` (family, carer, admin).
- Tables: `organisations`, `profiles` (1:1 auth.users; role, organisation_id nullable for family, first_name, last_name, phone, job_title, is_active), `clients` (current organisation_id, name, date_of_birth, suburb, avatar_path), `client_family_members` (client_id, profile_id, relationship_label), `carer_client_assignments` (carer profile, client, organisation, started_at, ended_at).
- SQL helper functions (SECURITY DEFINER, stable, search_path fixed): `current_profile()`, `is_family_of(client_id)`, `is_admin_of_client(client_id)`, `is_assigned_carer(client_id)`.
- RLS enabled on every table with policies: family reads own linked clients; admin reads clients whose current organisation is theirs; carer reads clients with an active assignment; nobody reads other organisations' profiles except display names needed on shared records (PROPOSED view).
- Inactive profiles (is_active = false) match no policy.
- pgTAP tests in `supabase/tests/` covering every role × table × allowed/denied case.
- `client_info_sections` table (client_id, key description|habits|medical_history, body, updated_by, updated_at) with RLS: family read/write, assigned carer read (write per OQ-09), admin none. Moved here from FAM-09 in plan v0.2 so Family and Carer wiring can run in parallel.

## Out of Scope
- Shifts (F0-10)
- Events (F0-11)
- Budget (F0-12)
- Organisation transfer function (FAM-13)
- Sign-in UI (F0-07)
- Account invitation flows (OQ-08)

## Functional Requirements
- Role and organisation are read live from `profiles` inside policies, not from cached JWT claims (ADR-03).
- Assignment-based carer visibility, not organisation-wide visibility (ADR-03 driver 3).

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-04 (Environment configuration and Supabase integration)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-07, OQ-09, OQ-16
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-30

## Inputs
- Supabase auth users

## Outputs
- Migrations
- RLS helpers
- pgTAP suite
- Regenerated DB types

## Error / Edge Cases
- A family member linked to two clients (OQ-30) sees both, never others.
- A carer whose assignment has ended_at in the past loses read access immediately.

## Security / Permissions
- Every new client-scoped table must enable RLS in the same migration (ADR-03 consequence).
- SECURITY DEFINER functions set `search_path = public` and are not callable to escalate privileges.

## Technical Considerations
- Migrations via `supabase migration new`; never edit applied migrations.
- Money not involved here.

## Traceability
- Product requirements: REQ-03 (Authorisation enforced by the database (RLS) on every read and write.), REQ-04 (A client belongs to one organisation at a time; the family can move the client to another …), REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…), REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: ADR-01; ADR-03; CIS3 Order of Access 2–4; CIS5 Q&A (multi-organisation); CM-1908; CM-0409; UI-D2, D3; US P-12..P-15
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
