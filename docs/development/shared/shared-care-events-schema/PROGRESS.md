# Progress — F0-11 Care events, occurrence overrides and append-only completions

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: B — Backend
Sprint: SPRINT · planned D5–D6
Branch: `feature/shared-care-events-schema` (created from `origin/main`)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-25

## Blockers
- None. OQ-01, OQ-10, OQ-22, OQ-29, OQ-09 and OQ-33 are ANSWERED in DECISIONS.md; OQ-34 is non-blocking and parked.

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-09 — MERGED TO DEV
- F0-10 — MERGED TO DEV
- F0-08 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `care_events`: id, client_id, title, description, starts_at (anchor), duration_minutes, recurrence (jsonb validated by F0-09 schema), recurrence_until null, is_active, created_by, created_at, updated_at (final fields per OQ-22).
- `care_event_overrides`: event_id, original_start, kind ('cancelled'|'modified'), new_starts_at, new_duration_minutes, created_by.
- `care_event_completions` (append-only): id, event_id, original_start, action ('done'|'undone' per OQ-10), actor_id, actor_display_name snapshot, organisation_id snapshot, occurred_at.
- Postgres function `set_occurrence_done(event_id, original_start)` — authorises (family of client, or carer on active shift per OQ-09) and inserts completion.
- TypeScript `deriveStatus(occurrence, latestCompletion, now)` → 'planned'|'done'|'overdue' with actor.
- Server query `getOccurrences(clientId, range)` combining events + F0-09 expansion + overrides + latest completion + assigned carer (per OQ-29).
- RLS: family read/write events of linked clients; assigned carer read; carer write per OQ-09; admin read (for Admin Home overdue) — writes by admin not in design.
- Attach audit trigger (F0-08).

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 0 / 8
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_care_events.sql`, `supabase/tests/care_events.test.sql`, `src/server/events/queries.ts`, `src/server/events/status.ts`, `src/server/events/status.test.ts`, `tests/integration/events-queries.test.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-10, OQ-22, OQ-29, OQ-09, OQ-33; then complete dependencies, run START FEATURE F0-11, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
