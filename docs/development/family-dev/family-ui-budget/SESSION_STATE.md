# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7; `family-dev` had not moved at the last check)
Worked on: CHG-022 tests written first (T-13 to T-17) and run red; FD-13 recorded; CHG-022's impact line corrected (five assertions change, not none). Before that, CHG-022 recorded (PD-060, `359e64b`).
What changed: tests only, plus docs. Tests: `budget-edit.test.ts` (2 new groups, 2 changed assertions), `family-budget.test.tsx` (6 new groups, 3 changed tests, CHG-022 helpers), new `budget-export.test.ts`, `src/types/domain.test.ts` (CHG-022 group). Docs: root DECISIONS.md (CHG-022 impact line), feature DECISIONS.md FD-13, TEST_PLAN.md, PROGRESS.md, this file.
Tests run: `npx vitest run src/features/family-budget src/features/family-home src/server/budget src/mocks/queries/budget.test.ts src/types`; `budget-export.test.ts` once against a throwaway stub (deleted); `tsc --noEmit`; eslint and prettier on the touched folders.
Test results: red as expected. 59 fail and 395 pass, and `budget-export.test.ts` fails at import (21 of 21 fail against the stub). `tsc` errors only on the not-yet-built `note`, `paidOn` and `./budget-export`. eslint reports 0 problems and prettier is clean.
Current blocker: None. Waiting on the human's go-ahead to build CHG-022.
Important discoveries:
- A very large History amount broke mid-number at 768px until the amount column's floor went from 7rem to 9rem (FD-10). Found only by the stress check in a real browser, so any change to the History columns needs that check again.
- The two `[F0-15]` shell e2e failures are not from this feature: same failure on a clean `origin/family-dev` build. The shell is not lane F's, so raise it with its owner rather than fix it here.
- Turbopack cannot build from a worktree whose `node_modules` is a symlink; clone it instead (`cp -cR` on APFS).
- The PRD's "DataTable" and the design's card are met by local components (FD-03, FD-01), and the design does not draw the "Recorded by" line (FD-05): all flagged for the PR.
Important decisions: FD-01 to FD-13 in DECISIONS.md (FD-13 new: CHG-022 fields and defaults, and the five changed assertions); CHG-019 to CHG-022 and PD-060 in root DECISIONS.md
Exact next action: build CHG-022 until the tests pass, without changing them.
1. `src/types/domain.ts`: `FundEntrySchema` gains `note` (optional string) and `paidOn` (optional ISO-date string).
2. `budget-edit.ts` `applyBudgetEdit`:
   - Rows get `recordedBy: "you"`, and `note` when the save has a note.
   - After funds are added to a bucket, pay its pending costs from `state.history`. Go oldest by date; on the same day, the one lower in History goes first. Pay each whole while `remaining` covers it, and stop at the first that doesn't.
   - A paid cost moves to `used` in cents, and `pendingTotal` and `pendingCount` go down. Its row loses `pending` and gains `paidOn`, with no new row.
3. New `budget-export.ts`: `budgetHistoryCsv(entries, buckets)` and `budgetHistoryFileName(today)`, as FD-13 says.
4. `family-budget-view.tsx`: a 'Pending costs' section (h2, region, a table named 'Pending costs' with Date, Bucket, Description and Amount, or 'No pending costs.') between the Funds and History cards. An 'Export' button in the History card header that downloads a BOM + CSV Blob through a temporary link and revokes the URL.
5. `history-table.tsx`: the description is a button (named by the description), and clicking the row opens it.
6. A modal details dialog: a description list, Close, Escape, and focus back to the row's button. It is undesigned, so follow ConfirmationModal's focus pattern locally; `src/components/shared` is not lane F's.
7. Then the full local checks, the width sweep 1920 to 768 with the stress case, and update the docs.
Files likely to be touched next: `src/types/domain.ts`; `src/features/family-budget/budget-edit.ts`, `budget-export.ts` (new), `family-budget-view.tsx`, `history-table.tsx`, a new pending-costs table and details dialog, `budget-skeleton.tsx` (a third card).
Warning for next session: do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs (CLAUDE.md §8, memory). Do not open the PR without the human's "yes". Do not change the tests to get green: they are the spec (CLAUDE.md §5); if one looks wrong, stop and ask.

## Preview
`http://localhost:3000/family/client-margaret/budget` on the dev server (`npm run dev`). The bare origin is the component showcase, not this screen.
