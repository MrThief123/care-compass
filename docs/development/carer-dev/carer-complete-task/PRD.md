# CAR-06 — Carer — Mark tasks done

| Field | Value |
|---|---|
| Feature ID | CAR-06 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` |
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
Rewritten by CHG-043 (2026-10-01), which builds on CHG-026 and CHG-028: the carer ticks off from the patient's own screens, and CAR-06 wires those screens.
- **Calendar tab** (`/carer/patients/[clientId]/calendar`): the Family Calendar (D/W/M grid, Tasks panel, Log panel) read through the carer's account. Ticking in the Tasks panel calls `setOccurrenceDone` / `setOccurrenceUndone` and records the signed-in carer and the time.
- **On shift only:** the tick boxes exist only while a shift with this patient is in progress (`CarerPatientRow.onShift`). Otherwise the Tasks panel lists the day's tasks with their status as text, with no checkboxes (absent, not disabled), and the View only notice shows.
- **Home tab** (`/carer/patients/[clientId]/home`): the Family Home read-only through the carer's account, Budget strip included but without its 'View breakdown' link. No ticking and no Add event link.
- **Care log tab** (`/carer/patients/[clientId]/tasks`, plus the task detail it opens): the Family Care log and Task detail, read-only for carers (no Edit event link).
- **Base path:** the Family modules these tabs reuse take an optional `basePath` (default `/family/<id>`) so every link stays under `/carer/patients/<id>`, plus flags that hide Add event, Edit event and the budget link. Defaults keep Family behaviour and tests unchanged.
- Optimistic update with revert and an inline error on failure (the Family behaviour, FAM-05).

## Out of Scope
- Evidence upload on completion (CIS5; not designed — parked)
- Comments (OQ-34)
- Expense on completion (CAR-08, retired)
- Adding or editing events as a carer (CAR-07, post-sprint): no Add event or Edit event link on any carer screen
- Ticking from Carer Home or the Carer Calendar (CHG-025)
- Budget, family Settings and the Info tab (CAR-04, done)

## Functional Requirements
- The completion actor is the signed-in carer's full name (CHG-032), e.g. 'Done · Aisha Rahman', visible to the family immediately.
- The tick is recorded by `set_occurrence_done` (F0-11), which refuses it unless a shift with the client is in progress; the actor comes from the session, never from the client.

## UI / UX Requirements
- Checked items struck through and muted.

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), F0-11 (Care events, occurrence overrides and append-only completions), F0-18 (Carer view access derived from shifts, CHG-027), CAR-UI-02 (Carer Patients and patient info screens (UI)), CAR-04 (Carer — Client info)
- Dependency note: the Carer Home and Carer Calendar UI features were dropped as dependencies, because carers tick tasks off from the patient's screens (CHG-026).
- Blocking open decisions (must be answered before START FEATURE): OQ-09, OQ-10, OQ-33
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-34

## Inputs
- occurrence

## Outputs
- Completion

## Error / Edge Cases
- Shift ends between render and click → server rejects; checkbox reverts with message.
- A carer opens a patient with no shift in progress → read-only Calendar, Home and Care log.
- A patient with no current or future shift is not visible at all (PD-041, unchanged).

## Security / Permissions
- Server/RLS enforce active shift; actor from session.

## Technical Considerations
- Shared completion action from F0-11/FAM-05; `loadFamilyCalendar` calls `getCurrentUser("family")`, so it takes the role (or the actor name) as a parameter for carers.
- Lane F files (`src/features/family-*`) are edited additively, on the human's instruction (CHG-043).

## Traceability
- Product requirements: REQ-18 (Family and Carers can create events and mark them Done; no approval step.), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…)
- Sources: BRIEF II, item 7; CIS5 Q&A (tick off; record carer name including temporary staff); CM-0309 (no approval); CM-0409; UI-D26, D33; US C-9
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
