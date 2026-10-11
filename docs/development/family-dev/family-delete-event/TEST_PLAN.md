# Test Plan — FAM-18 Family — Delete event and recurrence end date

## Approach
Tests first (TESTING.md §2). Titles start `[FAM-18][AC-xx]`. Run, confirm they fail for the right reason, then implement.

## Test cases

| Test ID | Covers | Level | Description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01, AC-08, AC-16 | component | Task detail shows 'Delete event' only when `canEdit` and the occurrence is not Done; absent for Admin read-only. | ☐ | — |
| T-02 | AC-02 | component | One-off: confirm dialog, `deleteEventOccurrence` called, return to origin. | ☐ | — |
| T-03 | AC-03, AC-07 | component | Recurring dialog options and default; Cancel and Esc do nothing. | ☐ | — |
| T-04 | AC-04, AC-05, AC-06 | unit (mock) + integration | Mock `deleteEventOccurrence`: occurrence cancel, future cap (day before, Melbourne), first-occurrence removes series, completions kept. | ☐ | — |
| T-05 | AC-08, AC-09, AC-10 | integration (Supabase) | RLS: family and on-shift carer delete; off-shift carer, other family, Admin refused; Done refused. | ☐ | — |
| T-06 | AC-11 | component | Failure message, dialog stays open. | ☐ | — |
| T-07 | AC-12, AC-14 | component | 'Ends' visibility by Recurring value; end before date error. | ☐ | — |
| T-08 | AC-13, AC-15 | unit + integration | `endDate` -> `recurrence_until`, inclusive; Edit prefill, change and clear; reset when set to Does not repeat. | ☐ | — |
| T-09 | AC-17 | component | axe, 44px, accessible name, focus trap. | ☐ | — |

## Regression scope
FAM-06, FAM-07, FAM-15, CAR-07 suites; recurrence engine tests; Calendar and Log suites; shared forms kit tests. Suite per CLAUDE.md §5 and `docs/AGENT_REFERENCE.md`: Vitest full, typecheck, lint, format, `supabase test db`, the new integration file, build, Family and Carer e2e.
