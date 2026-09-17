# CAR-07 — Carer — Add and edit events for a patient

| Field | Value |
|---|---|
| Feature ID | CAR-07 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-manage-events` |
| Documentation | `docs/development/carer-dev/carer-manage-events/` |
| Lane | C — Carer |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Let carers add care events.

## Problem
No carer screen shows an add/edit event entry point.

## Description
Implements sequence Use Case 2: carer opens a rostered patient's calendar and adds a task with date, description and documentation.

## User value
Carers can record needs they observe while caring.

## Users
- Carer

## Scope
- Entry point from carer patient view (design required).
- Reuse EventForm.
- Server action authorises active-shift carers only.

## Out of Scope
- Cost/expense capture (CAR-08)

## Functional Requirements
- Same validation as FAM-06.

## UI / UX Requirements
- BLOCKED until designed.

## Dependencies
- Features: CAR-04 (Carer — Client info), F0-11 (Care events, occurrence overrides and append-only completions), UI-02 (Forms kit: fields, settings cards, side panels, chips, modal, event form)
- Blocking open decisions (must be answered before START FEATURE): OQ-09, OQ-22, OQ-19
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Form

## Outputs
- Event

## Error / Edge Cases
- Shift ends mid-form → save rejected.

## Security / Permissions
- Active shift + assignment required.

## Technical Considerations
- Reuse shared form/actions.

## Traceability
- Product requirements: REQ-18 (Family and Carers can create events and mark them Done; no approval step.)
- Sources: Design Sequence Diagram Use Case 2; CM-0309 (family and carers can create tasks); FR-5.2; US C-2, C-5
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
