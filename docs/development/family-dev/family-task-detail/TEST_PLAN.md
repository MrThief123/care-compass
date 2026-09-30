# Test Plan — FAM-15 Family — Task detail

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Most of the screen is built (FAM-UI-07), so tests for AC-01, AC-02 (component), AC-03, AC-04 and AC-08 may pass on first run; that is recorded honestly in PROGRESS.md. AC-05, AC-06 and AC-07 are new behaviour and must fail first.

## Test levels used
- **component / page** → `src/**/*.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/family-task-detail.spec.ts` (Playwright, mock data source, built app)
- **integration** → `tests/integration/family-task-detail.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | page | Route page for Morning medication renders 'Done · Aisha Rahman' and 'Completed at 09:14'. | ☑ | PASS (already built) |
| T-02 | AC-01 | integration | A completion by Aisha through `set_occurrence_done` reads back done, actor 'Aisha Rahman', with a completion time. | ☑ | PASS (already built) |
| T-03 | AC-02 | component | Subline reads 'Monday 30 November 2026 · Assigned to Aisha Rahman'. | ☑ | PASS (already built) |
| T-04 | AC-02 | integration | Assignee comes from the covering shift; the actor replaces it once Done by someone else; '—' (no assignee) with no shift. | ☑ | PASS (already built) |
| T-05 | AC-03 | e2e | Overdue card chevron on 'Weekly weigh-in' opens its detail: Overdue pill, 'Assigned to —'. | ☑ | PASS (already built) |
| T-06 | AC-04 | integration | Robert's key under Margaret's client, and an unknown key, return nothing (not found). | ☑ | PASS (already built) |
| T-07 | AC-05 | component | A plain event shows 'Event · No tick-off needed', no pill, no 'Completed at', Edit event still present. | ☑ | PASS (after implementation) |
| T-08 | AC-05 | page | The route resolves a plain event key (reads with `type: "all"`), shows it, and a Robert plain event under Margaret is not found. | ☑ | PASS (after implementation) |
| T-09 | AC-06 | integration | A plain event (automatic mode) opens for its own client with kind 'event'; another client's family gets nothing. | ☑ | PASS (contract already reads plain events) |
| T-10 | AC-07 | integration | An occurrence completed then cancelled (override) still returns, status done, actor kept. | ☑ | PASS (after implementation) |
| T-11 | AC-08 | e2e | Recent activity row, Log panel row and Task log row each open a Task detail and Back returns to the origin. | ☑ | PASS (already built) |

## Results after implementation (2026-09-30)
- `.fam15` Vitest files, `src/server/events`, `family-task-detail`, `family-task-log`: 20 files, 453 tests pass.
- Full Vitest run: 2088 pass; failures only in `shared-authentication`, `shared-supabase-environment`, `mocks-import-boundary` (need the F0-07 stack or the lint subprocess; they fail identically on `main` state before this change; two runs under load also showed timeouts in unrelated files that pass when run alone).
- Integration against local Supabase: `family-*` (12 files, 59 tests) and `care-events` pass, including T-02, T-04, T-06, T-09, T-10.
- `supabase test db` PASS · `tsc` clean · `prettier` clean · `eslint` 0 errors (3 pre-existing warnings in other files) · `npm run build` OK.
- Playwright `--grep-invert "F0-07"`: 46 passed, 2 skipped (T-05, T-11 pass).
- Real-browser width sweep (Playwright Chromium) at 1920, 1440, 1024, 768: no overlap, no horizontal scroll for a plain event, a Done task and an Overdue task.

## Regression scope
- Full Vitest suite, `supabase test db`, and the Family e2e specs (`--grep-invert "F0-07"`, CI is down: run locally and say so in the PR).

## Test data
- Mock data source: Margaret and Robert fixtures (`src/mocks/fixtures.ts`).
- Integration: each test seeds its own organisation, users, client and events (pattern of `tests/integration/care-events.test.ts`); needs the local Supabase stack.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
