# Test Plan — F0-18 Carer view access derived from shifts

## Approach
Tests are written **before** production code (TESTING.md §2). pgTAP in `supabase/tests/`, run with `supabase test db`. Time is controlled by placing shifts relative to `now()` (e.g. a shift starting in one hour stands in for "08:00 before a 09:00 shift").

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Shift starting in the future: carer selects the client (1 row); `carer_on_active_shift` false; an event insert is rejected. | ☑ | PASS |
| T-02 | AC-02 | db | Shift in progress: carer reads the client and can insert an event. | ☑ | PASS |
| T-03 | AC-03 | db | Ended shift plus a later shift: carer reads the client; edit rejected. | ☑ | PASS |
| T-04 | AC-04 | db | Ended shift, no later shift: carer selects 0 client rows and 0 event rows. | ☑ | PASS |
| T-05 | AC-05 | db | Shift created weeks ahead: read access immediately. | ☑ | PASS |
| T-06 | AC-06 | db | Cancelled shift only → no read; deactivated carer with a live shift → no read. | ☑ | PASS |
| T-07 | AC-07 | db | Shift with client A only → 0 rows for client B. | ☑ | PASS |
| T-08 | AC-08 | db | After `transfer_client_organisation`, the old carer selects 0 rows for the client. | ☑ | PASS |
| T-09 | AC-09 | db | `to_regclass('public.carer_client_assignments')` is null. | ☑ | PASS |

## Files updated beyond the three named above
The PRD named `tenancy_rls`, `care_events` and `transfer_client_organisation` as the pgTAP
files to update. Two more turned up once the migration actually ran:
- `supabase/tests/documents.test.sql` (F0-13, merged the day before this feature started) —
  its own `carer_client_assignments` seed row, replaced with an equivalent shift.
- `tests/integration/family-change-organisation.test.ts` (FAM-13) — a **Vitest** integration
  test, not pgTAP, so outside the PRD's search. It seeded and later re-queried
  `carer_client_assignments` directly; the "history kept" assertion on the ended assignment
  row became a direct `is_assigned_carer` RPC check (Aisha's read access to the client is
  now false, since her future shifts were cancelled by the transfer) plus a check that a
  cancelled shift still names its original organisation.

None of the four rewrites removed test coverage — each retired assertion has a same-intent
replacement using shifts/`is_assigned_carer` instead of the retired table. Each is recorded
in DECISIONS.md.

## Regression scope
- Full `supabase test db`, unit suite, typecheck (regenerated types).
