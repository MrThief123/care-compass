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
| T-01 | AC-04 | unit | `lateCompletionNote` wording and boundaries (days/hours, hours/minutes, minutes, singular, zero parts, under a minute) | ☐ | |
| T-02 | AC-01, AC-02 | component | Task detail shows the note for a late Done task; none for on-time, planned, overdue, plain | ☐ | |
| T-03 | AC-03, AC-02 | component | Log row shows the note for a late Done row, none for an on-time row | ☐ | |
| T-04 | AC-05 | component | `DatePickerGrid` rings today (Melbourne), `aria-current`, only one day | ☐ | |
| T-05 | AC-06 | component | `EventForm` opens on the date's month, follows date changes, still pages | ☐ | |
| T-06 | AC-07 | component | Admin Manage picker still selects, pages and shows dots; today ringed | ☐ | |
| T-07 | AC-08, AC-09 | unit + component | Details validation and fields: End time, blank allowed, after start, malformed; Add saves `durationMinutes` | ☐ | |
| T-08 | AC-10 | unit + component | Edit opens with End = start + duration; 0 gives blank | ☐ | |
| T-09 | AC-11 | component | Carer Add/Edit form shows Start and End time; Family unchanged | ☐ | |

## Regression scope
- Full vitest with `DATA_SOURCE=mock`, lint, typecheck, format check; integration for event create/edit against the local stack; Playwright e2e for Family and Carer events with `--grep-invert "F0-07"` on the local stack.

## How to run
- `DATA_SOURCE=mock npx vitest run <files>`; `npm run verify`.

## Test data
- Mock fixtures (Margaret); component tests build occurrences with explicit `start` and `completedAt`.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
