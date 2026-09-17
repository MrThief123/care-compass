# Test Plan — CAR-UI-02 Carer Patients and patient info screens (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Patients renders, then 7 cards appear including 'Margaret' '78 years · Preston VIC' and 'Jean' '88 years · Fairfield VIC'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given no patients, when rendered, then 'No patients assigned yet' is shown. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given a card for Margaret, when clicked, then the patient info page for Margaret opens. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given fixture onShift=false, when patient info renders, then no Edit links exist. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
