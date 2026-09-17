# FAM-05 — Family Calendar — Tasks panel and Log panel

| Field | Value |
|---|---|
| Feature ID | FAM-05 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-calendar-tasks-log` |
| Documentation | `docs/development/family-dev/family-calendar-tasks-log/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Record and review completion from the calendar.

## Problem
Both Family and Carer can mark an event Done; the actor must be recorded.

## Description
Panels beneath the Family calendar: tick off the selected day's tasks and see a short activity log.

## User value
Family can confirm care has happened (D26) and review recent activity.

## Users
- Family

## Scope
- Tasks panel: title 'Tasks', selected date subtitle ('Monday 30 November'), checkbox per occurrence; checked items struck through and muted.
- Ticking calls `set_occurrence_done` and optimistically updates, reverting with an inline error on failure.
- Unticking behaviour per OQ-10 (not implemented until answered).
- Log panel: title 'Log', 'View all' link (to FAM-14), last 3 items (PROPOSED count from design) with status pills and chevrons (to FAM-15 once merged).

## Out of Scope
- Task log page (FAM-14)
- Task detail (FAM-15)

## Functional Requirements
- Checkbox state reflects derived status Done.

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), FAM-UI-02 (Family Calendar screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-10
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-31

## Inputs
- clientId
- selected date

## Outputs
- Completion records

## Error / Edge Cases
- Overdue occurrence ticked → becomes Done with current time as completion time.
- Network failure → checkbox reverts and 'Couldn't save. Please try again.' shown (PROPOSED copy).

## Security / Permissions
- Server action re-checks authorisation; actor from session.

## Technical Considerations
- Server Action + `useOptimistic`.

## Traceability
- Product requirements: REQ-18 (Family and Carers can create events and mark them Done; no approval step.), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-21 (Task log lists tasks with date, nurse and status, with server-side search and filter; each…)
- Sources: UI-D26, D27, D33, D35; Design: Family · Calendar Tasks and Log panels
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
