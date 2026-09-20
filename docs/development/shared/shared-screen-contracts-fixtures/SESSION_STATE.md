# Session State — UI-04 Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

Last session date: 2026-09-20
Current branch: `feature/shared-screen-contracts-fixtures`
Worked on: the whole feature, tests first in two phases (contract, then fixtures), with a milestone push between them.
What changed: contract in `src/server/events`, `src/server/documents`, `src/types/domain.ts`, `src/mocks/queries`; fixtures in `src/mocks/fixtures.ts`, `history.ts`, `melbourne-time.ts`; seven new test files; one existing test expectation (FD-06); root DECISIONS.md CHG-004 and CHG-005; DEVELOPMENT_PLAN.md UI-04; this folder. Commits: `cd15c5d` claim, `f27c28d` and `337209a` red tests, `5c4905d` contract, `bf311cc` red fixture tests, `1c09440` fixtures, `99e26b8` docs (results, decisions, readiness), then this session-state commit.
Tests run: `npx vitest run src`, `npx vitest run`, `npm run lint`, `npm run typecheck`, `npm run format:check`.
Test results: src 56 files / 414 tests pass. Full run 60 files / 420 tests pass, with only `tests/integration/shared-supabase-environment.test.ts` failing at import (no Supabase env vars, known baseline). Lint 0 errors and 23 pre-existing warnings; typecheck and format clean.
Current blocker: none. PR #52 is merged to `main` (2026-09-20).
Important discoveries: FAM-UI-01 and FAM-UI-07 designs disagree on the overdue count (FD-04); the mandated order reverses the drawn within-day order on Mon 30 Nov (FD-05); a wall-clock-dependent baseline flake exists in `day-timeline.test.tsx`; the ESLint boundary test is load-sensitive (FD-12).
Important decisions: FD-01 to FD-13, CHG-004, CHG-005.
Exact next action: none. The feature is merged.
Files likely to be touched next: none in this feature until review feedback.
Warning for next session: none. The human answered FD-04 and FD-05 on 2026-09-20 and the fixtures stay as built (two overdue, rule as built), so the one-row switch in FD-04 is not needed.
