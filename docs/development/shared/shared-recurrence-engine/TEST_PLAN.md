# Test Plan — F0-09 Recurrence engine (pure TypeScript)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Given a weekly rule anchored Monday 30 Nov 2026 09:00, when expanded for 30 Nov–13 Dec 2026, then exactly two occurrences are returned: 30 Nov 09:00 and 7 Dec 09:00. | ☐ | NOT RUN |
| T-02 | AC-02 | unit | Given a yearly rule anchored 30 Nov 2026, when expanded for the year 2066, then one occurrence on 30 Nov 2066 is returned. | ☐ | NOT RUN |
| T-03 | AC-03 | unit | Given a monthly rule anchored 31 Jan 2027, when expanded for February 2027, then one occurrence on 28 Feb 2027 is returned (PROPOSED clamp rule). | ☐ | NOT RUN |
| T-04 | AC-04 | unit | Given a daily 09:00 rule, when expanded across the April 2027 DST change in Australia/Melbourne, then every occurrence is at 09:00 local time. | ☐ | NOT RUN |
| T-05 | AC-05 | unit | Given a weekly rule and a cancellation override for 7 Dec 2026, when expanded for 30 Nov–20 Dec, then 30 Nov and 14 Dec are returned and 7 Dec is not. | ☐ | NOT RUN |
| T-06 | AC-06 | unit | Given a modification override moving 7 Dec 09:00 to 8 Dec 10:00, when expanded, then the occurrence appears on 8 Dec 10:00 with originalStart 7 Dec 09:00. | ☐ | NOT RUN |
| T-07 | AC-07 | unit | Given a rule with interval 0, when validated, then validation fails with an interval error. | ☐ | NOT RUN |
| T-08 | AC-08 | unit | Given 500 weekly rules, when expanded over a 6-week range, then expansion completes in under 100 ms. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
