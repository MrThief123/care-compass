# Test Plan — FAM-UI-07 Family Task log and Task detail screens (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit** → `src/**/*.test.ts` for the pure helpers the screens use

## Test cases

`T-01`–`T-04` are the planned cases, one per AC. Their AC/description wording was updated to full staff names per PD-038 (see DECISIONS.md FD-01). `T-05` onwards cover PRD Scope lines that no AC pins down (routes, states, accessibility, edge cases); their titles use `[FAM-UI-07][PRD]`.

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Task log renders, then 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha Rahman · Done · Aisha Rahman'. | ☑ | RED (missing module) 2026-09-19 |
| T-02 | AC-02 | component | Given status filter Overdue, when applied, then only Weekly weigh-in and Medication review remain, each with nurse '—'. | ☑ | RED (missing module) 2026-09-19 |
| T-03 | AC-03 | component | Given search 'Zoe', when applied, then 'No matches for "Zoe".' is shown. | ☑ | RED (missing module) 2026-09-19 |
| T-04 | AC-04 | component | Given the Morning medication detail, when rendered, then 'Done · Aisha Rahman' and 'Completed at 09:14' are shown. | ☑ | RED (missing module) 2026-09-19 |
| T-05 | PRD | unit | Nurse label rules (OQ-29 / PD-055 / PD-038): actor once Done, shift-derived assignee otherwise, '—' if none. | ☑ | RED (missing module) 2026-09-19 |
| T-06 | PRD | unit | Client-side search (title, case-insensitive) and status filter combine; newest day first (OQ-31 default), contract order kept within a day. | ☑ | RED (missing module) 2026-09-19 |
| T-07 | PRD | unit | Routes and occurrence-key encoding: `/family/[clientId]/tasks`, `/tasks/[occurrenceKey]`, edit-event link; decode tolerates encoded, decoded and malformed keys. | ☑ | RED (missing module) 2026-09-19 |
| T-08 | AC-04 | unit | Melbourne wall-clock helpers: 'Completed at' `HH:mm`, Melbourne day key. | ☑ | RED (missing module) 2026-09-19 |
| T-09 | PRD | component | Task log interactions and states: row/link navigation, live result count, empty state, no-results state, long titles, axe. | ☑ | RED (missing module) 2026-09-19 |
| T-10 | PRD | component | Task detail: Back link, subline, Status/Description/Documents cards, Edit link, planned/overdue/actor variants, empty documents, long text, axe. | ☑ | RED (missing module) 2026-09-19 |
| T-11 | AC-04 | unit | `findOccurrence` derives one occurrence from `getTaskLog` (pages until found, stops at the end, rejects on query failure) — FD-03. | ☑ | RED (missing module) 2026-09-19 |
| T-12 | AC-01, AC-03, AC-04 | component | Route pages call the real mock contract (`DATA_SOURCE=mock`): rows equal what `getTaskLog` returns; empty client; detail by key; unknown/other-client key is a 404; rejected query propagates to the error boundary. | ☑ | RED (missing module) 2026-09-19 |
| T-13 | PRD | component | Route states: Task log loading skeleton and error state with Retry; Task detail loading skeleton and not-found page; axe on each. | ☑ | RED (missing module) 2026-09-19 |

### Test files
- `src/features/family-task-log/`: `occurrence-display.test.ts` (T-05), `task-log-query.test.ts` (T-06), `task-routes.test.ts` (T-07), `melbourne-time.test.ts` (T-08), `task-log-view.test.tsx` (T-01, T-02, T-03, T-09); `design-fixtures.ts` is test-support data (FD-02).
- `src/features/family-task-detail/`: `task-detail-view.test.tsx` (T-04, T-10), `find-occurrence.test.ts` (T-11).
- `src/app/(family)/family/[clientId]/tasks/`: `page.test.tsx`, `page.error.test.tsx`, `states.test.tsx`, `[occurrenceKey]/page.test.tsx`, `[occurrenceKey]/states.test.tsx` (T-12, T-13).

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha Rahman, Priya) unless a test creates its own fixtures.
- The shared mock fixtures do not yet hold the design's nine Task log rows (FD-02), so the component tests create their own design-matching rows in `src/features/family-task-log/design-fixtures.ts`; the route-page tests use the real mock contract.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
