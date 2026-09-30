# Test Plan — F0-22 Client header wiring and family route guard

## Approach
Tests first (TESTING.md §2); confirm they fail for the expected reason.

## Test levels used
- **unit** → Vitest with a stubbed Supabase client (`src/server/clients/header-summary.test.ts`: 14 tests, T-01 and T-02)
- **component/route** → Vitest render of the layout (`layout.test.tsx` for ordering and redirects with contracts faked; `layout.mock.test.tsx` for mock mode)
- **integration** → local Supabase, `describe.skipIf(!hasLocalSupabase)` (`tests/integration/shared-client-header-wiring.test.ts`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01, AC-02, AC-03, AC-04 | unit | Row mapping: names, Melbourne age (birthday edge), omitted suburb/org/dob, malformed id throws, DB error throws a PII-free message, organisation RPC failure degrades. | ☑ | FAIL (expected): Supabase branch is `notImplementedForSupabase` |
| T-02 | AC-05, AC-07 | unit | `assertClientAccess` redirects to `getLandingPath()` when no row is readable; returns when one is; no-op under mock. | ☑ | FAIL (expected): `assertClientAccess` does not exist |
| T-03 | AC-06, AC-05, AC-07, AC-01, AC-02 | component | Layout calls `getCurrentUser("family")`, then `assertClientAccess`, then the summary, in that order; a redirect from either check stops the later calls; header line with and without age/suburb/organisation. | ☑ | FAIL (expected): layout still uses `Promise.all`, no `assertClientAccess` call |
| T-04 | AC-08 | component | Mock mode (real mock contract): the layout renders Margaret's header and the page without redirecting. | ☑ | PASS already (mock-mode regression guard, must stay green); redirect-stops-summary half is in T-03 |
| T-05 | AC-01–AC-05, AC-07 | integration | Real users (Helen, Rosa) and clients (Margaret, Robert): Helen reads Margaret's header with organisation; Helen on Robert is redirected; a family user with no client goes to `/no-client-linked`. | ☑ | FAIL (expected), ran against local Supabase |

## Regression scope
`src/server/clients`, `src/app/(family)`, `src/features/family-settings`, `src/features/family-info`, full unit suite, typecheck, lint.

## Test data
Synthetic users only, as `tests/integration/family-home-overdue-activity.test.ts` creates.

## Coverage mapping rule
Every AC has at least one test.
