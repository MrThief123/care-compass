# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7; `family-dev` had not moved at the last check)
Worked on: FAM-UI-05 implementation: CHG-019 contract read and fixtures, formatters and data loader, the screen and its states, the route, then the local checks, the real-browser and width check, and the docs
What changed: see PROGRESS.md "Files changed". Code commits `68e7e9c`, `8732005`, `7ecd0c2`, `4cc8aec`; the docs commit follows them.
Tests run: `npx vitest run src/features/family-budget src/server/budget src/mocks/queries/budget.test.ts`; `npx vitest run src tests/unit`; `npx tsc --noEmit`; `npx eslint .`; `npx prettier --check .`; `next build`; Playwright e2e on the production build with `--grep-invert "F0-07"`
Test results: 92 of 92 feature tests pass; 1270 of 1270 in the full unit run; tsc, eslint (0 errors) and prettier clean; e2e 34 pass and 2 fail (`[F0-15]` header at 480px and 338px on Home, which also fail on a clean `origin/family-dev`, see TEST_PLAN.md Results). CI is down, so all of this ran locally.
Current blocker: None. CHG-020 (2026-09-25) grew the scope: the Update form and the pending display, AC-04 to AC-08. The docs are recorded; waiting for the human to review them before any code. `origin/family-dev` merged in (commit c7a5021; DECISIONS.md conflict CHG-018/CHG-019 resolved by keeping both).
Important discoveries:
- A very large History amount broke mid-number at 768px until the amount column's floor went from 7rem to 9rem (FD-10). Found only by the stress check in a real browser, so any change to the History columns needs that check again.
- The two `[F0-15]` shell e2e failures are not from this feature: same failure on a clean `origin/family-dev` build. The shell is not lane F's, so raise it with its owner rather than fix it here.
- Turbopack cannot build from a worktree whose `node_modules` is a symlink; clone it instead (`cp -cR` on APFS).
- The PRD's "DataTable" and the design's card are met by local components (FD-03, FD-01), and the design does not draw the "Recorded by" line (FD-05): all flagged for the PR.
Important decisions: FD-01 to FD-10 in DECISIONS.md (FD-10 new: History column sizes); CHG-019 in root DECISIONS.md
Exact next action: after the human reviews the CHG-020 docs, write T-04 to T-08 failing first (and replace the FD-06 'Update' tests, FD-11), run them red, commit `test(family): …`. Do not open the PR before the human's "yes".
Files likely to be touched next: `src/features/family-budget/**` (new update form, pending line on the tile, Pending label in History), `src/types/domain.ts`, `src/server/budget/queries.ts`, `src/mocks/fixtures.ts`, `src/mocks/queries/budget.ts` (pending fields, extended per CHG-002).
Warning for next session: do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs (CLAUDE.md §8, memory). Do not open the PR without the human's "yes". Do not change the tests to get green: they are the spec (CLAUDE.md §5); if one looks wrong, stop and ask.

## Preview
`http://localhost:3000/family/client-margaret/budget` on the dev server (`npm run dev`). The bare origin is the component showcase, not this screen.
