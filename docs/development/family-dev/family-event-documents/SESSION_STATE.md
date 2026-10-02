# Session State — FAM-08 Family — Event documents (file tiles)

Last session date: 2026-10-02
Current branch: `fix/family-event-documents-ac01` (from `main` at 09c54f7; worktree
`care-compass-fam08`). FAM-08 itself merged in #184; this branch only closes AC-01.
Worked on: running T-01 against the local Supabase stack for the first time.
What changed: `tests/e2e/family-event-documents.spec.ts` seed (care event `starts_at` truncated to
a whole second, DECISIONS.md FD-03); AC-01 → MET; TEST_PLAN T-01 → PASS; PROGRESS.md.
Tests run: T-01 1/1, then 3/3 with `--repeat-each 3`; `event-documents.test.tsx` and the Edit event
page test (mock); `DATA_SOURCE=mock npx vitest run src tests/unit` 2376/2376; `npm run
test:integration` 173 passed / 3 failed (local-stack state and parallel-file collisions, not FAM-08 —
details in PROGRESS.md "Tests"); tsc, eslint, prettier clean.
Current blocker: none. PR #199 open to `main` (human tested the Edit event upload manually first).
Important discoveries:
- Local stack was 3 migrations behind `main`; applied with `supabase migration up --local` (no reset).
- Storage uploads need the local-only `idx_objects_current_version_c` index (re-added this session).
- The worktree has no `.env.local`; export the local stack's URL/anon/service-role keys from
  `supabase status -o env` before unit, integration or e2e runs, or many files fail at import.
- T-01's `cleanUp` can't delete its client/org once a document exists (documents are append-only),
  so each passing run leaves one `fam-08-*` org + client on the local stack. Same as F0-13's
  integration tests; accepted.
Important decisions: DECISIONS.md FD-03.
Exact next action: human reviews and merges PR #199.
Files likely to be touched next: none.
Warning for next session: Add event uploads (FD-01) are a separate follow-up; don't fold them in here.
