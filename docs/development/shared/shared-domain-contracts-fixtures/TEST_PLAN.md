# Test Plan — UI-00 Domain types, data-access contracts and design fixtures

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **ci** → CI workflow run / scripted check
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Given `displayName('Aisha Rahman')`, when called, then it returns 'Aisha Rahman' (full name, per FD-01/PD-038). | ☑ | PASS |
| T-02 | AC-02 | unit | Given `formatDuration(90)` and `formatDuration(60)`, when called, then they return '1 hr 30 min' and '1 hr'. | ☑ | PASS |
| T-03 | AC-03 | unit | Given `formatLongDate` for 2026-11-30, when called, then it returns 'Monday 30 November 2026'. | ☑ | PASS |
| T-04 | AC-04 | integration | Given DATA_SOURCE=mock, when `getBudgetSummary(<Margaret>)` is called, then NDIS remaining 14880 / total 24000 / 38%, Fixed 2750 / 5000 / 45%, Government 240 / 3000 / 92% are returned. | ☑ | PASS |
| T-05 | AC-05 | unit | Given NODE_ENV=production, when the mock current-user module is used, then it throws. | ☑ | PASS |
| T-06 | AC-06 | ci | Given a file under `src/app` or `src/features` imports from `src/mocks`, when lint runs, then lint fails (restricted import). | ☑ | PASS |

All six confirmed FAILING for the expected reason before implementation (see PROGRESS.md), then PASSING after implementation. Full run: `npx vitest run` — 54/54 passing (13 test files, including all pre-existing F0-05 tests — no regressions).

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR. **UI-00 note:** no Supabase project/schema exists yet (Out of Scope — F0-06 onward), so `supabase test db` does not apply to this feature; `npx vitest run` (54/54 passing) is the applicable regression run.
- Run Playwright e2e tests for this dashboard before opening the PR. **UI-00 note:** UI-00 builds no screens (Out of Scope), so there is no Playwright spec to run for this feature; `tests/e2e/smoke.spec.ts` is unaffected by this change.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
