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
- Decision: the field is rendered by `EventFormScreen` and held in its state, so no Lane S file changes. It sits under Title/times (the kit fixes the order), not directly under 'Recurring'. CHG-062 and the PRD said the shared `EventFormValues` would gain `endDate`; that is no longer needed.

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

### FD-10 — Delete reuses F0-27's `deleteEvent` (merge with `main`)
- Date: 2026-10-14
- Context: F0-27 (#242) merged a shared `deleteEvent` (`src/server/events/delete-actions.ts`, Delete on the edit screen) while FAM-18 was open; FAM-18 had its own `deleteEventOccurrence`. Two delete flows would break "one pattern per problem" (ARCHITECTURE.md §12).
- Decision (the human owner, 2026-10-14, in-session): keep F0-27's action. FAM-18 drops `deleteEventOccurrence` and its mock mutation; the Task detail `DeleteEventButton` calls `deleteEvent` (same input shape). FAM-18 still adds the Task detail entry point and the 'Ends' date.
- Behaviour that now follows F0-27: 'This and all future' from the first occurrence sets `is_active = false` (FD-01 had preferred `recurrence_until`); AC-06 passes against local Supabase either way. 'Future' no longer keeps an earlier, shorter end date: it always writes the day before.
- Added to F0-27's `deleteEvent` (the human owner chose it, 2026-10-14): a Done occurrence is refused with "Completed care can't be deleted." in both the Supabase path (latest `care_event_completions` row) and the mock, so AC-08 holds for both Delete buttons. Recorded in the F0-27 pack FD-04.
- CHG renumbered CHG-060 to CHG-062 (`main` used CHG-060 and CHG-061 first).

### FD-11 — Tests changed by the merge (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-14
- `src/server/events/delete-event.actions.test.ts` renamed `end-date.actions.test.ts`. Before: 10 `deleteEventOccurrence` tests plus 4 end-date tests. After: the 4 end-date tests only; the delete tests are removed with the action they tested. Their behaviour is covered by F0-27's `delete-actions.test.ts` (occurrence, future, one-off, first occurrence, failure, not allowed) and the three FAM-18 AC-08 tests added there. Assertions dropped with no equivalent: 'future never lengthens an earlier end date' (F0-27 does not do this) and 'rejects a malformed input'.
- `src/mocks/queries/events.delete.test.ts` removed (tested the removed mock `deleteEventOccurrence`); the mock Done refusal is now tested in `delete-actions.test.ts`.
- `delete-event-button.test.tsx` and `tests/integration/family-delete-event.test.ts`: retargeted from `deleteEventOccurrence` in `actions` to `deleteEvent` in `delete-actions`. No assertion changed.
- `src/server/events/delete-actions.test.ts` (F0-27): the faked client's `select` now answers the `care_event_completions` lookup (infrastructure); 3 tests added, none changed.

