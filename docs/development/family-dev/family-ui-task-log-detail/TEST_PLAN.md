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
| T-01 | AC-01 | component | Given fixtures, when Task log renders, then 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha Rahman · Done · Aisha Rahman'. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-02 | AC-02 | component | Given status filter Overdue, when applied, then only Weekly weigh-in and Medication review remain, each with nurse '—'. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-03 | AC-03 | component | Given search 'Zoe', when applied, then 'No matches for "Zoe".' is shown. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-04 | AC-04 | component | Given the Morning medication detail, when rendered, then 'Done · Aisha Rahman' and 'Completed at 09:14' are shown. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-05 | PRD | unit | Nurse label rules (OQ-29 / PD-055 / PD-038): actor once Done, shift-derived assignee otherwise, '—' if none. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-06 | PRD | unit | Client-side search (title, case-insensitive) and status filter combine; newest day first (OQ-31 default), contract order kept within a day. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-07 | PRD | unit | Routes and occurrence-key encoding: `/family/[clientId]/tasks`, `/tasks/[occurrenceKey]`, edit-event link; decode tolerates encoded, decoded and malformed keys. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-08 | AC-04 | unit | Melbourne wall-clock helpers: 'Completed at' `HH:mm`, Melbourne day key. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-09 | PRD | component | Task log interactions and states: row/link navigation, live result count, empty state, no-results state, long titles, axe. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-10 | PRD | component | Task detail: Back link, subline, Status/Description/Documents cards, Edit link, planned/overdue/actor variants, empty documents, long text, axe. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-11 | AC-04 | unit | `findOccurrence` derives one occurrence from `getTaskLog` (pages until found, stops at the end, rejects on query failure) — FD-03. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-12 | AC-01, AC-03, AC-04 | component | Route pages call the real mock contract (`DATA_SOURCE=mock`): rows equal what `getTaskLog` returns; empty client; detail by key; unknown/other-client key is a 404; rejected query propagates to the error boundary. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-13 | PRD | component | Route states: Task log loading skeleton and error state with Retry; Task detail loading skeleton and not-found page; axe on each. | ☑ | GREEN 2026-09-19 (red first: missing module) |
| T-14 | PRD | component | Added after a browser check (each run red first): a nurse name stays on one line so rows stay 50px and its full text is on hover; the task link is sized to its text so its focus ring does not span the column. | ☑ | GREEN 2026-09-19 (red first) |


**Requirement change (CHG-005, FD-12):** search, Status filter and paging are now server-driven across the whole history, so the client-side filter/sort tests (T-06 and the filtering assertions in T-01, T-02, T-03, T-09) change or move to the page and loader level. Each changed or removed test is listed with before, after and reason in DECISIONS.md FD-13. New tests use `[FAM-UI-07][AC-05]` to `[AC-08]` and `[FAM-UI-07][PRD]`, and run against generated data at realistic volumes (537 rows, exactly one page, exactly 20, 21, none; 120-character titles, 60-character names, non-ASCII), never only the sample rows.

### Test files
- `src/features/family-task-log/`: `occurrence-display.test.ts` (T-05), `task-log-query.test.ts` (T-06), `task-routes.test.ts` (T-07), `melbourne-time.test.ts` (T-08), `task-log-view.test.tsx` (T-01, T-02, T-03, T-09, T-14); `design-fixtures.ts` is test-support data (FD-02).
- `src/features/family-task-detail/`: `task-detail-view.test.tsx` (T-04, T-10), `find-occurrence.test.ts` (T-11).
- `src/app/(family)/family/[clientId]/tasks/`: `page.test.tsx`, `page.error.test.tsx`, `states.test.tsx`, `[occurrenceKey]/page.test.tsx`, `[occurrenceKey]/states.test.tsx` (T-12, T-13).

## Regression scope
- Full unit/component suite: `npx vitest run src` (run, green). `npm run verify` is red on a fresh worktree only because `tests/integration/shared-supabase-environment.test.ts` needs Supabase env vars (known baseline, not this feature); the individual verify steps were run instead (see PROGRESS.md).
- `supabase test db`: not run and not applicable. This feature changes no schema, and running the Supabase CLI is out of bounds for this session.
- Playwright e2e: not run. This feature has no e2e AC (TESTING.md §5: only for features with e2e ACs and before checkpoints D10/D12); the pages were driven in headless Chromium against `next dev` instead (see PROGRESS.md).

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha Rahman, Priya) unless a test creates its own fixtures.
- The shared mock fixtures do not yet hold the design's nine Task log rows (FD-02), so the component tests create their own design-matching rows in `src/features/family-task-log/design-fixtures.ts`; the route-page tests use the real mock contract.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
