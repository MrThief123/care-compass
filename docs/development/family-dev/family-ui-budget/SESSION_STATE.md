# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7; `family-dev` had not moved at the last check)
Worked on: CHG-022 built (`36131f8`), then the full local checks and the width sweep. Before that: CHG-022 tests written first and run red (`ed458c7`).
What changed:
- Code: `src/types/domain.ts`.
- `src/features/family-budget/`, changed: `budget-edit.ts`, `family-budget-view.tsx`, `history-table.tsx`, `budget-skeleton.tsx`.
- `src/features/family-budget/`, new: `budget-export.ts`, `entry-row.tsx`, `entry-details-dialog.tsx`, `pending-costs-table.tsx`.
- Docs: FD-13 (as built), TEST_PLAN.md, PROGRESS.md, this file.
- No test changed.
Tests run: the feature-related suites, the full unit run, `tsc --noEmit`, `eslint .`, `prettier --check .`, `next build`, Playwright e2e on the production build (`--grep-invert "F0-07"`), and a Playwright width sweep against the dev server (1920 to 768, the fixtures and two stress cases, with both details dialogs).
Test results:
- The feature suites pass 474 of 475, and the full unit run passes 1565 of 1567. The failures are the export test bug and a FAM-UI-07 paging timeout under load, which passes alone.
- tsc and prettier are clean, and eslint has 0 errors.
- The build succeeds. e2e passes 35 of 36; the one failure is the `[F0-15]` 338px flake.
- The sweep is clean.
Current blocker: waiting on the human about one test bug. `budget-export.test.ts`, "a field with a comma, a double quote or a line break is quoted…": its CRLF-note case splits the file on CRLF and expects one line, which a correct RFC 4180 CSV can never give. Proposed fix, and the question itself: PROGRESS.md "In progress".
Important discoveries:
- A very large History amount broke mid-number at 768px until the amount column's floor went from 7rem to 9rem (FD-10). Found only by the stress check in a real browser, so any change to the History columns needs that check again.
- Playwright reuses any server already on :3000. If a `next dev` preview is running, e2e runs against it, and 11 calendar and event-form tests fail. Stop the dev server before e2e, or check `lsof -iTCP:3000`.
- The two `[F0-15]` shell e2e failures are not from this feature: same failure on a clean `origin/family-dev` build. The shell is not lane F's, so raise it with its owner rather than fix it here.
- Turbopack cannot build from a worktree whose `node_modules` is a symlink; clone it instead (`cp -cR` on APFS).
- The PRD's "DataTable" and the design's card are met by local components (FD-03, FD-01), and the design does not draw the "Recorded by" line (FD-05): all flagged for the PR.
Important decisions: FD-01 to FD-13 in DECISIONS.md (FD-13 new: CHG-022 fields and defaults, and the five changed assertions); CHG-019 to CHG-022 and PD-060 in root DECISIONS.md
Exact next action: act on the human's answer about the export test bug.
- If they accept the proposed fix, change only that assertion in `budget-export.test.ts`, and record it in FD-13 (before, after, reason) and under HUMAN REVIEW in PROGRESS.md. Then re-run `npx vitest run src/features/family-budget` and mark AC-17 MET.
- Then commit `test(family): …` and the docs, push, and ask for the "yes" to open the PR.
Files likely to be touched next: `src/features/family-budget/budget-export.test.ts`, and the feature docs.
Warning for next session: do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs (CLAUDE.md §8, memory). Do not open the PR without the human's "yes". Do not change the tests to get green: they are the spec (CLAUDE.md §5); if one looks wrong, stop and ask.

## Preview
`http://localhost:3000/family/client-margaret/budget` on the dev server (`npm run dev`). The bare origin is the component showcase, not this screen.
