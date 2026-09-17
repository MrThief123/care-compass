# Test Plan — ADM-07 Admin — Assign shift

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Aisha and Margaret selected, date 1 Dec 2026 and slot 07:00–11:00, when Assign shift is clicked, then a shift 07:00–11:00 on 1 Dec exists and a dot appears on 1 Dec. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given an overlapping existing shift 11:30–13:00 and selected slot 11:00–15:00, when the slot is chosen, then the warning names 11:30–13:00 and Assign shift remains available. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given Custom with end 10:00 before start 12:00, when Assign is pressed, then a time error is shown. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given the panel, when rendered, then no Repeat control exists. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
