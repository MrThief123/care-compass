# CAR-03 — Carer — Patients

| Field | Value |
|---|---|
| Feature ID | CAR-03 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-patients` |
| Documentation | `docs/development/carer-dev/carer-patients/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
List assigned patients.

## Problem
Carers must not see clients they are not assigned to.

## Description
The Carer Patients screen listing clients the carer is currently assigned to.

## User value
Carers find the person they're caring for quickly.

## Users
- Carer

## Scope
- Route `/carer/patients`; search field 'Search patients' (server-side, D32).
- Person cards grid (4 columns at 1440): avatar initial, name, '78 years · Preston VIC'.
- Card click → `/carer/patients/[clientId]` (CAR-04).
- Empty state 'No patients assigned yet / New patients will appear here once they're assigned to you.'; card-grid skeleton; error state.

## Out of Scope
- Client info page (CAR-04)

## Functional Requirements
- Only currently assigned clients.

## UI / UX Requirements
- Match Carer · Patients frame.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-10 (Shifts schema, active-shift function and conflict query), F0-18 (Carer view access derived from shifts, CHG-027), CAR-UI-02 (Carer Patients and patient info screens (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-09
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- q

## Outputs
- Patient cards

## Error / Edge Cases
- Search no results → 'No matches for "<q>".'

## Security / Permissions
- RLS-enforced list.

## Technical Considerations
- Server Component.

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…)
- Sources: US C-1; UC-C01; CM-0409 (view assigned/rostered patients); CM-0309 (open client information first); Design: Carer · Patients; Design: States sheet 'No patients assigned yet'
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
