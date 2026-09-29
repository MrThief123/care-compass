# Decisions — FAM-07 Family — Edit event

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-10 | Status behaviour and undo | YES | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-11 | Editing recurring events: scope | YES | Add a scope choice when editing a recurring event (design required). |
| OQ-22 | Event fields | YES | Add Title, Start time and Duration fields to the event form (design update). |

## Feature decisions log

### FD-01 — Only Date/Start time is scope-sensitive; every other field is always series-wide
- Date: 2026-09-28
- Context: PD-045's per-occurrence override table (`care_event_overrides`) only has columns for
  `new_starts_at`, `new_duration_minutes` and `new_completion_mode` — there is no column for a
  per-occurrence title, description or recurrence pattern, and an occurrence's identity
  (`key`, used by every history row) is built from its **original** start instant. Moving a
  recurring event's anchor `starts_at` would shift every occurrence's derived identity, orphaning
  history (completions, overrides, documents) keyed to the old instants.
- Decision: Title, Description, Recurrence, Duration and the Task/Event switch always update the
  whole event directly, whatever scope is chosen — none of them are part of any occurrence's
  identity, so changing them can never orphan history. Only Date/Start time is scope-sensitive:
  **"This occurrence"** writes a `care_event_overrides` row (`new_starts_at`) for the viewed
  occurrence; **"Entire series"** writes the anchor `starts_at` directly, and is refused
  (VALIDATION) for a recurring event whose date actually changed. A one-off event has only one
  occurrence, so "Entire series" may always move its date (there is nothing to orphan).
- Reason: AC-01 (description) and AC-02 (recurrence) only need series-wide writes; nothing in
  FAM-07's own ACs exercises per-occurrence duration/task-switch changes. Restricting the schema's
  fuller per-occurrence capability to Date/Start time only — where getting it wrong risks real
  data corruption — is a deliberate scope boundary, not an oversight; a future feature that needs
  per-occurrence duration/task-switch can extend `updateEvent` without a schema change.
- Alternatives considered: routing every field through the scope choice, including duration/task
  switch, via the override columns the schema already has — rejected as unscoped extra surface
  with no AC needing it, given the time this feature already spent establishing the safe Date
  boundary (see FD-03).
- Consequences: `updateEvent` (`src/server/events/actions.ts`) and the mock's `updateEvent`
  (`src/mocks/queries/events.ts`) both implement this same rule, so mock and Supabase modes agree.
- Human confirmation required: no — the restriction follows directly from the schema's own
  identity model (PD-004), not a product judgement call.
- Test changes caused: none.

### FD-02 — "This and future" (the third PD-045 scope) is not built
- Date: 2026-09-28
- Context: PD-045 names three scope choices. "This and future" would mean splitting a recurring
  series in two (capping the old event's `recurrence_until` the day before the edited occurrence,
  then inserting a new `care_events` row carrying the edit forward) — a real, well-defined
  operation the existing schema could support, but genuinely new capability with no design
  reference for edge cases (what happens to an in-flight override on the split occurrence, whether
  the new row keeps the old event's cost/bucket, etc.) and no AC exercising it.
- Decision: the scope selector (`EditScopeFields`) shows "This and future" disabled, not absent —
  PD-045 is a human-confirmed decision naming it, so hiding it would look like it was never
  planned. **HUMAN REVIEW requested**: confirm the split semantics above (or a different design)
  before building it, as a follow-up feature or CHG.
- Reason: CLAUDE.md §6/§9/§10 — build only the PRD Scope; a genuinely new, undesigned capability
  is flagged, not guessed at.
- Human confirmation required: **yes — HUMAN REVIEW requested.**
- Test changes caused: none.

### FD-03 — Wired `getEvent`, `getOccurrence` and `getEventDocuments`'s Supabase branches
- Date: 2026-09-28
- Context: the Edit event page (already built by FAM-UI-03) unconditionally calls `getEvent`,
  `getOccurrence` and `getEventDocuments`, none of which had a Supabase branch — every one would
  throw `notImplementedForSupabase` in real use, and updating an event is meaningless without
  first being able to read it. `getOccurrence`'s Supabase branch delegates to the already-wired
  `getOccurrences` (FAM-04) for one Melbourne day and filters by key, reusing its recurrence
  expansion, overrides, completions and RLS rather than duplicating any of it.
  `getEventDocuments` resolves the uploader's display name via a `profiles` embed
  (`documents_uploaded_by_fkey`); PostgREST returns `null` for an embed RLS blocks, which the
  schema already treats as an optional field, not an error.
- Decision: implemented all three, since Edit event cannot function without them and each is a
  `src/server/**` contract function (not lane-exclusive), matching the precedent of prior Phase 3
  features wiring whatever real contract gap blocked their own screen.
- Reason: CLAUDE.md's Phase 3 model is "replace fixture data with the Supabase data source... make
  the acceptance criteria pass against real data" — that is not possible while the page's own read
  path throws.
- Consequences: also regenerated `database.types.ts` (stale again since before F0-12/F0-18 —
  missing `care_events.cost`/`bucket_id` this time); no other file needed a workaround removed.
- Human confirmation required: no — mechanical extensions of an already-established pattern,
  verified with `supabase test db`, the full Vitest suite, and a dedicated integration test file.
- Test changes caused: two pre-existing unit tests (`src/server/events/queries.test.ts`'s
  `getOccurrence`/`getEvent` "throws not-implemented" cases, `src/server/documents/queries.test.ts`'s
  `getEventDocuments` case) were removed, since the behaviour they proved no longer holds — the
  real behaviour is proven instead by `tests/integration/family-edit-event.test.ts`. No assertion
  was weakened; each removed test's replacement is a stronger, real-data proof.

### FD-04 — Discovered: the shared `ChipGroup`'s `aria-labelledby` breaks for a multi-word legend
- Date: 2026-09-28
- Context: `ChipGroup` (`src/components/shared/forms/chip-group.tsx`) builds its `aria-labelledby`
  as `` `${legend}-legend` ``. `aria-labelledby` is an ID-reference **list** (space-separated), so
  a multi-word legend such as "Apply this change to" produces an unresolvable reference and the
  group's accessible name comes back empty. Single-word legends ("Status") happen to work; no
  existing caller had tried a multi-word one.
- Decision: named the scope selector's legend "Scope" (single word) to avoid the bug, rather than
  edit the shared kit file (folder ownership, CLAUDE.md §4.2). Not filed as a shared PR, since this
  branch has no need to fix it — flagging it here for whoever next reaches for a multi-word
  `ChipGroup` legend.
- Human confirmation required: no — a local wording choice, not a behaviour change to anything
  this feature owns.
- Test changes caused: none.

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
