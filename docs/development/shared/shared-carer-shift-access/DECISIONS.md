# Decisions — F0-18 Carer view access derived from shifts

## Decisions affecting this feature

| ID | Decision | Status |
|---|---|---|
| PD-041 | Carer read/edit access derived from shifts; no assignment table. | ANSWERED |
| CHG-027 | Implement PD-041 read access; retire `carer_client_assignments`. | CONFIRMED 2026-09-26 |

## Feature decisions log

### FD-01 — Four fixture files rewritten, not just the three the PRD named
- Date: 2026-09-27
- Context: see TEST_PLAN.md "Files updated beyond the three named above" for the full detail. `supabase/tests/documents.test.sql` didn't exist when this feature's docs were written (F0-13 merged the day before); `tests/integration/family-change-organisation.test.ts` is a Vitest integration test, outside the PRD's pgTAP-only search.
- Decision: rewrote both the same way as the three named files — replace the assignment row with an equivalent shift, replace any assertion about the retired table with the same intent proved through `is_assigned_carer()` or the surviving `shifts` row.
- Reason: the table is gone; anything that seeded or queried it would fail regardless of which file it lives in or which feature owns it.
- Alternatives considered: none — leaving either file broken was never an option.
- Consequences: none.
- Test changes caused: see TEST_PLAN.md. No assertion removed; each has a same-intent replacement.
- Human confirmation required: no

### FD-02 — Resolved the recurring `database.types.ts` / `api/test/route.ts` blocker
- Date: 2026-09-27
- Context: F0-08, F0-12 and F0-17 each hit the same wall and deferred it: regenerating `database.types.ts` broke typecheck on `src/app/api/test/route.ts` (an F0-04 dev-connectivity route querying a `test` table no migration ever created), so each reverted the regeneration and worked around the gap with a local typed-cast wrapper (F0-12's FD-04, F0-17's FD-06, F0-13's FD-04). F0-18's own Scope requires regenerating the types (to drop `carer_client_assignments` and add `shifts`/`documents`/the sign-up functions it was already missing).
- Decision: pointed `src/app/api/test/route.ts` at `organisations` instead of the nonexistent `test` table (the same fix F0-07's session had already found once, per its own PROGRESS.md, that had since been lost when a later regeneration was reverted). Regenerated `database.types.ts` for real this time. Also removed the now-unnecessary typed-cast wrappers this exact gap forced in `src/server/auth/registration.ts` (F0-17) and `src/server/documents/db.ts` (F0-13) — their own comments said to remove them once the types were regenerated.
- Reason: this feature's Scope already required the regeneration; finishing what three prior features explicitly deferred, now that it's actually possible, is not additional scope, and leaving it deferred a fourth time serves no one.
- Alternatives considered: regenerate and leave the two wrapper files as they were (their casts would just become redundant, not wrong) — done anyway since removing dead workaround code their own comments asked for is a trivial, low-risk cleanup, verified by a full typecheck and test run afterwards.
- Consequences: `database.types.ts` is now a true reflection of the schema; any future feature that hit this same wall no longer will. `src/app/dev-preview-database` keeps working exactly as before (a bare connectivity check).
- Human confirmation required: no (mechanical; verified with `npm run build`, full `tsc`, and the full test suite)

### FD-03 — Three more `carer_client_assignments` users missed by FD-01's audit, found by CI
- Date: 2026-09-28
- Context: FD-01 rewrote every file this feature's own search found. CI on `main` (PR #143's
  run) then failed `supabase test db` with `relation "carer_client_assignments" does not
  exist` in `supabase/tests/budget.test.sql` (F0-12, merged the same day as this feature,
  after this feature's own audit ran) — its seed still inserted into the dropped table.
  Chasing the same pattern with `grep -rl carer_client_assignments src tests supabase` found
  two more silent cases: `tests/integration/care-events.test.ts` and (copied from it by the
  fork that implemented FAM-06) `tests/integration/family-add-event.test.ts` both called
  `admin.from("carer_client_assignments").insert(...)` without checking `.error`, so the
  insert had been failing silently in every run since this feature merged — it just happened
  not to change either file's test outcome, since each test that needed Aisha's access
  already created its own `shifts` row inline.
- Decision: fixed on `fix/budget-test-carer-client-assignments` (from `main`): deleted the
  dead insert in `budget.test.sql` (the seed's own subsequent `shifts` row already grants the
  access `is_assigned_carer()` checks) and in both Vitest files (each test needing Aisha
  assigned already seeds its own `shifts` row; `family-add-event.test.ts`'s case actually
  wanted her *not* assigned, so removing it is the correct fix, not just a no-op cleanup).
- Reason: same as FD-01 — the table is gone; anything that seeded it would fail or silently
  no-op regardless of which feature owns the file. `budget.test.sql`'s failure was live and
  blocking `main`'s CI; the two Vitest cases were latent (passing by accident, not by proof).
- Alternatives considered: none — leaving `main`'s CI red, or leaving a silently-failing
  insert that happened to not matter yet, were never options.
- Consequences: `supabase test db` is green on `main` again (401 assertions, 10 files). The
  two Vitest seeds no longer perform a doomed insert every run.
- Human confirmation required: no — mechanical continuation of FD-01, verified with
  `supabase test db`, `tsc --noEmit`, `npm run lint`, `npx prettier --check`, the full
  `tests/integration` run (14/15 files; the 1 failure is the pre-existing, unrelated local
  TOTP/MFA-enroll-disabled issue), the full Vitest suite (1980 passed / 39 skipped), and
  `npm run build`.
- Test changes caused: none — no assertion added, changed or removed; only dead/silently-
  failing seed statements removed.

### Process note — regeneration verified before committing
`npm run db:types` was run against the local stack after this migration, producing about
700 changed lines (in line with F0-08's/F0-12's earlier estimate of ~1,500 for a bigger gap).
`tsc --noEmit`, `npm run build`, the full Vitest suite (1926 passed) and `supabase test db`
(238 assertions) all ran clean afterwards — nothing here is claimed to work without having
been run for real.

