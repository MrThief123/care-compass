# Session State — F0-16 Development seed data from the design content

Last session date: 2026-09-30
Current branch: `feature/shared-dev-seed-data` (from `main`)
Worked on: seed.sql, seed script, integration tests, SEED_DATA.md
What changed: `supabase/seed.sql`, `scripts/seed.mjs`, `package.json` (`db:seed`), `tests/integration/shared-dev-seed-data.test.ts`, `docs/SEED_DATA.md`, feature docs, F0-16 cards (Helen's email)
Tests run: `supabase db reset` (x3, identical data), `npm run db:seed`, `supabase test db`, `npm run verify`
Test results: all green (pgTAP 14 files / 446; Vitest 2186; seed tests 6/6)
Current blocker: none
Important discoveries: `carer_client_assignments` was retired by F0-18 (access is from shifts). Eight pgTAP files insert helen@example.com, so Helen is seeded as helen.doyle@example.com (FD-01). sign_up pgTAP test 21 counts organisations named "Wattle Care", so the second organisation is Kookaburra Care.
Important decisions: FD-01 (human), FD-02 to FD-05 (see DECISIONS.md)
Exact next action: none; merged to `main` in #172 (2026-09-30).
Files likely to be touched next: none unless review asks for changes
Warning for next session: run `npm run db:seed` after every `supabase db reset`. Any new migration that adds a NOT NULL column or a table the seed should fill must also update `supabase/seed.sql` and `docs/SEED_DATA.md`.
