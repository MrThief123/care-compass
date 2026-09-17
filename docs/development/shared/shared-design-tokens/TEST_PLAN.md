# Test Plan — F0-05 Design tokens, typography and base styles

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Given the token file, when the token test compares values with the Figma fixture, then every colour token hex matches exactly. | ☑ | PASS |
| T-02 | AC-02 | unit | Given the approved text/background pairs list, when contrast ratios are computed, then every body-text pair is at least 4.5:1. | ☑ | PASS |
| T-03 | AC-03 | unit | Given the pairs list, when it is checked, then it contains no pair of text/on-dark on bg/brand (#0C9BA9). | ☑ | PASS |
| T-04 | AC-04 | component | Given any Button rendered, when it receives keyboard focus, then a visible focus ring style is applied. | ☑ | PASS |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
