# Test Plan — ADM-06 Admin — Manage: staff and client selection

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit** → `src/**/*.test.ts` (Vitest)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Aisha Rahman and Margaret are selected, when rendered, then both rows are solid-filled with checks and the summary reads 'Aisha Rahman → Margaret Doyle'. | ☑ | PASS (regression guard: existing UI-02 screen already satisfies it) |
| T-02 | AC-02 | component | Given a selection, when Clear is clicked, then both selections are removed. | ☑ | FAIL (expected: no router/URL selection yet) |
| T-03 | AC-03 | integration | Given search 'Sar' in Staff, when submitted, then only Sarah Nguyen is listed. | ☑ | FAIL (expected: Supabase branch not implemented) |
| T-04 | AC-04 | integration | Given another organisation's staff and clients, when the columns load, then they are absent. | ☑ | FAIL (expected: Supabase branch not implemented) |
| T-05 | AC-05 | component | URL selection renders the two rows selected; clicking another row updates only that param via the router. | ☑ | FAIL (expected: no `selection` prop) |
| T-06 | AC-03 | component | Typing in a search box and pressing Enter puts `staffQ` / `clientQ` in the URL, keeping the selection. | ☑ | FAIL (expected: search not URL/server-driven) |
| T-07 | AC-03 | unit | Mock data source: `getAdminManage({ staffSearch: 'Sar' })` lists only Sarah Nguyen; client search filters clients. | ☑ | FAIL 3 of 4 (expected: no search params); blank-search case passes |
| T-08 | AC-06 | integration | A deactivated carer in the admin's own organisation is absent from the Staff column. | ☑ | FAIL (expected: Supabase branch not implemented) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Integration tests create their own two-organisation fixtures (pattern: `tests/integration/admin-staff.test.ts`); they run only against local Supabase (`.env.local` is the hosted project, so override the env; see the implementation prompt).
- Component/unit tests use inline data. Component tests mock `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
