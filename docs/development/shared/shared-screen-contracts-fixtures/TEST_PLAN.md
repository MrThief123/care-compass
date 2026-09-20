# Test Plan — UI-04 Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

## Approach

Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Titles start `[UI-04][AC-xx]`.

## Test levels used

- **unit** → `src/**/<module>.test.ts` (Vitest, colocated). The contract tests run through `src/server/**` with `DATA_SOURCE=mock`, the same path the screens use.
- **integration** → `tests/integration/*.test.ts` (existing UI-00 and F0-15 tests that read the fixtures).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Pure log query: newest first by instant across mixed offsets (`Z` and `+11:00`), ties by key ascending. | ☑ | PASS |
| T-02 | AC-01 | unit | Margaret's log read page by page equals the independently sorted fixture list; strictly ordered; no duplicate keys; stable across two reads. | ☑ | PASS |
| T-03 | AC-02 | unit | Synthetic logs of 0, 1, 20, 21 and 40 rows: items per page, `total`, `page`, `pageSize`; page beyond last is empty with the true total and requested page. | ☑ | PASS |
| T-04 | AC-02 | unit | Margaret's log: 137 rows, pages 1 to 6 hold 20, page 7 holds 17, page 8 is empty with `total` 137. | ☑ | PASS |
| T-05 | AC-03 | unit | `page` 0, -1, 1.5, NaN, Infinity and `status` 'bogus' reject with a Zod error; omitted page is 1; `Number.MAX_SAFE_INTEGER` returns an empty page. | ☑ | PASS |
| T-06 | AC-04 | unit | `q` (case, trim, no match), `status`, and both together: `total` and pages describe the filtered set over the whole history. | ☑ | PASS |
| T-07 | AC-05 | unit | `getOccurrence` returns a done, an overdue and a planned (later than the reference time) occurrence, and an old history one. | ☑ | PASS |
| T-08 | AC-05 | unit | `getOccurrence` returns `undefined` for an unknown key, an unknown client, and another client's key in both directions. | ☑ | PASS |
| T-09 | AC-06 | unit | `getEventDocuments`: one document, several (oldest upload first), none. | ☑ | PASS |
| T-10 | AC-06 | unit | `getEventDocuments` with a mismatched client and event pair returns `[]` (no cross-client leakage). | ☑ | PASS |
| T-11 | AC-07 | unit | DATA_SOURCE=supabase: `getOccurrence` and `getEventDocuments` throw naming their domain and function. | ☑ | PASS |
| T-12 | AC-08 | unit | Margaret's header summary: 78 years, 'Preston VIC', 'Banksia Home Care'. | ☑ | PASS |
| T-13 | AC-08 | unit | The Task log rows between 26 and 30 Nov 2026 are exactly the nine design rows with their statuses and nurses. | ☑ | PASS |
| T-14 | AC-08 | unit | Overdue filter returns exactly Weekly weigh-in and Medication review, no actor and no assignee. | ☑ | PASS |
| T-15 | AC-08 | unit | The five newest done-or-overdue rows are the design's Recent activity rows in order. | ☑ | PASS |
| T-16 | AC-08 | unit | Morning medication detail: Done by Aisha Rahman, completed 09:14, design description, 'Medication chart.pdf' attached. | ☑ | PASS |
| T-17 | AC-09 | unit | At least 120 completed occurrences before 26 Nov; 7 pages; a ~100-character title and a ~50-character carer name on page 1. | ☑ | PASS |
| T-18 | AC-10 | unit | Keys unique across clients and equal `eventId:start`; client and event of each occurrence exist and agree. | ☑ | PASS |
| T-19 | AC-10 | unit | Done rows have actor and completion time, others neither; names are staff full names or a listed temporary carer. | ☑ | PASS |
| T-20 | AC-10 | unit | Every document belongs to an existing event of its own client. | ☑ | PASS |
| T-21 | AC-10 | unit | Repeated reads and a fresh module load return identical data (no clock, no randomness). | ☑ | PASS |
| T-22 | AC-10 | unit | Every fixture record parses with its Zod schema; other clients, staff, shifts, notifications and budgets unchanged; every written offset is the real Melbourne offset. | ☑ | PASS |

Test titles must start with `[UI-04][AC-xx]`.

Results: 127 tests titled `[UI-04][AC-xx]`, all passing (AC-01 15, AC-02 13, AC-03 12, AC-04 15, AC-05 15, AC-06 16, AC-07 2, AC-08 7, AC-09 17, AC-10 15). Each T-nn above is a group of one or more of them. Every new file starts with `// @vitest-environment node` (DECISIONS.md FD-12).

Where the tests live: `src/mocks/queries/events.test.ts` (T-01, T-03, T-05 large page, T-06, T-07, T-08 pure logic over synthetic logs), `src/mocks/queries/documents.test.ts` (T-09, T-10 pure logic), `src/mocks/melbourne-time.test.ts` (day key and local-to-ISO offsets, T-01 and T-17 support), `src/mocks/history.test.ts` (the history generator, T-17 support), `src/server/events/queries.test.ts` and `src/server/documents/queries.test.ts` (contract rules that hold for any data set, T-02, T-05, T-06, T-08, T-10, T-11), `src/mocks/fixtures.test.ts` (fixture-specific T-04, T-12 to T-22, written in the fixtures phase), `tests/integration/shared-app-shell-clients-contract.test.ts` (existing F0-15 test whose expectation changed, FD-06; also covers T-12).

## Regression scope

- `npx vitest run src`, `npx vitest run` (only the known `tests/integration/shared-supabase-environment.test.ts` import crash is a baseline failure), `npm run lint`, `npm run typecheck`, `npm run format:check`.
- No screens are built here, so no Playwright spec applies. No database is touched, so `supabase test db` does not apply.
- Existing tests that read the fixtures: `tests/integration/shared-app-shell-clients-contract.test.ts` (expectation changed, see DECISIONS.md), `tests/integration/shared-domain-contracts-fixtures.test.ts` (budget, unchanged).

## Test data

- Margaret and the design week, at reference date Monday 30 November 2026; a generated history before 26 Nov (137 rows in all); Robert (three rows, one document) for isolation tests. Synthetic only.

Note: one guard test (every written offset is the real Melbourne offset) was added after the fixtures were done and passed on first run; it was mutation-checked by corrupting one offset, watching it fail, and reverting.

## Coverage mapping rule

Every AC must have at least one test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
