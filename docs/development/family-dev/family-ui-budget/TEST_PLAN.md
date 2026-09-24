# Test Plan — FAM-UI-05 Family Budget screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Budget renders, then NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown. | ☑ | FAIL (red, expected) |
| T-02 | AC-02 | component | Given fixtures, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | ☑ | FAIL (red, expected) |
| T-03 | AC-03 | component | Given no fund entries, when History renders, then an empty state is shown. | ☑ | FAIL (red, expected) |

T-01 is `[FAM-UI-05][AC-01]` in `family-budget.test.tsx` (cards, order, totals, percent used, progress bars, Government's warning in words). T-02 is `[FAM-UI-05][AC-02]` in `family-budget.test.tsx` (columns, first row, all three rows) with the contract and fixture tests below. T-03 is `[FAM-UI-05][AC-03]` in `family-budget.test.tsx` (empty History shows the empty state and no table; cards and 'Update' stay).

### Tests added beyond T-01..T-03 (PRD scope, edge cases, contracts)
All titles start `[FAM-UI-05]`, were written first, and are red now (see Results).

| Test group | Covers | Level | File |
|---|---|---|---|
| History rows: an expense reads "-$320" in the same columns, cents kept and "Sep" not "Sept", "No description" for a missing or blank description (FD-09), identical entries shown without a duplicate-key warning, 40 entries with no paging, cards and table stay in their own card | PD-034, PRD Scope, FD-09 | component | `src/features/family-budget/family-budget.test.tsx` |
| Who recorded each entry (FD-05, PD-034): a "Recorded by <name>" line under the description in the same cell, so the table keeps three columns and the description is read first; an expense names its carer; no line for a missing, blank or padded recorder (trimmed, never "unknown"); the bucket cards name no recorder; a 300-character unbroken name is cut to two lines with the whole line in the DOM and `title`; a non-ASCII name keeps every character | PD-034, FD-05 (human decision 2026-09-25) | component | `src/features/family-budget/family-budget.test.tsx` |
| Screen shape: two cards 'Funds by source' then 'History', no client name or h1 repeated, 'Update' is a `type="button"` | PRD Scope, FD-08 | component | `src/features/family-budget/family-budget.test.tsx` |
| 'Update': a live region is on the page from the start and empty, pressing it says "Updating funds is not available yet." and changes nothing, works from the keyboard | FD-06 (the flow is FAM-11) | component | `src/features/family-budget/family-budget.test.tsx` |
| States: empty History, no buckets (keeps 'Update'), neither, error state with Retry for either read rejecting (Retry calls `router.refresh()` once, no regions, no 'Update'), feature-tagged log with no error message and no client data, labelled loading skeleton with no data | PRD Scope, States sheet, FD-07, OQ-24 defaults | component | `src/features/family-budget/family-budget.test.tsx` |
| Contract reads: each read is called once with the route's client, the header summary is not read | FD-08, PRD Data / privacy | component | `src/features/family-budget/family-budget.test.tsx` |
| Long and unusual content: a 300-character unbroken description is cut to two lines with the whole text in the DOM and `title`, long spaced and non-ASCII descriptions keep every character, "+$9,999,999,999.99" keeps every digit, a long bucket name is cut to two lines with `title`, five buckets including duplicates without a key warning, an overspent bucket says "over budget" in words | PRD Error / Edge Cases, no overlap at any width | component | `src/features/family-budget/family-budget.test.tsx` |
| axe: the screen before and after 'Update', and the loading, empty and error states | PRD accessibility | component | `src/features/family-budget/family-budget.test.tsx` |
| `loadFamilyBudgetData`: reads buckets and history only through the contract, only for the route's client, gives the screen nothing else (each entry's `recordedBy` included), does not read the header summary, keeps the contract's order, passes empties through, rejects as a whole | PRD Data / privacy, FD-08 | unit | `src/features/family-budget/budget-data.test.ts` |
| `formatFundDate`: "2026-11-03" is "3 Nov 2026", no leading zero, three-letter months, unaffected by the Melbourne daylight-saving switches, year ends and a leap day, invalid input returned unchanged. `formatSignedDollars`: "+$6,000", "-$320", cents only when present, floating-point sums, "$0" for nothing, very large amounts | FD-04 | unit | `src/features/family-budget/budget-format.test.ts` |
| `getBudgetSummary` for Margaret: NDIS $14,880, Fixed $2,750, Government $240 remaining, 38 / 45 / 92 percent, Government in the `alert` state (PD-032) | AC-01 | unit | `src/server/budget/queries.test.ts` |
| `getFundHistory`: the design's first row, the three design rows word for word in order, every entry names its recorder (Helen Doyle for Margaret's three), newest date first for each client, valid entries, client scoping, unknown and object-prototype ids give `[]`, callers cannot mutate fixtures, supabase mode throws the not-implemented error | CHG-019 contract, AC-02, AC-03, FD-05 | unit | `src/server/budget/queries.test.ts` |
| `FUND_ENTRIES` fixtures: schema-valid with unique ids, every client and bucket kind exists, top-ups are positive and expenses negative, Margaret has exactly the three design rows with their recorder, every entry names a recorder who is a person the fixtures have, another client has an entry of their own | CHG-019 fixtures, AC-02, FD-05 | unit | `src/mocks/queries/budget.test.ts` |

Not tested here, by design: the Update funds flow and recording an entry with its recorder (FAM-11), and wiring to the database (FAM-10).

**HUMAN REVIEW: test expectation changed (CLAUDE.md §5).** On 2026-09-25, after the tests were committed (`a7ffb6e`) and before any implementation, the human decided History should show who recorded each entry (FD-05). The test `[FAM-UI-05][PRD] FD-05: a row is date, description and amount only, with no 'recorded by' text drawn` asserted the opposite, so it was replaced by the attribution tests in the group above, and the fixtures and contract tests now expect `recordedBy`. No other assertion changed; DECISIONS.md FD-05 lists each change, before and after. The changed expectations were run red first (below).

## Results

### Red run before implementation (2026-09-25, re-run after FD-05)
`npx vitest run src/features/family-budget src/server/budget src/mocks/queries/budget.test.ts`: 5 files failed. 12 tests failed and 7 passed in the two files that could load; the other three files fail at import, so their 73 tests do not run yet. 92 tests in all.

| File | Tests | Red because |
|---|---|---|
| `src/features/family-budget/family-budget.test.tsx` | 43 | Fails at import: `budget/loading` does not exist yet. Run once with that import stubbed, 41 of 43 failed for the expected reasons: the placeholder page renders "Coming soon.", so the 'Funds by source' and 'History' regions, the cards, the table, the "Recorded by" lines, 'Update', the states and the contract reads are all missing. The 2 that passed (header summary not read, axe on empty states) pass on the placeholder and are expected to stay green. |
| `src/features/family-budget/budget-format.test.ts` | 24 | Fails at import: `./budget-format` does not exist. |
| `src/features/family-budget/budget-data.test.ts` | 6 | Fails at import: `./budget-data` does not exist. |
| `src/server/budget/queries.test.ts` | 12 | 10 fail with `getFundHistory is not a function` (the contract read does not exist). The 2 `getBudgetSummary` tests pass already: that read and its fixtures are unchanged (PD-032, PD-033). |
| `src/mocks/queries/budget.test.ts` | 7 | 2 fail: Margaret's fixtures have 2 entries, not the design's 3, and no other client has an entry. The other 5 pass on the current fixtures (which already set `recordedBy`) and must stay green after they are reshaped. |

The failing tests fail for the right reason: the code they test does not exist yet. No test was skipped, marked `.only`, or weakened. The throwaway stubbed copy of the screen test used for the per-test check was deleted, not committed.

### After implementation (2026-09-25)
**CI is down (GitHub Actions limits), so every check below ran locally.** No test was changed, skipped, marked `.only` or deleted: the 92 tests are the ones written first (FD-05 amendment aside, above).

- `npx vitest run src/features/family-budget src/server/budget src/mocks/queries/budget.test.ts`: 5 files, **92 of 92 pass** (43 screen, 24 formatters, 6 data loader, 12 contract, 7 fixtures).
- `npx vitest run src tests/unit`: 105 files, **1270 of 1270 pass**.
- `npx tsc --noEmit`: clean. `npx eslint .`: 0 errors, 3 warnings, none in this feature's files (`scripts/plan-status.mjs` unused `statusOrder`; `src/app/page.tsx` two `import/order`). `npx prettier --check .`: clean.
- `next build`: succeeds; `/family/[clientId]/budget` is a dynamic route.
- Playwright e2e on the production build (`next start`), `--grep-invert "F0-07"` (those specs write orphan rows to the hosted Supabase): **34 pass, 2 fail**, both `[F0-15][PRD] keeps header text inside the header bar, without overlap` at 480px and 338px. Neither is caused by this feature: they load `/family/client-margaret/home`, no file this branch changes is on that page, and both were reproduced on a clean build of `origin/family-dev` (02c7fa7). 480px fails there every time with the same 30px page overflow. 338px is a timing flake there too: 2 failures in 30 runs, same 172px overflow (on this branch 2 in 39 runs). Not fixed here: the shell is not lane F's (CLAUDE.md §4.2). Flag for the shell owner.
- `supabase test db`: not run. This feature changes no migration or SQL.

**Real-browser design and width check** (Playwright, Chromium against the dev server on :3000; the Chrome extension was not connected):
- Against `docs/design/screens/family-06-budget.png` at 1440: same page. Differences, all deliberate: the "Recorded by Helen Doyle" line under each description (FD-05, not drawn in the design); the History column headings are grey small caps as in the Task log table.
- Widths 1920, 1600, 1440, 1280, 1024, 768, 700 and 600, each with the normal fixtures and a stress set (a 300-character description and recorder name, 40 rows, five buckets, `+$9,999,999,999.99`): no horizontal page scroll, nothing outside its card, no overlapping cells or tiles. One defect found and fixed: at 768 the huge amount broke mid-number because the amount column was too narrow, so its floor went from 7rem to 9rem (commit 4cc8aec, FD-10). The table switches to two-line rows below a 36rem card; long descriptions and recorder names are cut at two lines with the full text in `title`.
- Update pressed: "Updating funds is not available yet." appears on its own line under the card header, and nothing else moves.
- Not viewed by eye: the loading skeleton (covered by its unit and axe tests).

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
