# F0-18 — Carer view access derived from shifts

| Field | Value |
|---|---|
| Feature ID | F0-18 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-carer-shift-access` |
| Documentation | `docs/development/shared/shared-carer-shift-access/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Added by CHG-027, 2026-09-26.** Brings the database in line with PD-041.

## Purpose
Make a carer's read access to a client follow their shifts, as PD-041 requires.

## Problem
Edit access already follows shifts (`carer_on_active_shift()`, F0-10). Read access does not: `is_assigned_carer()` (F0-06) reads the `carer_client_assignments` table, which nothing fills from shifts. Scheduling a future shift does not let the carer see the client, and the last shift ending does not take access away. PD-041 said there should be no assignment table; ARCHITECTURE.md was never updated, so F0-06 built one.

## Description
Redefine `is_assigned_carer(client_id)` as: the signed-in, active carer has at least one non-cancelled shift with that client whose end is after now. Retire `carer_client_assignments` and everything that uses it. Update ARCHITECTURE.md.

## User value
A carer sees exactly the clients they are rostered to from now on, and nobody else; access starts when the shift is scheduled and ends the moment their last shift with that client ends.

## Users
- Carer (access), Admin (schedules shifts), Family (their client's data is protected)

## Scope
- Migration: `create or replace function is_assigned_carer(p_client_id uuid)` over `shifts` (`carer_id = auth.uid()`, carer profile `is_active`, `cancelled_at is null`, `ends_at > now()`). Keep the name and signature so every policy that calls it (clients, care events, and the rest) changes behaviour without being rewritten.
- Drop `carer_client_assignments`: its select policy, its audit trigger (F0-08), and the `update carer_client_assignments` step in `transfer_client_organisation()` (the function already cancels future shifts and ends the current one, which now ends access too).
- Update pgTAP tests that insert into `carer_client_assignments` (`tenancy_rls`, `care_events`, `transfer_client_organisation`) to set up shifts instead; record each test change in this feature's DECISIONS.md (CLAUDE.md §5).
- Regenerate `src/lib/supabase/database.types.ts`.
- ARCHITECTURE.md: replace "Carer read access: active row in `carer_client_assignments`" and the `carer_client_assignments` table row with the shift-derived rule (controlled change, covered by CHG-027).

## Out of Scope
- Edit access (`carer_on_active_shift()` already matches PD-041).
- Any UI. Carer screens run on fixtures until their Phase 3 wiring features.
- Sign-in/sign-out history.

## Functional Requirements
Worked example from the human (shift 09:00–15:00, Melbourne time):
- 08:00: can view, cannot edit.
- 09:00 to 15:00: can view and edit (start inclusive, end exclusive).
- After 15:00 with a later shift with the same client: can view, cannot edit.
- After 15:00 with no later shift with that client: cannot view.
- A cancelled shift gives no access. A deactivated carer has no access.
- A shift with a different client gives no access to this client.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-10 (Shifts schema, active-shift function and conflict query), F0-08 (Append-only audit log capture)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Security / Permissions
- Security-definer function with `set search_path = public`, as today. Every client-scoped table keeps RLS on.

## Traceability
- Decisions: PD-041, CHG-027. Resolves the ARCHITECTURE.md gap PD-041 flagged.
- Requirements: REQ-05 (carers see only assigned clients; read while assigned; edit only during an active shift).

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements.
