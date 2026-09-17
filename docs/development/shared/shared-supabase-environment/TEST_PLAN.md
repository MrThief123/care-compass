# Test Plan — F0-04 Environment configuration and Supabase integration

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **ci** → CI workflow run / scripted check
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Given `NEXT_PUBLIC_SUPABASE_URL` is missing, when `env.ts` is loaded, then it throws an error naming `NEXT_PUBLIC_SUPABASE_URL`. | ☐ | NOT RUN |
| T-02 | AC-02 | ci | Given a file outside `src/server/jobs/` imports the service-role client, when lint runs, then lint fails with the restricted-import message. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given a signed-in user session cookie, when the server client queries a table, then the query runs with that user's JWT (auth.uid() equals the user id). | ☐ | NOT RUN |
| T-04 | AC-04 | ci | Given a production build, when the client bundle output is searched for the service-role key variable name, then no match is found. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
