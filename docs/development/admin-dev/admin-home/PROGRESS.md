# Progress — ADM-01 Admin Home — counts and overdue events

Status: MERGED TO DEV
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D8
Branch: `feature/admin-home`
PR target: `main` (merged in #163, 2026-09-29; CHG-036)
Last updated: 2026-09-30

## Blockers
- None. OQ-29 is ANSWERED (PD-055, root DECISIONS.md).

## Dependencies status
- F0-11 — MERGED TO DEV
- ADM-UI-01 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Confirmed the route, stat cards, Overdue events card and empty state were already built and merged
  under ADM-UI-01 against mock data; nothing there needed rebuilding.
- CHG-034 (human, in-session): Upcoming shifts brought into ADM-01's own scope, reversing CHG-006's
  "no live shift queries" restriction. PRD/AC/TEST_PLAN updated accordingly.
- Wired `getAdminHome()` (`src/server/admin/queries.ts`) to Supabase: organisation-wide counts
  (clients; active carers only for Staff), overdue derivation (looped per client with the same
  `loadOccurrences` a client dashboard uses, over a 30-day window, since no org-wide SQL aggregate
  exists and the recurrence engine is TypeScript-only, F0-09), and upcoming shifts (direct `shifts`
  read joined to `clients`/`profiles`). RLS alone scopes every read to the admin's own organisation —
  no manual `organisation_id` filter needed. See `admin-home/DECISIONS.md` FD-01 for the full design
  reasoning (overdue/upcoming row caps, staff-count scope, nurse-name full-name fix per PD-038).
- Tests: unit (`src/server/admin/queries.test.ts`, mock-mode, unchanged and still green) and a new
  Supabase integration test (`tests/integration/admin-home.test.ts`) covering counts, overdue
  derivation with full carer name, org-scoping/RLS (a second organisation's data never leaks in) and
  upcoming shifts (ordering, formatting, cancelled/past/other-org exclusion).

## In progress
- None

## Remaining
- None in ADM-01's scope.

## Acceptance criteria status
- 5 / 5 MET

## Tests
- Written: 1 new integration file (5 tests); 1 existing unit test removed (see DECISIONS.md FD-01,
  HUMAN REVIEW)
- Passing: full `npx vitest run` — 2047 passed, 59 skipped (pre-existing, unrelated); new integration
  file 4/4 (note: `admin-home.test.ts` has 4 tests, not 5 — T-04 is covered by the pre-existing
  `admin-home-screen.test.tsx` component test, not duplicated here); lint 0 errors, typecheck and
  format clean
- Failing: 0

## Files changed
- `src/server/admin/queries.ts` — `getAdminHome()`'s Supabase branch
- `src/server/admin/queries.test.ts` — removed the now-false "not implemented" supabase-mode test
  (HUMAN REVIEW: see below)
- `tests/integration/admin-home.test.ts` — new
- `docs/development/admin-dev/admin-home/{PRD,ACCEPTANCE_CRITERIA,TEST_PLAN,PROGRESS,SESSION_STATE,DECISIONS}.md`
- `DECISIONS.md` (root) — CHG-034

## Decisions
- See DECISIONS.md (FD-01: overdue/upcoming-shift design choices, removed test; root DECISIONS.md
  CHG-034: Upcoming shifts brought into scope)

## Problems encountered
- `.env.local` in this checkout points at a hosted Supabase project, so the integration suite skips by
  default; ran it locally with `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
  `SUPABASE_SERVICE_ROLE_KEY` overridden inline to the local stack's values (`supabase status`), same
  approach as FAM-10.
- `formatShortDate`'s "Sept" (not "Sep") for September, an ICU quirk of the shared formatter, tripped
  an overly-strict test regex; loosened rather than treated as a bug in shared code.

## Assumptions
- PROPOSED items in PRD.md (30-day overdue window, 20-row caps on overdue/upcoming) are adopted as
  written since neither is a blocking OQ; see DECISIONS.md FD-01.
- **HUMAN REVIEW: test expectation changed.** `src/server/admin/queries.test.ts`'s
  `[ADM-UI-01][AC-01] does not silently serve mock totals in Supabase mode` was removed, since ADM-01
  wires exactly that function. See DECISIONS.md FD-01.
- **HUMAN REVIEW: performance.** Overdue derivation is a `Promise.all` fan-out of up to ~4 queries per
  organisation client (bounded by client count, ~42 in the design's own example). Worth re-checking if
  an organisation's client count grows well beyond that.

## Next action
- Human review of the PR: FD-01's removed test, the fan-out performance note, and CHG-034's scope
  addition (Upcoming shifts wired live).

## Ready for PR
- Yes
