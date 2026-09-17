# FAM-04 — Family Calendar — day, week and month views

| Field | Value |
|---|---|
| Feature ID | FAM-04 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-calendar-views` |
| Documentation | `docs/development/family-dev/family-calendar-views/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D8–D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Let the family browse the perpetual schedule.

## Problem
Wireframes simplified calendars; normal conventions must be restored (D12).

## Description
The Family Calendar grid: week view with hour gutter and event blocks, plus day and month views following normal calendar conventions.

## User value
Families plan around upcoming care across days, weeks and months.

## Users
- Family

## Scope
- Route `/family/[clientId]/calendar` with URL params `view` (day|week|month) and `date`.
- Header range label ('30 Nov – 6 Dec 2026') and prev/next navigation (not drawn — PROPOSED chevrons; confirm).
- Segmented control D / W / M, default W.
- Week view: columns MON–SUN with day number, today column highlighted (brand-pale), hour gutter 07:00–18:00, event blocks with time and title and left stripe.
- Day view: single column with the same block style.
- Month view: calendar cells (default, today, selected, has-events, out-of-month).
- Selecting a day sets `date` (consumed by FAM-05 Tasks panel).

## Out of Scope
- Tasks and Log panels (FAM-05)
- Opening/editing an event from a block (FAM-07)

## Functional Requirements
- Recurring events expanded for the visible range only.

## UI / UX Requirements
- Match design; tabular numerals.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), FAM-UI-02 (Family Calendar screen (UI))
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-32

## Inputs
- clientId
- view
- date

## Outputs
- Calendar grid

## Error / Edge Cases
- Navigating far into the future (e.g. 2060) still shows recurring occurrences.
- Invalid `date` param → fall back to today.

## Security / Permissions
- Linked family only.

## Technical Considerations
- Pure date-range helpers (`weekRange`, `monthGrid`) unit-tested; Monday week start.

## Traceability
- Product requirements: REQ-14 (Schedules are perpetual: recurrences carry forward indefinitely without re-entry and can b…), REQ-16 (Calendar offers day, week and month views, defaulting to week, with normal conventions.)
- Sources: UI-D6, D12; CM-0309 (D/W/M well received); US P-3; Design: Family · Calendar
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
