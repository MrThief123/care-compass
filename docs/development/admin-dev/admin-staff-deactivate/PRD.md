# ADM-03 — Admin — Deactivate staff

| Field | Value |
|---|---|
| Feature ID | ADM-03 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/admin-staff-deactivate` |
| Documentation | `docs/development/admin-dev/admin-staff-deactivate/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D15 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Withdraw staff access.

## Problem
No deactivate control appears in the Staff design.

## Description
Deactivates a carer account so they can no longer access organisation information while their completions remain attributed.

## User value
Access is withdrawn when staff leave (CIS5).

## Users
- Admin

## Scope
- A **Deactivate** button in the Staff Add/Edit panel (carers only, not shown when adding), with a confirmation dialog that names the carer and says what will happen (PD-039, FD-01).
- `admin_deactivate_staff(profile_id)` DB function: sets `profiles.is_active` false, cancels the carer's future shifts and ends the shift in progress now, across every client (FD-02). Nothing is deleted.
- The Staff list shows deactivated carers in a separate **Inactive** section below the active list (FD-03).
- Built from Figma tokens and existing patterns, flagged for human review in the PR (PD-052, FD-04).

## Out of Scope
- Hard delete
- Reactivating a deactivated carer (FD-03; raise as a Parking lot item if wanted)
- Service-role changes: no auth ban is needed, `is_active` already blocks RLS reads, sign-in and the route guard (FD-01)

## Functional Requirements
- Past completions keep actor names.

## UI / UX Requirements
- No design exists (OQ-19, PD-052): built from Foundations tokens, reusing `ConfirmationModal`, the Pending tag style and the ADM-08 panel patterns. Nothing overlaps at any width; long names wrap.

## Dependencies
- Features: ADM-02 (Admin — Staff list and add/edit staff)
- Blocking decisions: OQ-36 (PD-039) and OQ-19 (PD-052), both ANSWERED
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- staff id

## Outputs
- Inactive profile

## Error / Edge Cases
- Deactivated mid-shift → next request signed out: the guard (`resolveActiveProfile`) already signs out and redirects to `/sign-in?reason=inactive`; this feature adds a test, not code.
- Deactivating an already-inactive carer succeeds and changes nothing more (idempotent).
- A target that is not a carer of the caller's organisation (an admin, a family member, another organisation's carer) is refused.

## Security / Permissions
- Own organisation only.

## Technical Considerations
- One additive migration (`supabase migration new`): `admin_deactivate_staff`, SECURITY DEFINER, caller via `admin_current_org_id()` (active admin at AAL2), same pattern as `admin_end_carer_assignment`. No table change. Server Action `deactivateStaff` in `src/server/admin/staff-actions.ts` plus a mock-mode store function. Completions snapshot `actor_display_name` and carry no FK to profiles, so history is untouched.

## Traceability
- Product requirements: REQ-06 (Admins (managers/head nurses share one dashboard) manage their organisation's staff accoun…), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: CIS3 Order of Access 3; CIS5 Q&A (access withdrawn when staff leaves); FR-5.6; US A-2
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
