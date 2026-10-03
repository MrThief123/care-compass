# Test Plan — INT-09 Overdue and upcoming care alert emails

## Approach
Tests first; titles start `[INT-09][AC-xx]`. Local Supabase only; email provider stubbed (as INT-01 and INT-11). The selection logic is a pure function so every time rule is tested without a database or a clock.

## Test levels used
- **pgTAP** → tracking table is deny-all RLS, one row per occurrence
- **unit** → pure selection (30-minute rule, 48-hour window, task-only, done and cancelled), email wording, route secret check, cron entry
- **integration** → local Supabase, stubbed provider: recipients, once-only, failure retry, per-run cap

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | An overdue task emails Family and current org admins once each; no carer; one tracking row. | Yes | PASS (integration) |
| T-02 | AC-02 | integration | A second run sends nothing; an overridden occurrence is the same one. | Yes | PASS (integration, incl. overlapping runs and a moved occurrence) |
| T-03 | AC-03 | unit | Done, cancelled, plain-event, under 30 minutes and over 48 hours are never selected; exactly 30 minutes is. | Yes | PASS (unit) and integration |
| T-04 | AC-04 | integration | A provider failure for one recipient records nothing; the next run sends. | Yes | PASS (integration) |
| T-05 | AC-05 | unit | Missing or wrong secret (GET bearer and POST header) → 401, job not run. | Yes | PASS (unit) |
| T-06 | AC-02 | pgTAP | Tracking table RLS deny-all, no grants, unique per event and original start. | Yes | PASS (pgTAP) |
| T-07 | AC-06 | integration | No recipients, inactive or email-less profile, and a transferred client behave as stated. | Yes | PASS (integration, incl. transferred client and no-PII result/logs) |
| T-08 | AC-07 | integration + unit | 101 due occurrences → 100 sent; the rest next run; `vercel.json` has the daily entry. | Yes | PASS (integration with maxAlerts=2; unit for the 100 constant and cron entry) |
| T-09 | AC-08 | unit | Subject and body text; Melbourne time across DST; no reminder wording. | Yes | PASS (unit) |

## Regression
`vitest run`, `supabase test db`, the INT-01 and INT-11 job tests.
