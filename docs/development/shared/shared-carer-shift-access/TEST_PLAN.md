# Test Plan — F0-18 Carer view access derived from shifts

## Approach
Tests are written **before** production code (TESTING.md §2). pgTAP in `supabase/tests/`, run with `supabase test db`. Time is controlled by placing shifts relative to `now()` (e.g. a shift starting in one hour stands in for "08:00 before a 09:00 shift").

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Shift starting in the future: carer selects the client (1 row); `carer_on_active_shift` false; an event insert is rejected. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Shift in progress: carer reads the client and can insert an event. | ☐ | NOT RUN |
| T-03 | AC-03 | db | Ended shift plus a later shift: carer reads the client; edit rejected. | ☐ | NOT RUN |
| T-04 | AC-04 | db | Ended shift, no later shift: carer selects 0 client rows and 0 event rows. | ☐ | NOT RUN |
| T-05 | AC-05 | db | Shift created weeks ahead: read access immediately. | ☐ | NOT RUN |
| T-06 | AC-06 | db | Cancelled shift only → no read; deactivated carer with a live shift → no read. | ☐ | NOT RUN |
| T-07 | AC-07 | db | Shift with client A only → 0 rows for client B. | ☐ | NOT RUN |
| T-08 | AC-08 | db | After `transfer_client_organisation`, the old carer selects 0 rows for the client. | ☐ | NOT RUN |
| T-09 | AC-09 | db | `to_regclass('public.carer_client_assignments')` is null. | ☐ | NOT RUN |

## Regression scope
- Full `supabase test db`, unit suite, typecheck (regenerated types).
