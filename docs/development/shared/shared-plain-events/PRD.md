# UI-05 — Plain events in the shared kit and contracts (CHG-009)

| Field | Value |
|---|---|
| Feature ID | UI-05 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit (late addition, CHG-009) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-plain-events` |
| Documentation | `docs/development/shared/shared-plain-events/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

## Purpose

Give every dashboard the shared types, contracts, fixtures and kit components it needs to show plain events correctly, as CHG-009 requires.

## Problem

CHG-009 (root DECISIONS.md, PR #78) makes every event either a **task** (`completionMode: "manual"`: ticked off by hand, Overdue if missed) or a **plain event** (`completionMode: "automatic"`: no status, never ticked off). The shared code still assumes every occurrence has a status: `Occurrence.status` is required, `getTaskLog` has no type filter, the fixtures have no plain-event rows, and the calendar and lists kits can only draw Planned, Done or Overdue. CHG-009's Impact section lists this shared work and no feature owns it, so dashboard features cannot show plain events correctly until it merges.

## Description

A Lane S follow-up to UI-00 to UI-04. It changes the domain type for occurrences, extends the `events` contract (UI-04) and the mock fixtures, and adds a neutral "Event" look to the calendar kit (UI-01) and lists kit (UI-03), plus a shared switch and a hide-Status option to the forms kit (UI-02). Every existing kit API stays backward compatible; the dashboard lanes adopt the new pieces in their own features.

## User value

Families and carers see plain events (for example the afternoon walk) on the schedule and in the log, clearly labelled "Event" and never shown as Planned, Done or Overdue. Screen owners get one shared way to tell a task from a plain event.

## Users

- Developers (screen owners); through them, Family and Carer users.

## Scope

- `src/types/domain.ts`: an occurrence of a plain event has no status (one clean pattern, chosen and recorded in Task 2); a way to tell a task occurrence from a plain-event occurrence; `TaskLogQuerySchema` gains `type` (`all` / `tasks` / `events`).
- `src/server/events/queries.ts` and `src/mocks/queries/events.ts`: `getTaskLog` type filter, and status filters return tasks only; `getOccurrence` and `getTodayOccurrences` return plain-event occurrences without a status.
- `src/mocks/**`: plain-event rows in the log, on the reference day and in the calendar data (Afternoon walk `event-margaret-walk`, already `automatic`, gets rows in the reference week, or one more plain event is added), keeping the fixture values other tests use.
- UI-01 calendar kit (`src/components/shared/calendar/**`): a fourth, neutral block look for plain events in `status-cue`, day, week and month grids and the event popover.
- UI-03 lists kit (`src/components/shared/lists/**`, `status-pill.tsx`): a neutral "Event" label where a `StatusPill` would go.
- UI-02 forms kit (`src/components/shared/forms/**`): a shared switch control matching FAM-UI-03's local `TaskSwitch` (FD-08 on `family-dev`), and an `EventForm` option to hide the Status chips for a plain event.
- Unit, contract, component and axe tests for all of the above.

## Out of Scope

- Dashboard screens: nothing under `src/features/**` or `src/app/**` (the dashboard lanes adopt the kit changes: FAM-UI-01/02/03/07, FAM-01/02/04/05/06/07/14/15, CAR-UI-01/03, CAR-01/05/06/07).
- Database, migrations, status derivation and `set_occurrence_done` (F0-11), seed data (F0-16), Lane B.
- The "Care log" rename in Family screens (FAM-UI-07, FAM-14, FAM-15).
- Saving the switch value and the edit-scope rules (FAM-06, FAM-07, CAR-07).
- A Family alert when the mode changes (PL-23).

## Functional Requirements

- A plain-event occurrence never carries a status, actor or completion time; a task occurrence always has exactly one of Planned, Done, Overdue.
- The type filter and the status filter combine: any status filter returns tasks only; `q` still matches the title; ordering, page size and `total` keep the UI-04 rules.
- Contract functions stay reachable only through `src/server/**` and delegate by `DATA_SOURCE`.
- Existing callers that do not pass the new options keep their current results (backward compatible; see DECISIONS.md FD-01).

## UI / UX Requirements

- Plain events: neutral colour, no status shape, and the word "Event" where the block or row has room; the accessible name always says "Event". Tasks keep the Planned, Done and Overdue looks.
- Status is never conveyed by colour alone; tokens only (Figma Foundations); white text never on #0C9BA9; 44×44px targets.
- The switch shows "On" / "Off" in words, `role="switch"`, labelled, 44px tall. No Figma design yet for the switch or the Event look: design review.

## Dependencies

- Features: UI-00, UI-01, UI-02, UI-03, UI-04
- Blocking open decisions (must be answered before START FEATURE): None (OQ-01 ANSWERED, PD-030). Authorised by CHG-009.
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-31 (Task log range; not applied, as in UI-04)

## Inputs

- Root DECISIONS.md CHG-009; PRD.md REQ-17, REQ-35; FAM-UI-03 `task-switch.tsx` and FD-08 on `family-dev`.

## Outputs

- Types, contract semantics, fixtures, kit components; tests.

## Error / Edge Cases

- Unknown `type` rejects (Zod), like an unknown `status`.
- A status filter together with `type: "events"` returns an empty page with `total` 0 (no plain event has a status).
- A plain-event occurrence that carries a status, actor or completion time fails schema validation.
- Long plain-event titles truncate or wrap in every block tier like task titles.

## Security / Permissions

- Synthetic data only. Client scoping of every contract unchanged (UI-04 AC-05, AC-06). No PII in logs.

## Technical Considerations

- One pattern for "has no status" across types, contracts and kit (recorded in DECISIONS.md when Task 2 chooses it).
- `completionMode` stays the data field (`manual` = task, `automatic` = plain event); the UI only says "Task" or "Event" (CHG-009).

## Traceability

- Product requirements: REQ-35, REQ-17
- Sources: root DECISIONS.md CHG-009, PD-044, CHG-001; `docs/development/family-dev/family-ui-event-form/DECISIONS.md` FD-08 (on `family-dev`)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels

CONFIRMED (CHG-009, human, 2026-09-24; this feature and its plan card approved by the human in-session, 2026-09-24). Judgement calls are in DECISIONS.md.
