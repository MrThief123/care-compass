# Test Plan — FAM-08 Family — Event documents (file tiles)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given the Edit event form, when Helen adds 'Physio referral.pdf' and saves, then a tile 'Physio referral.pdf' appears on the event. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given a disallowed file type, when selected, then an inline error is shown and no tile is added. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given an existing tile, when clicked, then the document opens via a signed URL. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
