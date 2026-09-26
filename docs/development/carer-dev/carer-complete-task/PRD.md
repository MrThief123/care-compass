# CAR-06 — Carer — Mark tasks done

| Field | Value |
|---|---|
| Feature ID | CAR-06 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-complete-task` |
| Documentation | `docs/development/carer-dev/carer-complete-task/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Record carer completions.

## Problem
Carers may only edit during their active shift.

## Description
Lets carers complete occurrences with their identity recorded, respecting shift-based edit rights.

## User value
Accurate, safeguarded record of who provided care and when (brief II, item 7).

## Users
- Carer

## Scope
- Checkboxes on Home Tasks card and Calendar task panel call `set_occurrence_done`.
- Checkboxes rendered interactive only during an active shift for that client; otherwise read-only state display.
- Optimistic update with revert on failure.

## Out of Scope
- Evidence upload on completion (CIS5; not designed — parked)
- Comments (OQ-34)
- Expense on completion (CAR-08)

## Functional Requirements
- Completion actor 'Aisha R.' visible to family immediately.

## UI / UX Requirements
- Checked items struck through and muted.

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), F0-11 (Care events, occurrence overrides and append-only completions), F0-18 (Carer view access derived from shifts, CHG-027), CAR-UI-01 (Carer Home screen (UI)), CAR-UI-03 (Carer Calendar screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-09, OQ-10, OQ-33
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-34

## Inputs
- occurrence

## Outputs
- Completion

## Error / Edge Cases
- Shift ends between render and click → server rejects; checkbox reverts with message.

## Security / Permissions
- Server/RLS enforce active shift; actor from session.

## Technical Considerations
- Shared completion action from F0-11/FAM-05.

## Traceability
- Product requirements: REQ-18 (Family and Carers can create events and mark them Done; no approval step.), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…)
- Sources: BRIEF II, item 7; CIS5 Q&A (tick off; record carer name including temporary staff); CM-0309 (no approval); CM-0409; UI-D26, D33; US C-9
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
