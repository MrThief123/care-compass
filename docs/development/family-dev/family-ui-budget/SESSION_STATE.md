# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7; `family-dev` had not moved at the last check)
Worked on: CHG-022 recorded (PD-060) after the human's review: a Pending costs section, entry details dialog, "Recorded by you" and the kept note, paying pending costs (strictly oldest first, whole) when funds are added, and History export as CSV. Before that, CHG-021 built (`b113411`) and checked (`1a29a9e`).
What changed: docs only (root DECISIONS.md PD-060 and CHG-022; PRD.md REQ-29, REQ-37; DEVELOPMENT_PLAN.md totals and notes; feature PRD.md, ACCEPTANCE_CRITERIA.md AC-13 to AC-17, PROGRESS.md, this file).
Tests run: none this step (docs only). CHG-021's checks stand: 1480 of 1480 unit, e2e 36 of 36, sweep clean.
Test results: n/a this step.
Current blocker: None. IN PROGRESS (CHG-022).
Important discoveries:
- A very large History amount broke mid-number at 768px until the amount column's floor went from 7rem to 9rem (FD-10). Found only by the stress check in a real browser, so any change to the History columns needs that check again.
- The two `[F0-15]` shell e2e failures are not from this feature: same failure on a clean `origin/family-dev` build. The shell is not lane F's, so raise it with its owner rather than fix it here.
- Turbopack cannot build from a worktree whose `node_modules` is a symlink; clone it instead (`cp -cR` on APFS).
- The PRD's "DataTable" and the design's card are met by local components (FD-03, FD-01), and the design does not draw the "Recorded by" line (FD-05): all flagged for the PR.
Important decisions: FD-01 to FD-10 in DECISIONS.md (FD-10 new: History column sizes); CHG-019 in root DECISIONS.md
Exact next action: write the CHG-022 tests first (TEST_PLAN.md T-13 to T-17, test titles `[FAM-UI-05][AC-13]` to `[AC-17]`): the pending section and its empty line; paying pending costs in `applyBudgetEdit` (pays whole, oldest first, stops at the first that does not fit, `paidOn` set, bucket remaining and pending totals updated); the details dialog (click, Enter, Space, Escape, focus return); `recordedBy: "you"` and `note` on every row of a save; the CSV builder (header, order, plain amounts, formula neutralising, file name) and the Export button absent with no rows. New optional FundEntry fields `note` and `paidOn` (record in feature DECISIONS.md as FD-13). Run red, record in TEST_PLAN Results, commit `test(family): …`, then ask the human before building.
Files likely to be touched next: `src/types/domain.ts` (FundEntry `note`, `paidOn`); `src/features/family-budget/` (budget-edit.ts, history-table.tsx, family-budget-view.tsx, new pending section, details dialog, CSV export and their tests); `src/mocks/**` tests if the fixture contract test needs the new fields.
Warning for next session: do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs (CLAUDE.md §8, memory). Do not open the PR without the human's "yes". Do not change the tests to get green: they are the spec (CLAUDE.md §5); if one looks wrong, stop and ask.

## Preview
`http://localhost:3000/family/client-margaret/budget` on the dev server (`npm run dev`). The bare origin is the component showcase, not this screen.
