# Test Plan — CAR-03 Carer — Patients

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Rewritten 2026-09-29 with the ACs (FD-01).

## Test levels used
- **integration** → `tests/integration/carer-patients.test.ts` (Vitest against local Supabase; skips against a hosted project, as the other integration suites do)
- **contract** → `src/server/shifts/queries.test.ts` (node, mock mode)
- **component** → `src/features/carer-patients/*.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Aisha signed in, `DATA_SOURCE=supabase`: seven patients, soonest shift first, with full name, age and suburb. | ☑ | FAIL (expected: Supabase branch not implemented). Seeding works. |
| T-02 | AC-02 | integration | 'Els' returns only Elsie Marsh; ' MARSH ' finds her by last name; 'zzz' returns none. | ☑ | FAIL (expected: Supabase branch not implemented) |
| T-03 | AC-03 | component | No patients and no `q`: 'No patients assigned yet', no search box (CAR-UI-02 AC-02 and `carer-patients-search.test.tsx`). | ☑ | PASS already: built by CAR-UI-02, kept as regression |
| T-04 | AC-04 | integration | Walter (same organisation, Daniel's) and Olive (other organisation) never reach Aisha, with or without a search naming them; Daniel sees only Walter. | ☑ | FAIL (expected: Supabase branch not implemented) |
| T-05 | AC-05 | integration | Ended and cancelled shifts give no patient; future shift present and not on shift; only Margaret on shift; two shifts, one card, ordered by the soonest. | ☑ | FAIL (expected: Supabase branch not implemented) |
| T-06 | AC-06 | component | A search with no match: no cards, 'No matches for "zz".', search box kept. | ☑ | FAIL (expected: the view hides the search box when the list is empty) |
| T-07 | AC-07 | component | Contract rejects with a message naming 'Margaret Doyle': error state, log holds no name (CAR-UI-02 error test, kept). | ☑ | PASS already: built by CAR-UI-02, kept as regression |
| T-08 | AC-08 | component | `?q=` reaches the contract cleaned (blank, padded, repeated); the box opens holding `q`; typing pauses then `router.replace('/carer/patients?q=Els')`; Enter is immediate; clear drops `q`. | ☑ | FAIL (expected: page ignores `searchParams`, view filters locally) |
| T-09 | AC-01 | component + contract | Cards show the full name and '78 years · Preston VIC'; contract rows carry `name`. | ☑ | FAIL (expected: rows have no `name`; cards show the first name) |
| T-10 | AC-02 | contract | Mock `getCarerPatients('staff-aisha','Els')`: only Elsie Marsh; last-name and padding; blank returns 7; a search never widens the carer's list. | ☑ | FAIL (expected: query argument ignored); the 'never widens' case PASSES already as a regression guard |

Existing tests changed before implementation (FD-03, **HUMAN REVIEW: test expectation changed**): three CAR-UI-02 local-filter tests in `carer-patients.test.tsx` (AC-06: 'je', 'MARG', 'zz') removed and replaced by T-06/T-08 (search is now the URL's `?q=`); the AC-01 test now expects `getCarerPatients(CARER_ID, "")` and full names; the long-name test sets `name`.

## Regression scope
- Full unit/component suite; `supabase test db` (no migration, so unchanged); Playwright e2e for the dashboard with `--grep-invert "F0-07"`; CI is down, so run everything locally and say so in the PR.
- Integration run needs local Supabase env overrides (`supabase status -o env`); `.env.local` is the hosted project.

## Test data
- Integration tests create their own organisations, users, clients and shifts, all relative to now, and delete them after (F0-16 seed does not exist yet). Component and contract tests use `src/mocks/fixtures.ts` plus small local fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
