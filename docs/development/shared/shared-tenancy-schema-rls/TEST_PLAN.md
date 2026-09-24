# Test Plan — F0-06 Identity, organisation and client access schema with RLS

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Given Helen is linked to Margaret, when Helen selects from `clients`, then only Margaret's row is returned. | ☑ | PASS |
| T-02 | AC-02 | db | Given Helen is not linked to Robert, when Helen selects Robert's row by id, then zero rows are returned. | ☑ | PASS |
| T-03 | AC-03 | db | Given Priya is admin of Banksia Home Care, when she selects from `clients`, then exactly the clients whose organisation_id is Banksia are returned. | ☑ | PASS |
| T-04 | AC-04 | db | Given a client belongs to another organisation, when Priya selects it, then zero rows are returned. | ☑ | PASS |
| T-05 | AC-05 | db | Given Aisha has an active assignment to Margaret, when Aisha selects from `clients`, then Margaret is returned. | ☑ | PASS |
| T-06 | AC-06 | db | Given Aisha belongs to Banksia but has no assignment to Robert, when Aisha selects Robert, then zero rows are returned. | ☑ | PASS |
| T-07 | AC-07 | db | Given Aisha's assignment to Margaret has ended_at in the past, when Aisha selects Margaret, then zero rows are returned. | ☑ | PASS (fixture uses a second client, Nell, so this case doesn't collide with T-05's active-assignment fixture on Margaret within the same seed transaction — same behaviour under test) |
| T-08 | AC-08 | db | Given Aisha's profile is_active is false, when she selects from `clients`, then zero rows are returned. | ☑ | PASS (fixture uses a separate deactivated-carer profile, since Aisha is active elsewhere in this suite — same behaviour under test) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
