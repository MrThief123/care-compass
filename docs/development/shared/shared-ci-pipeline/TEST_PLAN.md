# Test Plan — F0-03 Continuous integration pipeline

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **ci** → CI workflow run / scripted check

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | ci | Given a PR targeting `family-dev`, when it is opened, then lint, typecheck, format, unit test, build, audit and commitlint jobs run. | ☑ | PASS — `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build`, `npm audit --audit-level=high` all ran green locally against the workflow's exact commands (2026-09-18) |
| T-02 | AC-02 | ci | Given a PR introduces a lint error, when CI runs, then the lint job fails and the overall check is red. | ☑ | PASS — deliberate parse error in a scratch file made `npm run lint` exit 1; removing it restored exit 0 (2026-09-18) |
| T-03 | AC-03 | ci | Given a PR contains a commit message `update`, when CI runs, then the commitlint job fails. | ☑ | PASS — `echo "update" \| npx commitlint` exits 1 (subject/type empty); a Conventional Commits message exits 0 (2026-09-18) |
| T-04 | AC-04 | ci | Given `supabase/tests` exists, when CI runs, then the database test job executes `supabase test db` and fails the check on test failure. | ☑ | BLOCKED — `supabase/tests` doesn't exist yet (F0-06 not started); job's existence check correctly resolves to skip-without-failure in that state. Full loud-failure path re-verify once F0-06 lands. |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
