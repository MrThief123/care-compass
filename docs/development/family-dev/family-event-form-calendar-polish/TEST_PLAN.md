# Test Plan — FAM-16 Family — Event form and calendar polish

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **unit** → `src/features/family-task-log/late-completion.test.ts`, `src/features/family-event-form/event-details.test.ts`
- **component** → task detail, Log table, `DatePickerGrid`, `EventForm`, `EventDetailsFields`, `EventFormScreen`, carer events (Vitest + Testing Library)
- No integration or e2e change: the contract and database are untouched. Existing integration (`family-add-event`, `family-edit-event`, `carer-manage-events`) is re-run as regression.
- Run with `DATA_SOURCE=mock` (`.env.local` sets `supabase`, which breaks mock-based unit tests; see DECISIONS FD-01).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-04 | unit | `lateCompletionNote` wording and boundaries (days/hours, hours/minutes, minutes, singular, zero parts, under a minute) | ☑ | PASSES: `late-completion.test.ts`. |
| T-02 | AC-01, AC-02 | component | Task detail shows the note for a late Done task; none for on-time, planned, overdue, plain | ☑ | PASSES: `late-completion.views.test.tsx`. |
| T-03 | AC-03, AC-02 | component | Log row shows the note for a late Done row, none for an on-time row | ☑ | PASSES: `late-completion.views.test.tsx`; Family Log page tests updated (FD-05). |
| T-04 | AC-05 | component | `DatePickerGrid` rings today (Melbourne), `aria-current`, only one day | ☑ | PASSES: `date-picker-grid.today.test.tsx`. |
| T-05 | AC-06 | component | `EventForm` opens on the date's month, follows date changes, still pages | ☑ | PASSES: `event-form.month.test.tsx`. |
| T-06 | AC-07 | component | Admin Manage picker still selects, pages and shows dots; today ringed | ☑ | PASSES: `manage-picker.today.test.tsx`. |
| T-07 | AC-08, AC-09 | unit + component | Details validation and fields: End time, blank allowed, after start, malformed; Add saves `durationMinutes` | ☑ | PASSES: `event-details.test.ts`, `event-details-fields.test.tsx`, `event-form-add.test.tsx`. |
| T-08 | AC-10 | unit + component | Edit opens with End = start + duration; 0 gives blank | ☑ | PASSES: `event-details.test.ts`, `event-form-edit.test.tsx`. |
| T-09 | AC-11 | component | Carer Add/Edit form shows Start and End time; Family unchanged | ☑ | PASSES: `carer-manage-events.test.tsx` (T-04 changed, FD-05) and carer e2e. |

## Regression scope
- Full vitest with `DATA_SOURCE=mock`, lint, typecheck, format check; integration for event create/edit against the local stack; Playwright e2e for Family and Carer events with `--grep-invert "F0-07"` on the local stack.

## How to run
- `DATA_SOURCE=mock npx vitest run <files>`; `npm run verify`.

## Test data
- Mock fixtures (Margaret); component tests build occurrences with explicit `start` and `completedAt`.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.

## Results (2026-10-02, after merging origin/main: up to date)
- Tests written first and confirmed failing for the right reason (missing module, missing End time field, no ring, no month sync) before implementation.
- `DATA_SOURCE=mock npx vitest run`: 204 files passed, 35 skipped (integration), 2488 tests passed, 0 failed. Baseline on clean main: 2463 passed.
- `npm run lint`: 0 errors (3 pre-existing warnings, same as main). `npm run typecheck`, `npx prettier --check .`: clean.
- Integration on the local stack (env from `supabase status`): `family-add-event`, `family-edit-event`, `carer-manage-events`, `family-task-detail`, `family-task-log`: 28/28.
- e2e on the local stack, `--grep-invert "F0-07"`: Family event-form, calendar, task-detail, task-log-filters 23/23 (mock source); carer-manage-events and carer-complete-task 6/6 (`E2E_DATA_SOURCE=supabase`).
- Real browser, 1920/1440/1280/1024/768: no horizontal overflow, no overlap in the form, Log rows or Task detail; today ring, month follow, End time validation and late notes seen.
