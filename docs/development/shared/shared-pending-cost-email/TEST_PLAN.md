# Test Plan — INT-11 Email Family and admins when an event cost goes pending

## Approach
Tests first (TESTING.md §2; CLAUDE.md §5). New `tests/integration/pending-cost-emails.test.ts` (Vitest against local Supabase, `FakeEmailProvider`, same convention as `tests/integration/budget-thresholds.test.ts`); new `supabase/tests/` pgTAP file for the table and function; route test beside the new route. Test titles start `[INT-11][AC-xx]`. Own synthetic fixtures; pending costs made by completing an event whose cost exceeds the balance (the real trigger path), not by hand-inserting where avoidable.

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Bucket balance 50, event cost 80 completed; job runs; every Family and admin recipient has one email with the exact approved sentence, $80.00, event title, bucket name; body has no client or actor name. | ☑ | MET |
| T-02 | AC-02 | integration | Run the job twice; second run sends nothing; one marker row; also run two jobs concurrently, one marker row. | ☑ | MET (T-02, T-02b) |
| T-03 | AC-03 | integration | (a) cost covered, status paid: no email. (b) cost pending, funds added (`add_funds`) before the run: no email. (c) emailed cost later paid, run again: nothing. | ☑ | MET |
| T-04 | AC-04 | integration | Three pending costs (two buckets) for one client in one run: each recipient gets exactly one email with three lines each naming its bucket; three marker rows. One cost: one-line email. | ☑ | MET |
| T-05 | AC-05 | integration | Family, active admin, inactive admin, carer, other-org admin, other client's family: only Family and the active admin get it; transfer the client to another org, new cost: the old org's admin does not. | ☑ | MET |
| T-06 | AC-06 | integration | Provider fails for one recipient: no marker, result lists the cost id, other client still sent and recorded; next run with a working provider sends and records. | ☑ | MET |
| T-07 | AC-07 | integration + pgTAP + route | Console and result contain no names/amounts/titles/addresses; anon and authenticated cannot select the table or call the function (pgTAP `has_function_privilege`, RLS on, no policies); route returns 401 for missing/wrong secret on GET and POST and does not run the job. | ☑ | MET (integration + pgTAP + route) |
| T-08 | AC-08 | regression | INT-01 `budget-thresholds.test.ts`, route test, F0-12 pgTAP pass unchanged. | n/a | PASS (INT-01 test file passes; its route test changed one assertion, see DECISIONS FD-12) |
| T-09 | edge | integration | Client with no recipients: nothing sent, nothing recorded, no failure; adding a Family member then re-running sends. | ☑ | MET |

## Regression scope
- `npm run lint`, `npm run typecheck`, unit suite, `tests/integration/budget-thresholds.test.ts`, `tests/integration/pending-cost-emails.test.ts`, `supabase test db` (migration added).
- No e2e (no UI). Do not trigger workflow runs; run locally and say so in the PR (CI down).

## Test data
- Own fixtures. `supabase migration new` for the migration, never a hand-picked version.
