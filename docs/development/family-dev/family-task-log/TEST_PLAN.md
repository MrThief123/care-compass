# Test Plan — FAM-14 Family — Task log

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given the real mock `getTaskLog` contract, when the task log is loaded with no filters, then Mon 30 Nov's rows include Morning medication (Done · Aisha Rahman), Physiotherapy (Planned) and Afternoon check-in (Planned) with the right nurse/status. | ☑ | PASS |
| T-02 | AC-02 | component | Given status filter Overdue, when applied, then only Weekly weigh-in (Sun 29 Nov) and Medication review (Sat 28 Nov) are listed, each with nurse '—'. | ☑ | PASS |
| T-03 | AC-03 | component | Given search 'Zoe', when results are empty, then 'No matches for "Zoe".' is displayed. | ☑ | PASS |
| T-04 | AC-04 | component | Given a row, when clicked/its link followed, then it goes to that occurrence's Task detail. | ☑ | PASS |
| T-05 | AC-05 | integration | Given weekly recurring events extending forever, when the log loads, then no occurrence after today is returned. | ☑ | PASS |

Level adaptations from the original plan (recorded per TESTING.md §6 as a level change, not a behaviour change — the underlying route, loader and `getTaskLog` Supabase wiring were already built and integration-tested by FAM-UI-07 and FAM-02):
- T-01/T-02: integration → component. FAM-02 already added an integration suite exercising `getTaskLog`'s Supabase branch directly (status, actor, RLS); duplicating that here for the same contract function would be redundant. T-01/T-02 instead confirm the Task log *screen* renders that contract's result correctly, against the real (non-Supabase) mock contract FAM-UI-07 already integration-proved at the route level.
- T-04: e2e → component. `task-log-view.test.tsx`'s existing `[FAM-UI-07][AC-08]` coverage already click-tests row navigation; a FAM-14-labelled component test over the same mechanism is equivalent proof without a second browser-level suite for identical DOM behaviour. `family-task-detail-nav.spec.ts`'s e2e suite (`[FAM-UI-07][AC-10]`) still covers the full click-through end to end.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
