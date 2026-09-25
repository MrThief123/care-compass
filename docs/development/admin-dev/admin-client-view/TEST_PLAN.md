# Test Plan — ADM-11 Admin — Client view

## Approach
Tests are written before production code (TESTING.md §2). Run them and confirm they fail for the expected reason before implementing.

## Test levels used
- **component** → `src/**/<component>.test.tsx`
- **integration** → `tests/integration/<feature>.test.ts`
- **db** → `supabase/tests/<feature>.test.sql`
- **e2e** → `tests/e2e/<feature>.spec.ts`

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Clicking a client name opens its Family Home in the admin layout with the client bar and Back link | ☐ | NOT RUN |
| T-02 | AC-02 | e2e | Moving between the five client screens shows the same client's data | ☐ | NOT RUN |
| T-03 | AC-03 | integration | An admin top-up saves and History names the admin | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Admin edits client info, adds a costed event, marks a task done; each names the admin | ☐ | NOT RUN |
| T-05 | AC-05 | db + e2e | Another organisation's admin gets not-found and RLS refuses reads and writes | ☐ | NOT RUN |

Test titles must start with `[ADM-11][AC-xx]`.

## Regression scope
- Family e2e suite (the screens it reuses must behave the same under `/family`); admin suite; pgTAP RLS tests.

## Test data
- Seed: two organisations, each with an admin and a client; the first client has budget entries and events.
