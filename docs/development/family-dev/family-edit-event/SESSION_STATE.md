# Session State — FAM-07 Family — Edit event

Last session date: 2026-09-28
Current branch: `feature/family-edit-event` (from `main`, pushed, claimed)
Worked on: wiring Edit event's persistence for real. The route/screen were already built
(FAM-UI-03); Save was still Phase 1 (local state only), and `getEvent`/`getOccurrence`/
`getEventDocuments` had no Supabase branch.
What changed:
- `src/server/events/actions.ts`: new `updateEvent`. Series-wide fields (title, description,
  recurrence, duration, task/event switch) always update the event directly; Date/Start time is
  the only scope-sensitive field (occurrence override vs. series-wide, refused for a recurring
  event's series scope) — see DECISIONS.md FD-01 for why only this field is special.
- `src/server/events/queries.ts`: `getEvent` and `getOccurrence` Supabase branches.
  `getOccurrence` delegates to the already-wired `getOccurrences` for one Melbourne day, reusing
  its recurrence expansion/overrides/completions/RLS rather than duplicating any of it.
- `src/server/documents/queries.ts`: `getEventDocuments` Supabase branch (resolves the uploader's
  name via a `profiles` embed; RLS-blocked embeds come back `null`, which the schema already
  treats as optional).
- `src/server/events/occurrence-key.ts`, `recurrence-mapping.ts`: new, small shared modules (moved
  out of `actions.ts`, which as a `"use server"` file may only export async functions).
- `src/mocks/queries/events.ts`: mock `updateEvent`, mirroring the same scope rules.
- `src/features/family-event-form/`: `event-form-screen.tsx` wires Edit's Save to `updateEvent`;
  Title/Start time/Duration (PD-047) now show on Edit too, not just Add; new `edit-scope.ts` /
  `edit-scope-fields.tsx` render the PD-045 scope selector for a recurring event.
- `src/lib/supabase/database.types.ts`: regenerated (stale again — missing `care_events.cost`/
  `bucket_id` this time, before this feature's own regeneration).
- Cherry-picked nothing new this session; this branch was created directly from `main` per the
  session's updated instruction to stop branching from/pushing to `family-dev`/`carer-dev`/
  `admin-dev` — the PR target for this and future dashboard features is `main`.
Tests run: full Vitest suite, `supabase test db`, the new integration file, the full
`tests/integration` suite (`--no-file-parallelism`), `npm run typecheck`/`lint`/
`prettier --check`/`build`, and this dashboard's Playwright e2e specs.
Test results: full Vitest suite 2048 passed / 47 skipped; `supabase test db` 401/401;
`tests/integration/family-edit-event.test.ts` 8/8; full integration suite 61/62 (the 1 failure is
the pre-existing `[F0-07][AC-10]` TOTP issue); typecheck/lint/format clean; build succeeds; e2e
green (one calendar keyboard-nav test flaked once, unrelated to this feature, passed on rerun).
Current blocker: None — OQ-10, OQ-11, OQ-22 are ANSWERED (root DECISIONS.md).
Important discoveries:
- `care_event_overrides` only has columns for start/duration/completion-mode — no per-occurrence
  title, description or recurrence pattern exists in the schema, and an occurrence's identity
  (`key`) is derived from its **original** start. This is why only Date/Start time is
  scope-sensitive in this implementation (FD-01) — every other field is safe to always apply
  series-wide, since none of them are part of any occurrence's identity.
- The shared kit's `ChipGroup` breaks its own `aria-labelledby` for any multi-word `legend` (an
  ID-reference list interpreted the legend's words as separate, unresolvable IDs) — discovered via
  the scope selector's first attempted label ("Apply this change to"), worked around with a
  single-word legend ("Scope") rather than editing the shared kit (FD-04).
- `database.types.ts` was stale again: F0-12/F0-18 added `care_events.cost`/`bucket_id` and the
  budget tables, but the committed file was missing them (same recurring class of gap FAM-03's own
  DECISIONS.md FD-01 already recorded once this sprint).
Important decisions: FD-01 (scope-sensitivity model), FD-02 (HUMAN REVIEW — "this and future" not
built), FD-03 (read-side wiring), FD-04 (shared-kit bug, worked around) — all in DECISIONS.md.
Exact next action: None — merged (PR #146). FD-02 ("this and future") remains open as a follow-up.
Files likely to be touched next: none expected before PR, unless FD-02's review asks for "this and
future" to be built now.
Warning for next session: Playwright e2e always runs `DATA_SOURCE=mock` and cannot exercise a
Supabase branch — prove real data-source wiring via `tests/integration/*.test.ts` instead, per the
pattern every Phase 3 wiring feature this sprint has used.
