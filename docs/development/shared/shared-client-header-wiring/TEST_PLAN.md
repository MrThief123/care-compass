# Test Plan — F0-20 Client header wiring and family route guard

## Approach
Tests first (TESTING.md §2); confirm they fail for the expected reason.

## Test levels used
- **unit** → Vitest with a stubbed Supabase client (`src/server/clients/header-summary.test.ts`)
- **component/route** → Vitest render of the layout (`src/app/(family)/family/[clientId]/layout.test.tsx`)
- **integration** → local Supabase, `describe.skipIf(!hasLocalSupabase)` (`tests/integration/shared-client-header-wiring.test.ts`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01, AC-02, AC-03, AC-04 | unit | Row mapping: names, Melbourne age (birthday edge), omitted suburb/org/dob, malformed id throws, DB error throws a PII-free message, organisation RPC failure degrades. | ☐ | |
| T-02 | AC-05, AC-07 | unit | `assertClientAccess` redirects to `getLandingPath()` when no row is readable; returns when one is; no-op under mock. | ☐ | |
| T-03 | AC-06 | component | Layout calls `getCurrentUser("family")` before `assertClientAccess` and the summary; a redirect from the first stops the others (never called). | ☐ | |
| T-04 | AC-08, AC-05 | component | Mock mode renders the header; a redirect from `assertClientAccess` stops the summary call. | ☐ | |
| T-05 | AC-01–AC-05, AC-07 | integration | Real users (Helen, Rosa) and clients (Margaret, Robert): Helen reads Margaret's header with organisation; Helen on Robert is redirected; a family user with no client goes to `/no-client-linked`. | ☐ | |

## Regression scope
`src/server/clients`, `src/app/(family)`, `src/features/family-settings`, `src/features/family-info`, full unit suite, typecheck, lint.

## Test data
Synthetic users only, as `tests/integration/family-home-overdue-activity.test.ts` creates.

## Coverage mapping rule
Every AC has at least one test.
