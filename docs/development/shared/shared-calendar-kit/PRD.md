# UI-01 — Calendar kit: week/day/month grids, event blocks, date picker

| Field | Value |
|---|---|
| Feature ID | UI-01 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-calendar-kit` |
| Documentation | `docs/development/shared/shared-calendar-kit/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D3 |
| Status / owner | See PROGRESS.md |

## Purpose
Build calendar UI once.

## Problem
Four screens use calendar grids and pickers with small variations.

## Description
Builds every calendar-like component once so the three dashboards compose them in parallel.

## User value
Removes the largest source of duplicated UI across dashboards.

## Users
- Family
- Carer
- Admin

## Scope
- Pure helpers `src/lib/dates/`: `weekRange(date)` (Monday start), `monthGrid(date)` (6×7 with out-of-month days), `positionBlocks(occurrences, {startHour: 7, rowPx: 44})`.
- `DayTimeline` (hour gutter 07:00–18:00, blocks with #0C9BA9 left stripe, title, assignee, duration, status pill — Family Home 'Today').
- `WeekGrid` (MON–SUN headers with day number, today column highlighted, hour gutter, blocks showing time + title; `labelFormat` prop for carer 'Margaret — Morning m…' truncation).
- `MonthGrid` (cell states default/today/selected/has-events/out-of-month).
- `CalendarHeader` (range label '30 Nov – 6 Dec 2026', prev/next, D/W/M segmented control default W).
- `DatePickerGrid` ('November 2026' with chevrons, MON–SUN, dots for days with items, selected filled circle, out-of-month muted).
- Component tests for each state; axe checks.

## Out of Scope
- Data fetching
- Screen composition (Phase 1 screens)

## Functional Requirements
- Components are presentational: data and selection via props/callbacks.

## UI / UX Requirements
- Match Family Home, Family Calendar, Carer Calendar, Edit event and Admin Manage frames.

## Dependencies
- Features: F0-14 (Core UI primitives and state components), UI-00 (Domain types, data-access contracts and design fixtures)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-32, OQ-33

## Inputs
- Occurrences / days via props

## Outputs
- Calendar components

## Error / Edge Cases
- Events outside 07:00–18:00 → PROPOSED extend the gutter to include them.
- Overlapping blocks → side by side (PROPOSED).

## Security / Permissions
- None.

## Technical Considerations
- Files in `src/components/shared/calendar/`.

## Traceability
- Product requirements: REQ-16 (Calendar offers day, week and month views, defaulting to week, with normal conventions.), REQ-25 (Carers see all their assigned shifts in a calendar with the tasks for a selected shift.), REQ-23 (Admins assign a carer to a client for a date and time slot (or custom time); overlapping s…)
- Sources: UI-D6, D12, D21, D13; Design: Family Home Today, Family Calendar, Carer Calendar, Edit event Pick a date, Admin Manage date
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
