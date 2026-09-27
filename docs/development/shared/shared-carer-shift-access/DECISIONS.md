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

### Process note — regeneration verified before committing
`npm run db:types` was run against the local stack after this migration, producing about
700 changed lines (in line with F0-08's/F0-12's earlier estimate of ~1,500 for a bigger gap).
`tsc --noEmit`, `npm run build`, the full Vitest suite (1926 passed) and `supabase test db`
(238 assertions) all ran clean afterwards — nothing here is claimed to work without having
been run for real.

