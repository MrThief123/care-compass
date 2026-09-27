# Test Plan — F0-12 Budget buckets, fund top-ups, spending and summary calculation

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

Rewritten 2026-09-27 for CHG-020 / CHG-021 / CHG-022 (see DECISIONS.md FD-01).

## Test levels used
- **db** → `supabase/tests/budget.test.sql` (pgTAP via `supabase test db`)
- **unit** → `src/lib/money/schema.test.ts`, `src/lib/format/money.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Summary of a bucket with $24,000 funds and $9,120 paid costs: remaining 14880.00, percent_used 38. | ☑ | PASS |
| T-02 | AC-02 | db | Summary of $3,000 funds and $2,760 paid: percent 92, state 'alert'. Boundaries 74 normal, 75 warning, 85 alert, 100 depleted; $0 funds gives percent null, 'normal'. | ☑ | PASS |
| T-03 | AC-03 | db | `remove_funds` above the balance raises 'Only $X available' and inserts nothing; exactly the balance succeeds and leaves 0.00. | ☑ | PASS |
| T-04 | AC-04 | db | `add_funds` / `remove_funds` with 0, -5 and 12.345 raise 22023 and insert nothing. | ☑ | PASS |
| T-05 | AC-05 | db | Unlinked user selects zero rows from buckets, entries, costs and summary; family and admin can change funds; assigned carer and other-organisation admin get 42501 from every change function. | ☑ | PASS |
| T-06 | AC-06 | unit | Money schema rejects '12.345', '-5', '0', 'abc', '1e3' and accepts '12', '12.5', '12.50'. | ☑ | PASS |
| T-07 | AC-07 | db | Completing an occurrence of a costed event charges it once as paid; re-doing after undo charges nothing more; a second occurrence is charged again. | ☑ | PASS |
| T-08 | AC-08 | db | Completing when the bucket cannot cover the cost records the whole cost pending, occurrence still Done; a later smaller cost is also pending while any is pending; summary shows pending totals and 'depleted'. | ☑ | PASS |
| T-09 | AC-09 | db | Adding funds pays pending costs whole, oldest first, stopping at the first that does not fit; no new History row; paid_on set. | ☑ | PASS |
| T-10 | AC-10 | db | Bucket name rules (required, 40 max, unique ignoring case and spaces), $0 starting amount, rename keeps entries and writes no row, kind check. | ☑ | PASS |
| T-11 | AC-11 | db | `remove_bucket` succeeds only with no charges, records 'bucket_removed' of minus the leftover, clears events' cost/bucket, frees the name; refused otherwise. | ☑ | PASS |
| T-12 | AC-12 | db | Deactivating an event leaves its costs untouched; the cost's event foreign key is `on delete set null`. | ☑ | PASS |
| T-13 | AC-13 | db | A pending cost stays pending across unrelated later activity and is paid by a later top-up. | ☑ | PASS |
| T-14 | AC-14 | db | RLS enabled on all three tables; direct insert/update/delete refused; fund entries append-only; a cost can only go pending to paid; audit_log rows written. | ☑ | PASS |
| T-15 | AC-15 | db | Rows record the signed-in user and name snapshot and the note; the actor cannot be passed in. | ☑ | PASS |
| T-16 | AC-06 | unit | `formatMoney` shows cents only when the amount is not whole (unchanged for whole dollars). | ☑ | PASS |

Test titles start `[F0-12][AC-xx]`.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR (care_events, audit_log and tenancy tests must stay green: this feature adds columns to `care_events` and an AFTER INSERT trigger on `care_event_completions`).
- Run Playwright e2e tests against local Supabase only.

## Test data
- Each pgTAP file creates its own fixtures (two organisations, family, admin, carers, clients), as `care_events.test.sql` does. F0-16 seed data does not exist yet.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
