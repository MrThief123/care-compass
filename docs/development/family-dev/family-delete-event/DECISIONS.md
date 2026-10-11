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

### FD-06 — 'Ends' built in the Family feature, not the shared kit
- Date: 2026-10-11
- Decision: the field is rendered by `EventFormScreen` and held in its state, so no Lane S file changes. It sits under Title/times (the kit fixes the order), not directly under 'Recurring'. CHG-060 and the PRD said the shared `EventFormValues` would gain `endDate`; that is no longer needed.

### FD-07 — Task detail gains opt-in `canDelete` and `recurring` props
- Date: 2026-10-11
- Decision: the Admin client view renders the same `TaskDetailView` and (pre-existing) still shows an 'Edit event' link, so Delete follows its own flag, off by default. The Family page and the on-shift Carer page set it; Admin never does (AC-16). The Carer page now also reads `getEvent` to know whether the event repeats, but does not pass `event` (that would add the Details card and cost to the Carer page).

### FD-08 — Existing tests changed (infrastructure only)
- Date: 2026-10-11
- Tests: `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page.test.tsx`, `page.fam15.test.tsx`, `page.edge.test.tsx`.
- Before: rendered the Task detail page with no router. After: each adds a `next/navigation` mock (`useRouter`, keeping `notFound`), because Task detail now holds the client-side 'Delete event' button. No assertion changed or removed. Not a behaviour change, so no HUMAN REVIEW flag.

### FD-09 — Local test runs need DATA_SOURCE=mock
- Date: 2026-10-11
- `.env.local` sets `DATA_SOURCE=supabase` (hosted project), so on this machine `npx vitest run` fails 30+ unrelated mock-contract tests unless run as `DATA_SOURCE=mock npx vitest run`. Not caused by this feature; recorded so the PR's test commands are reproducible.
