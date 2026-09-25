# Progress — F0-11 Care events, occurrence overrides and append-only completions

Status: READY FOR PR
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
- Tests first (T-01 to T-08 plus supporting tests), then implementation, 2026-09-25.
- Migration `20260925030000_care_events.sql`: `care_events`, `care_event_overrides`, append-only `care_event_completions`, RLS, audit triggers, `set_occurrence_done`, `set_occurrence_undone`, `client_shift_carers`.
- `deriveStatus` (`src/lib/occurrences/`), Melbourne conversion (`src/lib/dates/`), occurrence assembly (`build-occurrences.ts`), `getOccurrences` (real and mock).

## In progress
- None

## Remaining
- Human review, then PR to `main` (needs the human's approval to open it).
- Follow-ups for other features (FD-08, FD-11): Supabase branches of `getTodayOccurrences`, `getTaskLog`, `getOccurrence`, `getEvent` and `setOccurrenceDone` (FAM/CAR wiring); the domain-to-`{frequency, interval}` mapper (FAM-06 / FAM-07); F0-16 seed data.

## Acceptance criteria status
- 8 / 8 MET (AC-01 to AC-08). AC-03's wording ('Aisha R.') conflicts with PD-038; behaviour is met with the full name (FD-02, HUMAN REVIEW).

## Tests
- Written: 8 / 8 planned (T-01 to T-08) plus supporting tests: pgTAP 68, derive-status 17, melbourne-time 12, build-occurrences 33, get-occurrences 18, integration 5
- Passing: all. `supabase test db`: 99 (4 files). Unit: 80 across the four new TypeScript files. `tests/integration/care-events.test.ts` against the local stack: 5
- Failing: 0 of ours. Full `npm run test` (default env): 594 passed, 5 skipped (the local-only integration tests), 1 failed (the `day-timeline` test above, unrelated)

## Files changed
- `supabase/migrations/20260925030000_care_events.sql`, `supabase/tests/care_events.test.sql`, `supabase/tests/audit_log.test.sql` (scoped, FD-01)
- `src/lib/supabase/database.types.ts` (added blocks, FD-10)
- `src/lib/dates/melbourne-time.ts` (moved from mocks, FD-09), `src/mocks/melbourne-time.ts` (re-export), `src/lib/occurrences/derive-status.ts`
- `src/server/events/`: `build-occurrences.ts`, `occurrences.ts`, `queries.ts` (`getOccurrences`), `src/mocks/queries/events.ts` (mock `getOccurrences`), tests
- `tests/integration/care-events.test.ts`
- This feature's docs (DATA_MODEL.md updated to what was built)

## Decisions
- FD-01 F0-08 audit test scoped (HUMAN REVIEW); FD-02 full actor names vs AC-03 (HUMAN REVIEW); FD-03 due time is the start; FD-04 idempotent tick-off (HUMAN REVIEW); FD-05 schema differs from the proposal; FD-06 access rules; FD-07 history blocks deletion; FD-08 `getOccurrences` shape; FD-09 time helpers in lib; FD-10 types merged by hand; FD-11 defaults.

## Problems encountered
- `.env.local` points at a hosted Supabase project (see FAM-12 PROGRESS). This feature's integration test runs only against a local URL; run it with the three variables from `supabase status -o env`. **The migration is applied to the local database only.**
- Your local database already has FAM-12 and FAM-13's migrations (on `family-dev`, not on this `main`-based branch), so `supabase migration up` refused; I applied this migration with `psql` and recorded its version. Revert script kept out of the repo.
- The audit log is append-only and integration tests commit rows to it, which broke F0-08's unscoped pgTAP assertions on a used database (FD-01) and one of my own (scoped).
- The real database exposed a precision bug my unit tests could not: an anchor with milliseconds never matched its occurrence key. Fixed by whole-second checks (FD-05).
- `src/components/shared/calendar/day-timeline.test.tsx` failed once in the full run and passes at other times on identical code (the machine clock read 18:50); not touched.
- Stale `.next/types` from `family-dev` builds broke typecheck on this branch until `.next` was cleared.

## Assumptions
- Due time is the occurrence start (FD-03); a second tick-off leaves the first actor (FD-04).

## Next action
- Human reviews (AC-03 wording, idempotency, due time, F0-08 test scoping, schema additions), then approves opening the PR to `main`.

## Ready for PR
- No
