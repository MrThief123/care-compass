# Progress — F0-18 Carer view access derived from shifts

Status: IMPLEMENTED
Owner: MrThief123
Lane: B — Backend
Sprint: SPRINT · planned D8
Branch: `feature/shared-carer-shift-access`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-27 (implemented; ready for review)

## Blockers
- None

## Completed
- Claimed on `feature/shared-carer-shift-access` (2026-09-27)
- Migration `20260927030000_carer_shift_access.sql`: `is_assigned_carer()` redefined over
  `shifts`; `carer_client_assignments` dropped (its policy and F0-08 audit trigger went with
  it); `transfer_client_organisation()` re-created without the retired table's update step
- `supabase/tests/carer_shift_access.test.sql`: new, 17 assertions covering AC-01 to AC-09
- Four other fixture files updated to stop using the retired table (`tenancy_rls`,
  `care_events`, `transfer_client_organisation`, `documents` pgTAP; plus the Vitest
  `family-change-organisation` integration test) — see DECISIONS.md FD-01
- `database.types.ts` regenerated for real; the recurring blocker three prior features hit
  and deferred is resolved (`src/app/api/test/route.ts` fixed; two typed-cast workarounds in
  F0-17's and F0-13's code removed now that the real types cover them) — see DECISIONS.md FD-02
- ARCHITECTURE.md updated (§5.2, §5.3, the table list) per CHG-027's authorisation

## In progress
- None

## Remaining
- Human review; then push (already pushed) and open the PR to `main`

## Acceptance criteria status
- 9 / 9 MET

## Tests
- Written: 9 / 9 (T-01 to T-09), all in the new `carer_shift_access.test.sql` (17 pgTAP
  assertions; several ACs need more than one assertion — e.g. AC-01/AC-02 also check
  `carer_on_active_shift` is unaffected)
- Passing (2026-09-27), against a freshly reset local database (`supabase db reset --local`,
  all 6 migrations apply cleanly in order):
  - `supabase test db`: whole suite PASS, 238 assertions across 9 files
  - Full Vitest suite: 1926 passed, 22 skipped, 0 failed (ran twice for confidence after one
    flaky run showed 4 unrelated failures that don't reproduce — see Problems encountered)
  - `vitest run tests/integration` (local Supabase): 36 / 37 — the one failure is
    `[F0-07][AC-10]` TOTP, which fails identically on `main` with no changes applied (a stale
    local container issue, not caused by this feature)
  - `npx playwright test tests/e2e/auth.spec.ts tests/e2e/sign-up.spec.ts`: 9 / 9
  - `npm run build`: succeeds
- Lint: 0 errors (3 pre-existing warnings, unrelated files). Typecheck: clean.

## Files changed
- Migration: `supabase/migrations/20260927030000_carer_shift_access.sql`
- Tests (new): `supabase/tests/carer_shift_access.test.sql`
- Tests (fixture rewrites): `supabase/tests/tenancy_rls.test.sql`,
  `supabase/tests/care_events.test.sql`, `supabase/tests/transfer_client_organisation.test.sql`,
  `supabase/tests/documents.test.sql`, `tests/integration/family-change-organisation.test.ts`
- Code: `src/lib/supabase/database.types.ts` (regenerated), `src/app/api/test/route.ts` (fixed),
  `src/server/auth/registration.ts`, `src/server/documents/db.ts` (both simplified)
- Docs: `ARCHITECTURE.md`, this folder

## Decisions
- PD-041, CHG-027 (root DECISIONS.md); see this folder's DECISIONS.md (FD-01, FD-02)

## Problems encountered
- One full-suite Vitest run showed 4 failures (an axe check, a budget-bucket form test, two
  event-form-cost tests) in files this feature never touches. Re-ran the full suite twice
  more (both fully green) and confirmed the same 4 tests pass in isolation and that the
  suite is 100% green on `main` with these changes stashed — pre-existing cross-file test
  flakiness (worker/timing related), not caused by this feature. Not investigated further,
  since fixing unrelated flakiness is outside this feature's scope.
- The database.types.ts/api-test-route blocker (see DECISIONS.md FD-02) — the main technical
  problem this session solved rather than deferred.

## Assumptions
- `is_assigned_carer`'s exact predicate (non-cancelled, `ends_at > now()`, carer `is_active`)
  is read directly from PRD Scope and the worked example, not inferred.

## Next action
- Human reviews; on approval, open the PR to `main` (already pushed).

## Ready for PR
- Yes, from this feature's own side (all ACs met, full suite green). Not opened: needs the
  human's approval (CLAUDE.md §8).
