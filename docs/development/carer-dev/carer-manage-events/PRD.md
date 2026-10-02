# CAR-07 — Carer — Add and edit events for a patient

| Field | Value |
|---|---|
| Feature ID | CAR-07 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` |
| Feature branch | `feature/carer-manage-events` |
| Documentation | `docs/development/carer-dev/carer-manage-events/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D15–D16 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Let a carer add and edit care events for a patient while on shift.

## Problem
Carers see tasks and tick them off (CAR-06) but cannot record a need they observe, or fix an event, without asking the family. CAR-06 deliberately left every Add event and Edit event control off the carer screens (CHG-043).

## Description
Implements sequence Use Case 2: a carer opens a rostered patient's Calendar and adds a task with date, time, description and documentation. Rewritten by CHG-048 (2026-10-02): the backend already allows it (`care_events_insert/update` use `can_edit_care_events`, which accepts an on-shift carer, F0-11, PD-041), `createEvent` and `updateEvent` already exist (FAM-06, FAM-07), and the Calendar and Task detail already take `canAddEvent` and `canEdit` flags (CHG-043). CAR-07 is therefore carer routes, entry points and states, not a new form or a migration.

## User value
Carers can record needs they observe while caring, and the family sees them at once.

## Users
- Carer (on shift)

## Scope
- **Add event** at `/carer/patients/[clientId]/events/new`: the Family `EventFormScreen` in add mode, unchanged (Title, Start time, Duration, Date, Recurring, task switch, Cost and Paid from, Description, Documents). Saves through `createEvent`; Save and Cancel return to the Calendar view it was opened from, else to the patient's Home tab, all under `/carer/patients/<id>/`.
- **Edit event** at `/carer/patients/[clientId]/events/[eventId]/edit?occurrence=<key>`: the Family edit screen under the carer path, with the occurrence/series scope choice for a recurring event. Saves through `updateEvent`; Save and Cancel return to that occurrence's carer Task detail.
- **Entry points, on shift only** (absent, not disabled, when off shift): 'Enter event' on the patient's Calendar toolbar; 'Add event for <first name>' on the patient's card in Patients; 'Edit event' on the carer Task detail.
- **Off shift:** both routes redirect to the patient's Calendar (which shows the View only notice). A patient the carer has no shift with redirects to Patients (`findCarerPatient`).
- **Shift ends mid-form:** the database refuses the save; the form stays as typed and shows "Your shift with <first name> has ended, so this event wasn't saved."; no navigation.
- Documents attach and upload as on Family (storage and `documents` RLS already admit an assigned carer).
- Additive Lane F edit only: optional `notAllowedMessage` prop on `EventFormScreen`, default unchanged (CHG-048).

## Out of Scope
- Saving an event's cost and bucket (shown as on Family, PD-058, but not persisted for anyone yet; a separate feature, not this one).
- Carer expense capture (CAR-08, retired).
- Deleting events; event notes and comments (OQ-34).
- Any migration or RLS change.

## Functional Requirements
- Same validation as FAM-06 (Date, Title, Start time, Duration) and FAM-07.
- Authorisation lives in RLS: an on-shift carer only, for that patient's events only. The UI hides controls but never grants access.
- A carer-created or carer-edited event is the same row family sees: it appears on the family Calendar with no approval step (REQ-18).

## UI / UX Requirements
- Visuals reuse the Family event form and the carer patient area; nothing new is drawn. The entry points are the OQ-19 design gaps (carer add-event entry): built from tokens and existing patterns, flagged "design gap, built from tokens, please review" in the PR (OQ-19 answer).
- 44×44px targets; the shift-ended message is text in a `role="status"` region, not colour alone.

## Dependencies
- Features: CAR-04 (Carer — Client info), F0-11 (Care events, occurrence overrides and append-only completions), UI-02 (Forms kit: fields, settings cards, side panels, chips, modal, event form) — all merged. Also builds on CAR-06 (carer Calendar and Task detail), FAM-06 and FAM-07 (`createEvent`, `updateEvent`, the form) and F0-23 (document linking).
- Blocking open decisions (must be answered before START FEATURE): OQ-09, OQ-22, OQ-19 — all ANSWERED (PD-041, PD-047, OQ-19 answer)
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- The event form (Family `EventFormScreen`).

## Outputs
- A `care_events` row (created or updated) that the family Calendar shows.

## Error / Edge Cases
- Shift ends mid-form → save rejected, specific message, form keeps its values.
- Shift has not started or already ended when the route is opened → redirect to the Calendar.
- Unknown event id, or another client's event, on Edit → not found (as Family).
- `createEvent`/`updateEvent` fails for another reason → "Couldn't save. Please try again." (existing).

## Security / Permissions
- Active shift required (`start ≤ now < end`, PD-041); RLS decides. Read-only carers see no entry point and cannot reach the routes.

## Technical Considerations
- Reuse `EventFormScreen`, `createEvent`, `updateEvent`, `linkDocumentsToEvent`, the Family route helpers' `basePath` and `carerPatientBase`. No new dependency, no second pattern.
- `src/app/(carer)/**` and `src/features/carer-*` are Lane C; the `notAllowedMessage` prop is the only Lane F touch (CHG-048).

## Traceability
- Product requirements: REQ-18 (Family and Carers can create events and mark them Done; no approval step.)
- Controlled change: CHG-048
- Sources: Design Sequence Diagram Use Case 2; CM-0309 (family and carers can create tasks); FR-5.2; US C-2, C-5
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
