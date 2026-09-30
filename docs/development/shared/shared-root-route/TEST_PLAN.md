# Test Plan — F0-19 Root route and production guard for dev previews

## Approach
Tests first (TESTING.md §2); confirm they fail for the expected reason.

## Test levels used
- **unit** → `src/proxy.test.ts` / route tests (Vitest, `NODE_ENV` stubbed)
- **e2e** → `tests/e2e/` (Playwright, mock build; `--grep-invert "F0-07"` on the hosted project)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Signed-out request to `/` redirects to `/sign-in`. | ☑ | PASS |
| T-02 | AC-02, AC-05 | unit | Signed-in admin, carer, family (with and without a client) resolve to their home via `resolveRoleHomePath`; admin below AAL2 goes to MFA. | ☑ | PASS |
| T-03 | AC-03 | unit | With `NODE_ENV=production`, `/dev-preview` and each `/dev-preview-*` route return 404. | ☑ | PASS |
| T-04 | AC-04 | unit (render, FD-02) | In dev/mock, `/dev-preview` renders the showcase and its tabs navigate. | ☑ | PASS |
| T-05 | AC-06 | e2e | A production build serves `/` as a redirect and `/dev-preview` as 404. Existing specs updated. | ☑ | PASS |

## Regression scope
Full unit suite, typecheck, lint, e2e with `--grep-invert "F0-07"`.

## Test data
Synthetic users only, as F0-07's tests create.

## Coverage mapping rule
Every AC has at least one test.
