# Test Plan — UI-02 Forms kit: fields, settings cards, side panels, chips, modal, event form

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given a required Date field left empty, when the form is submitted, then 'Date' shows an inline error and onSubmit is not called. | ☑ | PASS |
| T-02 | AC-02 | component | Given the destructive ConfirmationModal is open, when Escape is pressed, then onCancel is called and focus returns to the trigger. | ☑ | PASS |
| T-03 | AC-03 | component | Given time slot ChipGroup, when 'Custom' is selected, then start and end time inputs appear. | ☑ | PASS |
| T-04 | AC-04 | component | Given Custom start 12:00 and end 10:00, when validated, then an end-time error is shown. | ☑ | PASS |
| T-05 | AC-05 | component | Given EventForm with fixture 'Physiotherapy', when rendered, then Date shows 'Monday 30 November 2026', Recurring 'Weekly', Planned chip selected, and a 'Pick a date' calendar. | ☑ | PASS |
| T-06 | AC-06 | component | Given each form component, when checked with axe, then there are no violations. | ☑ | PASS |

## Regression scope
- `npm run verify` (lint + typecheck + format check + full unit/component suite) — green: 293 passed, 1 skipped (pre-existing), 0 failed.
- No `supabase test db` and no Playwright: UI-02 touches no schema and has no e2e AC. See DECISIONS.md FD-06 and `docs/AGENT_REFERENCE.md` "Relevant suite before a PR".

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
