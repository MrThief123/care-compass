# Test Plan — INT-10 Budget threshold email names the bucket

## Approach
Tests first (TESTING.md §2). Extend `tests/integration/budget-thresholds.test.ts` (Vitest against local Supabase, same convention as INT-01).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given two buckets, one over 100%, when the job runs, then every email body contains that bucket's name and not the other's. | ☑ (T-01, T-02 failed first: body lacked the bucket name; T-03 is a guard and passed first) | PASS |
| T-02 | AC-02 | integration | Given a single bucket, when the job runs, then the body reads "...has reached N% of its <name> allocation for the present period." | ☑ (T-01, T-02 failed first: body lacked the bucket name; T-03 is a guard and passed first) | PASS |
| T-03 | AC-03 | integration | Given a run, when `console` output and the job result are inspected, then neither contains the bucket or client name or an address. | ☑ (T-01, T-02 failed first: body lacked the bucket name; T-03 is a guard and passed first) | PASS |
| T-04 | AC-04 | integration | INT-01's T-01..T-05 and `route.test.ts` pass unchanged (no existing assertion changed). | n/a | PASS (9/9 in the file) |

## Regression scope
- `npm run lint`, `npm run typecheck`, unit suite, `tests/integration/budget-thresholds.test.ts`, `supabase test db` (no migration, run only if touched).

## Test data
- Own fixtures (as INT-01).
