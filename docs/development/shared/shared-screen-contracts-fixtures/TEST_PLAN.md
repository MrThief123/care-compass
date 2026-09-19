# Test Plan — UI-04 Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

## Approach

Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Titles start `[UI-04][AC-xx]`.

## Test levels used

- **unit** → `src/**/<module>.test.ts` (Vitest, colocated). The contract tests run through `src/server/**` with `DATA_SOURCE=mock`, the same path the screens use.
- **integration** → `tests/integration/*.test.ts` (existing UI-00 and F0-15 tests that read the fixtures).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Pure log query: newest first by instant across mixed offsets (`Z` and `+11:00`), ties by key ascending. | ☐ | NOT RUN |
| T-02 | AC-01 | unit | Margaret's log read page by page equals the independently sorted fixture list; strictly ordered; no duplicate keys; stable across two reads. | ☐ | NOT RUN |
| T-03 | AC-02 | unit | Synthetic logs of 0, 1, 20, 21 and 40 rows: items per page, `total`, `page`, `pageSize`; page beyond last is empty with the true total and requested page. | ☐ | NOT RUN |
| T-04 | AC-02 | unit | Margaret's log: 137 rows, pages 1 to 6 hold 20, page 7 holds 17, page 8 is empty with `total` 137. | ☐ | NOT RUN |
| T-05 | AC-03 | unit | `page` 0, -1, 1.5, NaN, Infinity and `status` 'bogus' reject with a Zod error; omitted page is 1; `Number.MAX_SAFE_INTEGER` returns an empty page. | ☐ | NOT RUN |
| T-06 | AC-04 | unit | `q` (case, trim, no match), `status`, and both together: `total` and pages describe the filtered set over the whole history. | ☐ | NOT RUN |
| T-07 | AC-05 | unit | `getOccurrence` returns a done, an overdue and a planned (later than the reference time) occurrence, and an old history one. | ☐ | NOT RUN |
| T-08 | AC-05 | unit | `getOccurrence` returns `undefined` for an unknown key, an unknown client, and another client's key in both directions. | ☐ | NOT RUN |
| T-09 | AC-06 | unit | `getEventDocuments`: one document, several (oldest upload first), none. | ☐ | NOT RUN |
| T-10 | AC-06 | unit | `getEventDocuments` with a mismatched client and event pair returns `[]` (no cross-client leakage). | ☐ | NOT RUN |
| T-11 | AC-07 | unit | DATA_SOURCE=supabase: `getOccurrence` and `getEventDocuments` throw naming their domain and function. | ☐ | NOT RUN |
| T-12 | AC-08 | unit | Margaret's header summary: 78 years, 'Preston VIC', 'Banksia Home Care'. | ☐ | NOT RUN |
| T-13 | AC-08 | unit | The Task log rows between 26 and 30 Nov 2026 are exactly the nine design rows with their statuses and nurses. | ☐ | NOT RUN |
| T-14 | AC-08 | unit | Overdue filter returns exactly Weekly weigh-in and Medication review, no actor and no assignee. | ☐ | NOT RUN |
| T-15 | AC-08 | unit | The five newest done-or-overdue rows are the design's Recent activity rows in order. | ☐ | NOT RUN |
| T-16 | AC-08 | unit | Morning medication detail: Done by Aisha Rahman, completed 09:14, design description, 'Medication chart.pdf' attached. | ☐ | NOT RUN |
| T-17 | AC-09 | unit | At least 120 completed occurrences before 26 Nov; 7 pages; a ~100-character title and a ~50-character carer name on page 1. | ☐ | NOT RUN |
| T-18 | AC-10 | unit | Keys unique across clients and equal `eventId:start`; client and event of each occurrence exist and agree. | ☐ | NOT RUN |
| T-19 | AC-10 | unit | Done rows have actor and completion time, others neither; names are staff full names or a listed temporary carer. | ☐ | NOT RUN |
| T-20 | AC-10 | unit | Every document belongs to an existing event of its own client. | ☐ | NOT RUN |
| T-21 | AC-10 | unit | Repeated reads and a fresh module load return identical data (no clock, no randomness). | ☐ | NOT RUN |
| T-22 | AC-10 | unit | Every fixture record parses with its Zod schema; other clients and budgets unchanged. | ☐ | NOT RUN |

Test titles must start with `[UI-04][AC-xx]`.

## Regression scope

- `npx vitest run src`, `npx vitest run` (only the known `tests/integration/shared-supabase-environment.test.ts` import crash is a baseline failure), `npm run lint`, `npm run typecheck`, `npm run format:check`.
- No screens are built here, so no Playwright spec applies. No database is touched, so `supabase test db` does not apply.
- Existing tests that read the fixtures: `tests/integration/shared-app-shell-clients-contract.test.ts` (expectation changed, see DECISIONS.md), `tests/integration/shared-domain-contracts-fixtures.test.ts` (budget, unchanged).

## Test data

- Margaret and the design week, at reference date Monday 30 November 2026; a generated history before 26 Nov; Robert for isolation tests. Synthetic only.

## Coverage mapping rule

Every AC must have at least one test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
