# Test Plan — FAM-UI-05 Family Budget screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Budget renders, then NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown. | ☑ | PASS |
| T-02 | AC-02 | component | Given fixtures, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | ☑ | PASS |
| T-03 | AC-03 | component | Given no fund entries, when History renders, then an empty state is shown. | ☑ | PASS |
| T-04 | AC-04 | component | 'Edit' opens Edit budget; NDIS +500, no note, Save → Budget NDIS '$15,380', first History row reference day, 'Funds added', '+$500', "Budget updated." (CHG-020, CHG-021) | ☑ | PASS |
| T-05 | AC-05 | component | Remove 40 from Government → '$200', 'Funds removed', '-$40'; remove 300 → 'Only $240 available', page stays, nothing changes (CHG-020, CHG-021) | ☑ | PASS |
| T-06 | AC-06 | unit + component | Edit budget schema and page: bad amounts, empty / too long / duplicate names, a new bucket with no starting amount are refused, a message per field, focus on the first; Cancel and Escape change nothing (CHG-020, CHG-021) | ☑ | PASS |
| T-07 | AC-07 | component | Government card reads 'Pending $310 · 1 cost' in words (CHG-020) | ☑ | PASS |
| T-08 | AC-08 | component | History lists the pending cost with '-$310' and a 'Pending' text label (CHG-020) | ☑ | PASS |
| T-09 | AC-09 | component | 'Add bucket' 'Council grant' 1200 → fourth card '$1,200', first row 'Bucket added', '+$1,200' (CHG-021) | ☑ | PASS |
| T-10 | AC-10 | component | Rename 'Fixed' to 'Fixed support' → same figures, no new History row (CHG-021) | ☑ | PASS |
| T-11 | AC-11 | component | Remove the added 'Council grant' → card gone, 'Bucket removed', '-$1,200'; NDIS and Government have no 'Remove bucket' and say why (CHG-021) | ☑ | PASS |
| T-12 | AC-12 | component | No buckets → empty Funds card pointing to 'Edit'; Edit budget suggests 'NDIS', 'Fixed', 'Government' (CHG-021) | ☑ | PASS |
| T-13 | AC-13 | component | 'Pending costs' section between the cards and History lists '27 Oct 2026', 'Government', 'Physiotherapy', '$310', oldest first; none → 'No pending costs.' (CHG-022) | ☑ | PASS |
| T-14 | AC-14 | unit + component | Add 100 to Government → '$30', no pending line, 'No pending costs.', row no longer 'Pending'; add 50 → '$290', still pending; older cost that does not fit blocks a newer one (CHG-022) | ☑ | PASS |
| T-15 | AC-15 | unit + component | A row opens by click, Enter or Space a dialog titled with its description: date, bucket, amount, status, recorder, note; Close or Escape returns focus to the row (CHG-022) | ☑ | PASS |
| T-16 | AC-16 | unit + component | NDIS +500 with note 'Q3 plan review' → first row 'Q3 plan review', 'Recorded by you', note in details; a 'Bucket added' row of the same save shows the note (CHG-022) | ☑ | PASS |
| T-17 | AC-17 | unit + component | 'Export' downloads 'budget-history-2026-11-30.csv': header, one line per row in order, plain amounts, formulas neutralised; no rows → no 'Export' (CHG-022) | ☑ | PASS |

**CHG-022 (2026-09-25):** T-13 to T-17 are new (PD-060). They are written and run red before any CHG-022 code:
- `family-budget.test.tsx`, new groups:
  - "Pending costs section" (AC-13).
  - "adding funds pays pending costs" (AC-14).
  - "entry details" (AC-15).
  - "who recorded a save, and its note" (AC-16).
  - "History export" (AC-17).
  - "accessibility of the CHG-022 additions".
- `budget-edit.test.ts`, two new groups:
  - `applyBudgetEdit` pays pending costs (AC-14): whole, oldest first, stops at the first that does not fit, same-day order, overspent, other buckets untouched, cents, no mutation.
  - `applyBudgetEdit` records who made each row and keeps the note (AC-16).
- `budget-export.test.ts` (new): `budgetHistoryCsv` and `budgetHistoryFileName` (AC-17).
- `src/types/domain.test.ts`: `FundEntrySchema` keeps `note` and `paidOn`.

Five existing assertions change with PD-060. They are listed in DECISIONS.md FD-13 and in the HUMAN REVIEW note below.

**CHG-021 (2026-09-25):** T-04 to T-06 are rewritten for the Edit budget page and T-09 to T-12 added; they are written and run red before the page is built. The paragraph below describes the CHG-020 inline-form tests, which those replace.

T-04 to T-06 (CHG-020, superseded by CHG-021) were the `[FAM-UI-05][AC-04]`, `[AC-05]` and `[AC-06]` tests in the "'Update' opens the simple form" group of `family-budget.test.tsx` (the form's fields, save, the status message and focus, local state only, the balance limit following the screen, removing the whole balance, each refused amount and no bucket, focus on the first field to fix, Cancel, keyboard, adding funds does not pay pending costs), and `src/features/family-budget/fund-update.test.ts` (unit: `validateFundUpdate` accepted and refused amounts with their messages, the bucket, the balance limit with cents and for an empty or overspent bucket, the note trimmed; `applyFundUpdate` totals, percent and state, the new row, cents arithmetic, pending figures kept, same-kind buckets, no mutation). T-07 and T-08 are the "pending costs" group of `family-budget.test.tsx`, plus the pending tests in `queries.test.ts`, `mocks/queries/budget.test.ts` and `budget-data.test.ts`.

T-01 is `[FAM-UI-05][AC-01]` in `family-budget.test.tsx` (cards, order, totals, percent used, progress bars, Government's warning in words). T-02 is `[FAM-UI-05][AC-02]` in `family-budget.test.tsx` (columns, first row, all three rows) with the contract and fixture tests below. T-03 is `[FAM-UI-05][AC-03]` in `family-budget.test.tsx` (empty History shows the empty state and no table; cards and 'Edit' stay, since CHG-021).

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

Not tested here, by design: saving an entry to the database with its recorder (FAM-11), paying pending costs (F0-12), and wiring to the database (FAM-10). The local Update form is tested here since CHG-020 (T-04 to T-06).

**HUMAN REVIEW: test expectation changed (CLAUDE.md §5), CHG-022.** Five assertions stated behaviour that PD-060 replaces, so they change:
- The screen is now three cards, not two.
- A row saved on Edit budget now says "Recorded by you" (twice: the screen test and `applyBudgetEdit`'s `recordedBy`).
- Adding funds now pays pending costs (twice: the screen test and `applyBudgetEdit`).

This is a recorded requirement change. The before and after for each is in DECISIONS.md FD-13. "Not tested here, by design: paying pending costs (F0-12)" below no longer holds: the Phase 1 simulation is tested here, and F0-12 still owns the real payment.

**HUMAN REVIEW: test expectation changed (CLAUDE.md §5), CHG-021.** The CHG-020 inline Update form's tests (`fecb598`: 'Update' opens a form in the Funds card, `aria-expanded`, focus back to 'Update', the "$500 added to NDIS." status, and `fund-update.test.ts`) assert a form the human replaced with the Edit budget page and a renamed 'Edit' button (PD-059). They are replaced by the new T-04 to T-06 and T-09 to T-12; the amount rules and the balance limit are kept. Recorded requirement change; before and after in DECISIONS.md FD-12.

**HUMAN REVIEW: test expectation changed (CLAUDE.md §5), CHG-020.** The 'Update' group's tests (pressing 'Update' says "Updating funds is not available yet." and changes nothing; axe after 'Update') assert FD-06's Phase 1 placeholder. CHG-020 (human-confirmed 2026-09-25) replaces the placeholder with the form, so those assertions are replaced by T-04 to T-06 and an axe check with the form open. Recorded requirement change; before and after in DECISIONS.md FD-11.

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

### Red run for CHG-020, before its implementation (2026-09-25)
`npx vitest run src/features/family-budget src/server/budget src/mocks/queries/budget.test.ts`: 5 of 6 files fail. **37 fail and 67 pass** in the four files that load; `fund-update.test.ts` fails at import (`./fund-update` does not exist yet), so its tests do not run.

| File | Failed / total | Red because |
|---|---|---|
| `family-budget.test.tsx` | 27 / 70 | No form named "Update funds" (the button still shows the FD-06 message and has no `aria-expanded`); no "Pending …" line on a card or "Pending" label in History; `getToday` is not read, so it is never called and a rejection does not give the error state. |
| `budget-data.test.ts` | 4 / 8 | The loader returns no `today` and does not call `getToday`. |
| `src/server/budget/queries.test.ts` | 5 / 17 | The summaries have no `pendingTotal` / `pendingCount`, and the fixtures have no pending cost. |
| `src/mocks/queries/budget.test.ts` | 1 / 9 | No pending cost in `FUND_ENTRIES`. |
| `fund-update.test.ts` | fails at import | `./fund-update` does not exist. |

The new tests that already pass are guards that the implementation must keep green: the live region starts empty (kept from FD-06), a bucket without pending costs has no pending line, the pending row keeps three cells and its "Recorded by" line, axe with pending data, the loader passes pending fields through, a pending cost does not lower Government's $240, and "a pending entry is always an expense" (true for now only because no pending entries exist). No test was skipped, marked `.only`, or deleted to get here. Changed test expectations: DECISIONS.md FD-11.

### Red run for CHG-021, before its implementation (2026-09-25)
`npx vitest run src/features/family-budget src/features/family-home src/server/budget src/mocks/queries/budget.test.ts`: 5 of 15 files fail, **9 tests fail and 183 pass** in the files that load. `family-budget.test.tsx` fails at import (`budget/layout`, `budget/edit/page` and `budget/edit/loading` do not exist yet), and so does `budget-edit.test.ts` (`./budget-edit` does not exist yet), so their tests do not run. To check each test fails for the right reason, those four modules were stubbed for one run and the stubs deleted before the commit (never committed): a layout that renders its children, an Edit page and loading that render a placeholder, and `budget-edit` functions that throw. With the stubs, **151 fail and 229 pass**, across 380 tests.

| File | Failed / total (stubbed run) | Red because |
|---|---|---|
| `family-budget.test.tsx` | 73 / 119 | There is no 'Edit' link on Budget (66 tests stop at it). The rest fail because Budget has no "Choose ‘Edit’ to add a bucket." line, the Edit page has no error state, loading status or contract read, and the cards are keyed by index, so a swap re-creates them. The 46 that pass are the unchanged AC-01 to AC-03, pending, History, states and long-content tests, now rendered through the layout harness. |
| `budget-edit.test.ts` | 69 / 69 | `editValuesFor`, `nameSuggestions`, `validateBudgetEdit` and `applyBudgetEdit` are not built. |
| `src/features/family-home/budget-strip.test.tsx` | 1 / 15 | Home's tiles are keyed by index, kind and label, so swapping two buckets re-creates both tiles. |
| `src/server/budget/queries.test.ts` | 5 / 19 | Buckets have no `id` and fund entries have no `bucketId`. |
| `src/mocks/queries/budget.test.ts` | 3 / 10 | The fixture buckets have no `id` and the entries have no `bucketId`. |

No test was skipped, marked `.only`, or deleted to get green. `fund-update.test.ts` was deleted because CHG-021 replaces the module it tests; `budget-edit.test.ts` carries its amount and balance-limit cases forward. The changed test expectations are listed in DECISIONS.md FD-12. `tsc` is not clean on this commit: the tests use the CHG-021 types (`id`, optional `kind`, `bucketId`) before the types exist. That is part of the red state and is fixed in the build.

### Red run for CHG-022, before its implementation (2026-09-25)
`npx vitest run src/features/family-budget src/features/family-home src/server/budget src/mocks/queries/budget.test.ts src/types`: 4 files fail. In the files that load, **59 tests fail and 395 pass**. `budget-export.test.ts` fails at import because `./budget-export` does not exist yet. So it was run once against a stub whose two functions throw, and all 21 of its tests failed with "not built". The stub was then deleted and never committed.

| File | Failed / total | Red because |
|---|---|---|
| `family-budget.test.tsx` | 44 / 164 | There is no 'Pending costs' region, no button in any row, no dialog and no 'Export' button. A save still leaves the pending cost unpaid ($740, not $430) and gives the row no "Recorded by you". |
| `budget-edit.test.ts` | 13 / 87 | `applyBudgetEdit` does not pay pending costs, and does not set `recordedBy: "you"` or `note`. |
| `src/types/domain.test.ts` | 2 / 11 | `FundEntrySchema` strips `note` and `paidOn`, and so accepts any `paidOn`. |
| `budget-export.test.ts` | fails at import (21 / 21 with the stub) | `./budget-export` does not exist. |

Some of the new tests already pass. They are guards the build must keep green:
- In `budget-edit.test.ts`, the cases where nothing is paid: $50 is not enough; the older cost does not fit; the bucket is overspent; only funds added pay. Also: no note gives no `note`, old rows are untouched, and the inputs are not mutated.
- The schema still accepts entries without the new fields.
- The error state has no Pending costs section and no Export.
- With no History rows there is no Export.
- axe on the screen, which has no section yet.

No test was skipped, marked `.only` or deleted. `tsc` is not clean on this commit, because the tests use `note`, `paidOn` and `./budget-export` before they exist. That is part of the red state and the build fixes it. eslint on the touched folders reports 0 problems, and prettier is clean.

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

### After CHG-021 implementation (2026-09-25)
**CI is down, so every check below ran locally.** No test was changed, skipped, marked `.only` or deleted after the CHG-021 red run; the six test and showcase files given ids only are listed in FD-12.

- `npx vitest run src/features/family-budget src/features/family-home src/server/budget src/mocks/queries/budget.test.ts`: 15 files, **380 of 380 pass**. Every AC (AC-01 to AC-12) has passing tests with its tag.
- `npx vitest run src tests/unit`: 110 files, **1480 of 1480 pass**.
- `npx tsc --noEmit`: clean. `npx eslint .`: 0 errors, the same 3 warnings as before, none in this feature's files. `npx prettier --check .`: clean.
- `next build`: succeeds; `/family/[clientId]/budget` and `/family/[clientId]/budget/edit` are dynamic routes.
- Playwright e2e on the production build (`next start` on :3100, because a dev server held :3000), `--grep-invert "F0-07"`: **36 of 36 pass**. The two `[F0-15]` header tests at 480px and 338px passed this time, which fits the flakiness recorded above; still flag them for the shell owner.
- `supabase test db`: not run. This feature changes no migration or SQL.

**Real-browser width sweep** (Playwright, Chromium against the dev server on :3000; the Chrome extension was not connected). The widths were 1920, 1600, 1440, 1280, 1152, 1024, 900, 800 and 768. At each one the sweep measured horizontal page scroll, overlap between any two visible text boxes, text past the viewport, and clipped overflow. Screenshots at 1920, 1280 and 768 were checked by eye.
- Budget, Edit budget and Home with the fixtures: no page scroll, no overlap, nothing off screen, at every width.
- The Edit budget stress case had unique 40-character names on every bucket, `9999999999.99` in every amount, and a new bucket and a note. It was clean at every width, and so was the same page with every field in error (the error messages sit under their fields).
- Saving that stress case gave a four-bucket Budget with `$10,000,014,879.99` cards, 40-character labels and four `+$9,999,999,999.99` History rows. It was clean at every width, including 768, where the cards sit two across and pending stays on its own line.

### After CHG-022 implementation (2026-09-25)
**CI is down, so every check below ran locally.** No test was changed, skipped, marked `.only` or deleted after the CHG-022 red run.

- `npx vitest run src/features/family-budget src/features/family-home src/server/budget src/mocks/queries/budget.test.ts src/types`: 17 files, **474 pass, 1 fails**. The failure is a test bug, not the build (below). AC-13 to AC-16 have every tagged test passing, and AC-17 all but that one.
- `npx vitest run src tests/unit`: **1565 pass, 2 fail**. The same export test, plus `[FAM-UI-07][AC-05]` tasks paging (`src/app/(family)/family/[clientId]/tasks/page.test.tsx`), which timed out at 7.4s under the full run's load and passes alone (28 of 28). That file is FAM-UI-07's, and this branch does not touch it.
- `npx tsc --noEmit`: clean. `npx eslint .`: 0 errors, the same 3 warnings as before, none in this feature's files. `npx prettier --check .`: clean.
- `next build`: succeeds.
- Playwright e2e on the production build (`next start`), `--grep-invert "F0-07"`: **35 of 36 pass**. `[F0-15][PRD] keeps header text inside the header bar … at 338px` failed. That is the shell flake recorded above, and this branch does not touch the shell. A first run had reused a `next dev` server left on :3000 and failed 11 calendar and event-form tests. Those tests passed once the run used the production build.
- `supabase test db`: not run. This feature changes no migration or SQL.

**The test bug (fixed after the human chose the fix, FD-13).** `budget-export.test.ts`, "[FAM-UI-05][AC-17] a field with a comma, a double quote or a line break is quoted, with quotes doubled (RFC 4180)". The failing assertion is `lineOf({ note: "Line one\r\nLine two" })`. `lineOf` splits the file on CRLF and expects exactly one line. A correctly quoted field with an embedded CRLF holds a CRLF itself, so the split gives two pieces and `toHaveLength(1)` fails before the `toContain` runs. The CSV is right, `…,"Line one\r\nLine two"\r\n`, and no build can pass this assertion without breaking RFC 4180. The `\n` case on the line above passes. The human chose to assert on the whole file instead: `toContain(',"Line one\r\nLine two"\r\n')`. The feature suites then passed **475 of 475**.

**Real-browser width sweep** (Playwright, Chromium against the dev server on :3000). The widths were 1920, 1600, 1440, 1280, 1152, 1024, 900, 800 and 768. The checks were the same as for CHG-021, plus lines hidden by a two-line cut, which do not count as overlap. At every width the details dialog was opened from a pending row and from a History row, checked, and closed with Escape. Screenshots at 1920, 1280 and 768, and of the dialog at 1920 and 768, were checked by eye.
- The fixtures had Pending costs with Margaret's $310 Physiotherapy cost, the Export button and both dialogs. All were clean at every width.
- Stress names had every bucket renamed to a unique 40-character name and a 200-character note, with no money added, so the cost stays pending. Edit budget and the saved Budget were clean at every width. At 768 the pending table's Bucket cell is cut at two lines with the full name in `title`, and the dialog shows the full name.
- Stress amounts added `9999999999.99` to every bucket, with a 140-character note. Edit budget and the saved Budget were clean at every width. The save paid the pending cost: Pending costs read "No pending costs.", and the Physiotherapy details read "Status: Paid on 30 Nov 2026". The three `+$9,999,999,999.99` rows keep their amount on one line at 768, and their long description, which is the note, is cut at two lines.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
