# Test Plan — F0-13 Client document storage

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given Helen is Margaret's family, when she uploads 'Care plan.pdf' within the allowed size, then a documents row exists and the object is stored under Margaret's path. | ☐ | NOT RUN |
| T-02 | AC-02 | integration | Given an existing document, when Helen requests its URL, then a signed URL is returned that expires. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given a file type not in the allowed list, when uploaded, then it is rejected with a plain-language message and nothing is stored. | ☐ | NOT RUN |
| T-04 | AC-04 | db | Given Robert's family member, when they request Margaret's document object, then access is denied. | ☐ | NOT RUN |
| T-05 | AC-05 | integration | Given a document is detached, when documents for the event are listed, then it is excluded but the row and object still exist. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
