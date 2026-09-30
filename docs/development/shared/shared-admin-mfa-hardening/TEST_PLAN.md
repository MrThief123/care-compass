# Test Plan — <FEATURE-ID> <Feature name>

## Approach
Tests are written before production code (TESTING.md §2). Run them and confirm they fail for the expected reason before implementing.

## Test levels used
- **unit** → `src/**/<module>.test.ts`
- **component** → `src/**/<component>.test.tsx`
- **integration** → `tests/integration/<feature>.test.ts`
- **db** → `supabase/tests/<feature>.test.sql`
- **e2e** → `tests/e2e/<feature>.spec.ts`

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | <level> | <description> | ☐ | NOT RUN |

Test titles must start with `[<FEATURE-ID>][AC-xx]`.

## Regression scope
- <Suites to run before READY FOR PR.>

## Test data
- <Seed entities or fixtures.>
