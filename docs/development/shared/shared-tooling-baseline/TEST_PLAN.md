# Test Plan — F0-02 Tooling baseline: TypeScript, lint, format, test runners

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **ci** → CI workflow run / scripted check
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **review** → Documented review checklist in PROGRESS.md

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | ci | Given a clean checkout, when `npm run verify` runs, then lint, typecheck, format check and unit tests all run and the command exits 0. | ☑ | PASS — `npm run verify` exit 0 (lint: 0 errors/1 pre-existing warning; typecheck clean; format:check clean; 2 test files / 3 tests passed) |
| T-02 | AC-02 | ci | Given a file with a TypeScript error is introduced, when `npm run verify` runs, then it exits non-zero and names the file. | ☑ | PASS — deliberate error in `src/lib/example.ts` made `npm run verify` exit 1, `tsc` output named `src/lib/example.ts(5,14): error TS2322`; reverted after confirming |
| T-03 | AC-03 | e2e | Given the app is built, when `npm run test:e2e` runs, then the Playwright smoke test loads `/` and passes. | ☑ | PASS — `npm run test:e2e` (build via `pretest:e2e`) → 1 passed |
| T-04 | AC-04 | review | Given F0-02 is merged per OQ-01, when `git branch -r` is listed, then `family-dev`, `carer-dev` and `admin-dev` exist and contain the tooling baseline. | ☑ | PENDING — can only run after this PR merges to `main`; tracked as the immediate next action post-merge (see PROGRESS.md) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
