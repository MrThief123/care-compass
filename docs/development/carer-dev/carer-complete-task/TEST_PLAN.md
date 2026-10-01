# Test Plan — CAR-06 Carer — Mark tasks done

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/features/carer-patients/carer-complete-task.test.tsx` (Vitest + Testing Library; server contracts mocked, as in CAR-04)
- **integration** → `tests/integration/carer-complete-task.test.ts` (real local Supabase; skips against a hosted project)
- **e2e** → `tests/e2e/carer-complete-task.spec.ts` (Playwright, local Supabase)
- Family regression: the existing family-calendar, family-home, family-task-log and family-task-detail suites must stay green unchanged.

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Carer on shift ticks Physiotherapy in the patient's Calendar; the family's Calendar shows it done by the carer's full name. | ☑ | Carer half PASSES (tick persists after reload, no /family links); the last step opens the family Home, which cannot load real data until FAM-01 (FD-07). With that step on /calendar it passes. |
| T-02 | AC-02 | component | Off shift: tasks listed with status, no checkboxes, View only notice. | ☑ | PASSES |
| T-03 | AC-03 | component | Server rejects the tick: checkbox reverts, error shown. | ☑ | PASSES |
| T-04 | AC-04 | component | On shift: tick calls `setOccurrenceDone` with the occurrence key, untick calls `setOccurrenceUndone`; ticked at once. | ☑ | PASSES |
| T-05 | AC-05 | integration | `setOccurrenceDone` as a carer succeeds on shift and records the carer as actor; after the shift ends it is refused and nothing is recorded. | ☑ | PASSES already against local Supabase (the database side is F0-11); a guard, skips on a hosted project |
| T-06 | AC-06 | component | Calendar, Home and Care log render real data for the patient; every href starts with `/carer/patients/<id>/`, none with `/family/`. | ☑ | PASSES |
| T-07 | AC-07 | component | No Add event, Edit event or View breakdown link on any carer screen; no checkboxes on Home. | ☑ | PASSES |
| T-08 | AC-08 | component | Family screens keep `/family/<id>/` links, Add event and tick boxes (guards the additive base-path edit). | ☑ | PASSES (stayed green) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR (`--grep-invert "F0-07"`, local Supabase only).

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
