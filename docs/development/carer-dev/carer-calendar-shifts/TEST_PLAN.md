# Test Plan — CAR-05 Carer — Calendar (shifts)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Rewritten 2026-09-29 with the ACs (FD-01).

## Test levels used
- **integration** → `tests/integration/carer-calendar-shifts.test.ts` (Vitest against local Supabase; skips against a hosted project, as the other integration suites do)
- **contract** → `src/server/shifts/queries.test.ts` (node; mock mode, and Supabase mode with the client mocked)
- **component** → `src/features/carer-home/*.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Aisha signed in, `DATA_SOURCE=supabase`: today's range returns her Margaret Doyle shift, `clientName` 'Margaret Doyle'. | ☑ | NOT RUN (needs local Supabase) |
| T-02 | AC-02 | integration | Week range: in-range shifts only, earliest first; 23:30 last-day shift in, 00:30 next-day shift out. | ☑ | NOT RUN (needs local Supabase) |
| T-03 | AC-03 | integration | Daniel's shifts (same org and another org) never returned to Aisha. | ☑ | NOT RUN (needs local Supabase) |
| T-04 | AC-04 | integration | A cancelled shift is not returned. | ☑ | NOT RUN (needs local Supabase) |
| T-05 | AC-05 | integration | An ended shift, no other shift with the client, still returns with the full name. | ☑ | NOT RUN (needs local Supabase) |
| T-06 | AC-06 | integration | `get_carer_shifts` with Priya's id as Aisha, and as Helen (family), returns no rows; Aisha's own row holds only shift keys plus the two names. | ☑ | NOT RUN (needs local Supabase) |
| T-07 | AC-07 | component | Day, Week and Month render 'Margaret Doyle' and 'Margaret Chen' as separate blocks/chips; bare 'Margaret' is absent. | ☑ | FAIL (expected: view titles with `clientFirstName`) |
| T-08 | AC-08 | contract | Backwards and over-long ranges reject in `mock` and `supabase` mode; the Supabase client is never created. | ☑ | FAIL (supabase branch throws 'not implemented', not a range error) |
| T-09 | AC-09 | contract | With `rpc` returning an error naming 'Margaret Doyle', the thrown message contains no name. | ☑ | FAIL |
| T-10 | AC-10 | component + contract | Empty range: mock returns `[]`; Home shows 'No shifts' with D/W/M and arrows (existing CAR-UI-03 T-08, kept as regression). | ☑ | see FD-03 |

Existing tests changed by CHG-032 (FD-03, **HUMAN REVIEW: test expectation changed**): `src/server/shifts/queries.test.ts`, `src/features/carer-home/carer-home-calendar.test.tsx`, `src/features/carer-home/carer-home.test.tsx` now expect `clientName: 'Margaret Doyle'` and the full name in block titles.

## Regression scope
- Full unit/component suite; `supabase test db` (one new migration, no table); Playwright e2e for the dashboard with `--grep-invert "F0-07"`; CI is down, so run everything locally and say so in the PR.

## Test data
- Integration tests create their own organisations, users, clients and shifts and delete them after (F0-16 seed does not exist yet). Component and contract tests use `src/mocks/fixtures.ts` plus small local fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
