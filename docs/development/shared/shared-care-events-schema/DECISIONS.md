# Decisions — F0-11 Care events, occurrence overrides and append-only completions

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-10 | Status behaviour and undo | YES | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-22 | Event fields | YES | Add Title, Start time and Duration fields to the event form (design update). |
| OQ-29 | Which nurse is shown on an event | YES | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |
| OQ-09 | Carer access model | YES | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-33 | Carer calendar and task semantics | YES | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |
| OQ-34 | Event notes and comments | no | Parked (PL-21) until designed. |

## Feature decisions log

### FD-01 — F0-08's audit test scoped to its own rows (genuine test bug)
- Date: 2026-09-25
- Context: `supabase/tests/audit_log.test.sql` asserted on every `clients` UPDATE and `client_info_sections` audit row without scoping to its own client, so it only passed on a database with no other committed audit rows. The audit log is append-only, so rows left by integration tests (FAM-13's committed a `clients` UPDATE) cannot be removed, and it aborted with "more than one row returned by a subquery".
- Decision: added `and record_id = 'b1111111-…'` (or `client_id`) to eleven assertions in that file. No expectation changed and none was removed.
- Reason: TESTING.md §6 allows changing a test for a genuine test bug; a fresh database (CI) was never affected.
- Human confirmation required: yes, at PR review. **HUMAN REVIEW: an F0-08 test changed** (its own feature is merged).
- Test changes caused: `audit_log.test.sql` only, as above. My own audit assertions in `care_events.test.sql` are scoped the same way.

### FD-02 — Actor names are shown in full, not 'Aisha R.' (AC-03 wording vs PD-038)
- Date: 2026-09-25
- Context: AC-03 says the actor label is 'Aisha R.'. PD-038 (answering OQ-13, CONFIRMED 2026-09-17) says staff names are displayed in full everywhere and supersedes the abbreviation in the design mockups (`src/lib/format/display-name.ts` says the same). ACCEPTANCE_CRITERIA.md is a controlled document (CLAUDE.md §9).
- Decision: `set_occurrence_done` snapshots the full name ("Aisha Rahman"), and `deriveStatus` returns it in full. The AC text is not edited. AC-03 is MET as to behaviour (a Done status with the actor's name); the tests assert "Aisha Rahman".
- Reason: a confirmed decision outranks an older acceptance-criteria example.
- Human confirmation required: yes. **HUMAN REVIEW: AC-03 wording ('Aisha R.') conflicts with PD-038.** Confirm, and if so change the AC text through a CHG entry.
- Test changes caused: none (the tests are new).

### FD-03 — Overdue is due at the occurrence's start
- Date: 2026-09-25
- Context: the PRD says "Overdue iff now ≥ occurrence end (PROPOSED: start)"; ARCHITECTURE.md §6 says "due time"; DECISIONS (PD-044) speaks of "the occurrence's scheduled time". OQ-10's derivation is recorded as ambiguous.
- Decision: due time is the occurrence's effective start (after any override moved it); at exactly the due time a task is already Overdue. It is one function, `dueTime`, in `src/lib/occurrences/derive-status.ts`.
- Reason: the PRD's proposed default and PD-044's wording.
- Alternatives considered: the end of the occurrence (a 15-minute task would not be Overdue until 09:15).
- Human confirmation required: yes, at PR review (non-blocking default). Changing it is one line.
- Test changes caused: none.

### FD-04 — Ticking an occurrence that is already Done changes nothing
- Date: 2026-09-25
- Context: the PRD's PROPOSED idempotency: "two users mark Done simultaneously → single effective Done; both attempts audited". Completions are append-only and "latest wins".
- Decision: `set_occurrence_done` takes an advisory lock per occurrence. If the latest completion is already `done` it returns that row and inserts nothing, so the first person stays the recorded actor. The second attempt is therefore not in the audit log (nothing changed). After an undo, a new tick-off inserts a new `done` row.
- Reason: inserting a second `done` would replace the first person as the actor, which misrecords who did the care (REQ-19).
- Alternatives considered: insert every attempt (audited, but the later actor wins).
- Human confirmation required: yes. **HUMAN REVIEW: differs from "both attempts audited" (PROPOSED).**
- Test changes caused: none.

### FD-05 — The schema differs from the DATA_MODEL proposal, and why
- Date: 2026-09-25
- Context: DATA_MODEL.md was PROPOSED. Later decisions and RLS needs change it.
- Decision: added (1) `care_events.completion_mode` and `care_event_overrides.new_completion_mode` (CHG-001, CHG-009: tasks and plain events, per-occurrence); (2) `client_id` on overrides and completions, derived by trigger from the event, so RLS and the audit log are client-scoped without a join; (3) `care_event_completions.seq`, because `now()` is constant inside a transaction and "latest" needs an order; (4) `care_events.deactivated_at`, set by trigger, so a deactivated event stops generating occurrences from a known moment (AC-08); (5) whole-second checks on every start that identifies an occurrence, because a key must match exactly and the recurrence engine works in whole seconds; (6) `set_occurrence_undone` for OQ-10 (an 'undone' row); (7) `client_shift_carers`, because a family member cannot read carer profiles (their organisation is null) and the assignee (OQ-29) needs the carer's name. `recurrence_until` stays a separate column beside the jsonb rule.
- Reason: as listed; each is covered by pgTAP or a unit test.
- Human confirmation required: yes, at PR review.
- Test changes caused: none.

### FD-06 — Who can read and write (OQ-09, OQ-16)
- Date: 2026-09-25
- Context: PRD Security; OQ-09 ANSWERED: carers edit only within [shift start, shift end).
- Decision: read = the client's family, an assigned carer, or the client's organisation admin (`can_read_care_events`). Write to events and overrides = the family at any time, or a carer on an active shift for that client whose profile is active (`can_edit_care_events`, using F0-10's `carer_on_active_shift`, which does not itself check that the profile is active). An admin never writes. Completions are written only by the two functions, with the actor taken from `auth.uid()`. Nobody can delete an event, an override or a completion (deactivate instead). Undo: the family may undo any tick; a carer only their own, and only while still on an active shift.
- Reason: PRD and OQ-09.
- Human confirmation required: no.
- Test changes caused: none.

### FD-07 — A client with history cannot be deleted
- Date: 2026-09-25
- Context: `care_event_completions.event_id` and `.client_id` restrict deletion so history is never lost (REQ-N6).
- Decision: deleting a client or event that has a completion fails (23503). Integration tests that tick something off therefore leave their client behind, with a unique name (users are always removed). ADM-05 "Remove client" detaches a client and is unaffected.
- Reason: append-only history.
- Human confirmation required: no.
- Test changes caused: none.

### FD-08 — `getOccurrences`: the contract is `family-dev`'s (CHG-012), with Supabase behind it
- Date: 2026-09-25 (corrected 2026-09-25, see FD-12)
- Context: PRD Scope: "Server query `getOccurrences(clientId, range)`". `family-dev` already had that function (FAM-UI-02, CHG-012): a range of Melbourne calendar dates, both inclusive, validated by `OccurrenceRangeSchema` (a `ZodError` on a bad range), `Occurrence[]`, oldest first, an unknown client is an empty list, and its doc block says "F0-11 implements this for Supabase". My first version added a second, instant-based `getOccurrences` beside it, which collided when the branches met.
- Decision: keep CHG-012's signature and rules. With `DATA_SOURCE=supabase` the range's Melbourne days become a window of instants (start of `from` to the start of the day after `to`, `melbourneDaysToInstants`) and `loadOccurrences` reads the rows and calls `buildOccurrences`. Added, in the same style as `getTodayOccurrences`: an optional `{ type }` (tasks only unless passed, so `AnyOccurrence[]` comes back with it) and `{ now }` (the clock for Overdue; the mock ignores it). A user who cannot read the client's events, and an id that is not an id, get `[]`. Errors carry no client or row data. The mock gained the `type` option and returns plain events with it. The other reads (`getTodayOccurrences`, `getTaskLog`, `getOccurrence`, `getEvent`) and `setOccurrenceDone` still throw "not implemented" for Supabase: they are the Family, Carer and Admin wiring features'.
- Reason: one function per problem (CLAUDE.md §7); screens already call CHG-012's.
- Human confirmation required: no.
- Test changes caused: see FD-12.

### FD-09 — Melbourne time conversion moved into `src/lib`
- Date: 2026-09-25
- Context: the recurrence engine works in Melbourne wall-clock time and the database stores instants (F0-09 leaves the conversion to F0-11). The only converter lived in `src/mocks/melbourne-time.ts`.
- Decision: moved it to `src/lib/dates/melbourne-time.ts` and added `instantToMelbourneLocal`; the mock file re-exports the two names it exported before, so its tests pass unchanged. A wall-clock time that does not exist (the night the clocks go forward) moves forward one hour rather than failing the whole query.
- Reason: one implementation (CLAUDE.md §7); a shared PR may edit `src/lib` and `src/mocks`.
- Human confirmation required: no.
- Test changes caused: none.

### FD-10 — Database types were merged by hand
- Date: 2026-09-25
- Context: `src/lib/supabase/database.types.ts` on `main` is stale (it lacks `audit_log`), and a full regeneration from the local database would also pull in `family-dev`'s functions.
- Decision: added only the three tables and five functions of this feature, taken from `supabase gen types`.
- Human confirmation required: no.
- Test changes caused: none.

### FD-11 — Non-blocking defaults used
- OQ-34 (event notes) is parked (PL-21): no notes table.
- Mapping the domain's nine recurrence options onto `{frequency, interval}` (PD-046) is FAM-06 / FAM-07's, when they save events; the database stores only the pair.
- The migration is dated 20260925030000, after `family-dev`'s 20260925010000 (FAM-12) and 20260925020000 (FAM-13), so the three apply in order when both branches reach `main`.
- Human confirmation required: no.

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->

### FD-12 — One FAM-UI-02 test replaced, and two flaky calendar tests fixed (after the merge into `family-dev`)
- Date: 2026-09-25
- Context: after PR #107 merged this branch into `family-dev`, CI failed: typecheck, the build and 16 test files. Causes: (1) my second `getOccurrences` collided with `family-dev`'s (FD-08); (2) when `family-dev` was merged into this branch, the conflict in `src/server/events/queries.ts` was resolved by taking this branch's file, which dropped `getEvent` and `getToday` (used by six Family screens); (3) the same merge dropped the two FAM-13 function entries from `database.types.ts`; (4) `day-timeline.test.tsx` failed in CI at 19:00.
- Decision: (1) and (2): restored `queries.ts` and the mock from before the merge and added F0-11's Supabase branch to CHG-012's function (FD-08); (3): restored `list_organisations_for_transfer` and `transfer_client_organisation`; (4): the timeline draws a current-time label in the gutter and hides any hour label within a line of it, and the test rendered without pinning the clock, so it failed whenever the real time was near an hour it checks (18:50 here, 19:00 in CI). `day-timeline.test.tsx` and `time-grid-scroller.test.tsx` now pass `now={null}`; reproduced with a pinned system clock at 18:50 before the change and passing after. Also replaced `src/server/events/occurrences.test.ts` "[FAM-UI-02] says clearly that the Supabase implementation lands later" (it asserted "not implemented yet") with two tests: a bad range still rejects with a `ZodError` under Supabase, and an id that is not an id is an empty list. My own tests moved to date ranges.
- Reason: the requirement changed (F0-11 implements the branch); the timeline tests had a hidden dependency on the clock.
- Human confirmation required: yes. **HUMAN REVIEW: one FAM-UI-02 test replaced; two UI-01 test renders changed (clock pinned).** No assertion was removed.
- Test changes caused: as above.
