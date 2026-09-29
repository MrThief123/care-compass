# Test Plan — ADM-04 Admin — Clients list and add client

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

**Rewritten by CHG-035 (2026-09-29)** alongside ACCEPTANCE_CRITERIA.md's rewrite — the old T-01/T-02
tested the rejected Add-client flow.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given seed data, when `getAdminClients()` loads for Priya, then rows include Margaret with family contact Helen, real names from `clients`/`client_family_members`/`profiles`. | ☐ | NOT RUN |
| T-01b | AC-01 | component | Given client/contact pairs, when the list renders, then each row shows its name and family contact (already covered by ADM-UI-04's own test, kept unchanged). | ☑ (ADM-UI-04) | PASS — `clients-screen.test.tsx` |
| T-02 | AC-02 | integration | Given another organisation's clients, when Priya's `getAdminClients()` loads, then none of them are included (RLS). | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given an organisation with no clients, when `getAdminClients()` loads, then it returns `[]`. | ☐ | NOT RUN |
| T-03b | AC-03 | component | Given no clients, when the list renders, then 'No clients yet' is shown (already covered by ADM-UI-04's own test). | ☑ (ADM-UI-04) | PASS — `clients-screen.test.tsx` |
| T-04 | AC-04 | component | Given the Clients screen, when rendered, then no 'Add client' button, panel or form field exists. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- F0-16 is not yet merged, so the integration test seeds its own fixtures, following
  `tests/integration/family-home-budget-strip.test.ts`'s pattern.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
