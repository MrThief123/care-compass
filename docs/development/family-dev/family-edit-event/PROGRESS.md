# Progress — FAM-07 Family — Edit event

Status: READY FOR PR
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-edit-event` (from `main`)
PR target: `main` (dashboard features now branch from and target `main` directly, not the dev branches)
Last updated: 2026-09-28

## Blockers
- None — OQ-10, OQ-11 and OQ-22 are ANSWERED (root DECISIONS.md: PD-044/CHG-009, PD-045, PD-047)

## Dependencies status
- FAM-06 — MERGED

## Completed
- Traced the gap: FAM-UI-03 already built the Edit event route/screen and wired it to call
  `getEvent`/`getOccurrence`/`getEventDocuments`/`getBudgetSummary`, but Save was still Phase 1
  (local state only) and three of those four read functions had no Supabase branch.
- Wired `getEvent`, `getOccurrence` (delegates to the already-Supabase-wired `getOccurrences`) and
  `getEventDocuments`'s Supabase branches (FD-03).
- Implemented `updateEvent` (`src/server/events/actions.ts`): series-wide fields always update the
  event directly; Date/Start time is scope-sensitive (occurrence override vs. series, refused for
  a recurring event's series scope to protect occurrence identity) — FD-01.
- Added Title/Start time/Duration (PD-047) to Edit event too (previously Add event only), and the
  scope selector (PD-045) — shown only for a recurring event, "This and future" disabled pending
  human review (FD-02).
- Regenerated `database.types.ts` (stale again since before F0-12/F0-18).

## In progress
- None

## Remaining
- "This and future" (the third PD-045 scope) — FD-02, HUMAN REVIEW requested.

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 4 component-level (page.test.tsx) + 5 component-level (event-form-edit.test.tsx,
  AC-03/scope) + 8 integration (tests/integration/family-edit-event.test.ts)
- Passing: all — full Vitest suite (2048 passed / 47 skipped), `supabase test db` (401/401), full
  `tests/integration` (61/62 — the 1 failure is the pre-existing `[F0-07][AC-10]` TOTP issue),
  `npm run typecheck`/`lint`/`prettier --check`/`build`, and this dashboard's Playwright e2e specs
- Failing: 0

## Files changed
- `src/server/events/actions.ts` — `updateEvent`; `parseOccurrenceKey`/`RECURRENCE_TO_DB` moved out
- `src/server/events/occurrence-key.ts`, `src/server/events/recurrence-mapping.ts` — new, shared
- `src/server/events/queries.ts` — `getEvent`/`getOccurrence` Supabase branches
- `src/server/documents/queries.ts` — `getEventDocuments` Supabase branch
- `src/mocks/queries/events.ts` — mock `updateEvent`
- `src/features/family-event-form/event-form-screen.tsx` — edit-mode Save wiring
- `src/features/family-event-form/edit-scope.ts`, `edit-scope-fields.tsx` — new
- `src/features/family-event-form/event-details.ts` — `editEventDetailsValues`
- `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.tsx` — new props
- `src/lib/supabase/database.types.ts` — regenerated
- Tests: `events/[eventId]/edit/page.test.tsx`, `event-form-edit.test.tsx` (new),
  `event-form-cost.test.tsx` (updated), `tests/integration/family-edit-event.test.ts` (new);
  removed 3 pre-existing "not implemented" unit tests this feature made false (FD-03)

## Decisions
- See DECISIONS.md (FD-01 scope-sensitivity model, FD-02 HUMAN REVIEW — "this and future",
  FD-03 read-side wiring, FD-04 a shared-kit `ChipGroup` bug discovered and worked around)

## Problems encountered
- `[F0-07][AC-10]` (TOTP) fails locally — pre-existing, local Supabase has TOTP enroll disabled.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human reviews FD-02 ("this and future"); then push (already done) and open the PR to `main`.

## Ready for PR
- Yes, pending FD-02 review.
