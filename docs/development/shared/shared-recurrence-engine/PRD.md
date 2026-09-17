# F0-09 — Recurrence engine (pure TypeScript)

| Field | Value |
|---|---|
| Feature ID | F0-09 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-recurrence-engine` |
| Documentation | `docs/development/shared/shared-recurrence-engine/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D2–D3 |
| Status / owner | See PROGRESS.md |

## Purpose
Compute occurrences correctly for decades ahead.

## Problem
Pre-generating lifetime dates is cumbersome and fragile; month-ends, leap years and daylight-saving shifts cause off-by-one bugs.

## Description
A pure, heavily unit-tested module that turns a recurrence rule plus per-occurrence overrides into concrete occurrences on demand, supporting a lifetime (perpetual) schedule without pre-generating dates.

## User value
Delivers the client's core 'perpetual calendar' requirement without re-entering items each year.

## Users
- System (used by all calendar features)

## Scope
- Types: `RecurrenceRule { frequency: 'none'|'daily'|'weekly'|'monthly'|'yearly'; interval: number; anchor: LocalDateTime; until?: LocalDate }` (final option list per OQ-12).
- `expandOccurrences(rule, range, overrides)` → ordered occurrences within [range.start, range.end).
- Override types: cancelled occurrence; moved/modified occurrence (new start, duration).
- Occurrence identity: `originalStart` ISO string (stable key).
- Timezone handling in Australia/Melbourne including DST transitions (OQ-32).
- Month-end rule (e.g. anchor on 31st) and 29 February yearly rule — PROPOSED: clamp to last valid day; record in feature DECISIONS.md for confirmation.
- Performance guard: expanding 500 rules over a 6-week range completes within 100 ms in unit tests (PROPOSED budget).

## Out of Scope
- Database storage of rules (F0-11)
- UI for choosing recurrence (FAM-06)

## Functional Requirements
- No occurrence is generated before the anchor or after `until`.
- An override affects only its matching occurrence.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-02 (Tooling baseline: TypeScript, lint, format, test runners)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-12
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-32, OQ-11

## Inputs
- Rule
- Range
- Overrides

## Outputs
- Occurrences

## Error / Edge Cases
- Interval 0 or negative → validation error.
- Range spanning DST start/end keeps local wall-clock time (09:00 stays 09:00).
- Anchor 31 Jan monthly → 28/29 Feb, 31 Mar (clamp, PROPOSED).

## Security / Permissions
- None (pure function).

## Technical Considerations
- date-fns + @date-fns/tz (PROPOSED, PD-014); no global mutable state.
- Zod schema for rule validation shared with server actions.

## Traceability
- Product requirements: REQ-13 (Care events (Care Need Items) can be one-off or recurring, with no limit on number.), REQ-14 (Schedules are perpetual: recurrences carry forward indefinitely without re-entry and can b…), REQ-15 (A single occurrence can be cancelled or modified without affecting the series.)
- Sources: BRIEF I, item 3; CIS5 Perpetual Nature of the App; FR-2.1, 2.3, 2.4, 2.5, 2.6; TM-2108 (rule + on-demand generation + overrides); ADR-01 consequence
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
