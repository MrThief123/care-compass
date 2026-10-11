# Decisions — FAM-18 Family — Delete event and recurrence end date

## Open decisions affecting this feature
None.

## Feature decisions log

### FD-01 — Delete is soft: cancel an occurrence, or end the series
- Date: 2026-10-11
- Context: no role has DELETE on `care_events`/overrides, completions are append-only, and a deleted event must keep its history.
- Decision: 'This occurrence' upserts a `cancelled` override; 'This and all future' sets `recurrence_until` to the day before the occurrence (Melbourne). No migration.
- Alternatives: `is_active = false` (rejected: it stops occurrences from `now`, so an overdue first occurrence would stay visible); a physical delete (rejected: breaks audit and history).

### FD-02 — No Delete button on a Done occurrence
- Date: 2026-10-11
- Context: a cancelled override blocks ticking, and a Done occurrence is care that happened.
- Decision: the button is absent on Done occurrences and the server refuses. To end a series from a later occurrence the user opens that one. HUMAN REVIEW if they want Done occurrences deletable.

### FD-03 — Pending costs are untouched
- Date: 2026-10-11
- Context: the CHG-020 open question about a pending cost when its event is deleted.
- Decision: moot. Pending costs exist only for completed (Done) occurrences, which delete never touches.

### FD-04 — End date is series-level on Edit
- Date: 2026-10-11
- Decision: like Title, `endDate` applies to the whole series regardless of the occurrence/series scope choice (FAM-07 FD-01). Changing Recurring to 'Does not repeat' clears it.

### FD-05 — Delete lives on Task detail only; design gap
- Date: 2026-10-11
- Decision: matches "when you view an event". No Figma frame: built from tokens and flagged for design review.
