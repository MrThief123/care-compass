# Test Plan — INT-09 Overdue and upcoming care alert emails

## Approach
Provisional until OQ-40 is answered. Tests first; titles start `[INT-09][AC-xx]`. Local Supabase only; email provider stubbed (as INT-01).

## Test levels used
- **pgTAP** → tracking table is deny-all RLS, unique per occurrence and trigger
- **unit** → selection and idempotency logic, route secret check
- **integration** → local Supabase, stubbed provider

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Overdue task emails the decided recipients once. | Yes | — |
| T-02 | AC-02 | integration | Second run sends nothing. | Yes | — |
| T-03 | AC-03 | unit | Completed, cancelled and plain events are never selected. | Yes | — |
| T-04 | AC-04 | integration | Provider failure records nothing; next run retries. | Yes | — |
| T-05 | AC-05 | unit | Missing or wrong secret → 401, no send. | Yes | — |
| T-06 | — | pgTAP | Tracking table RLS and uniqueness. | Yes | — |
