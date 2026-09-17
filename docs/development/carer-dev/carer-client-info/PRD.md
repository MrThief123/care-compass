# CAR-04 — Carer — Client info

| Field | Value |
|---|---|
| Feature ID | CAR-04 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-client-info` |
| Documentation | `docs/development/carer-dev/carer-client-info/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Give carers client information.

## Problem
D29 (carer edit rights match family) conflicts with CM-0409 (edit only during active shift); client meeting 4/9 is later and client-confirmed → default shift-limited editing, confirm via OQ-09. No carer-specific frame exists.

## Description
Reuses the Family Info view for a patient opened from Patients, with edit controls present only when the carer is on an active shift for that client.

## User value
Carers read the same care information as the family and can update it while working.

## Users
- Carer

## Scope
- Route `/carer/patients/[clientId]` using `ClientInfoView` in carer mode.
- Header: 'Patients' screen name (PROPOSED) with in-page client summary.
- Edit links and Add file tile rendered only when `carer_on_active_shift(clientId)` is true.
- No organisation or payment controls (D10).

## Out of Scope
- Carer editing outside shift
- Budget views for carers

## Functional Requirements
- RLS mirrors UI: updates rejected outside active shift.

## UI / UX Requirements
- Controls absent, not disabled (DD NFR-3).

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-10 (Shifts schema, active-shift function and conflict query), F0-13 (Client document storage), CAR-UI-02 (Carer Patients and patient info screens (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-09
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-19

## Inputs
- clientId

## Outputs
- Info page

## Error / Edge Cases
- Shift ends while editing → save rejected with message 'Your shift has ended, so changes can't be saved.' (PROPOSED copy).

## Security / Permissions
- Assigned carers only.

## Technical Considerations
- Reuse FAM-09 component merged via main sync.

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…), REQ-10 (Client information page with key descriptive, habit and medical information and documentat…)
- Sources: UI-D10, D29; CM-0409 (read while assigned, edit during active shift); CM-0309 (carers have similar client information view)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
