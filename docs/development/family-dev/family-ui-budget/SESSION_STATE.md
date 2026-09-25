# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7; `family-dev` had not moved at the last check)
Worked on: CHG-021 step 2: the full local checks, the Playwright width sweep (1920 to 768) of Budget, Edit budget and Home, AC status (12 / 12 MET) and TEST_PLAN Results. Before that, the CHG-021 build (`b113411`), its tests written first, and CHG-020 (`fecb598`, `997ef7b`)
What changed: docs only this step (`ACCEPTANCE_CRITERIA.md` status column, `TEST_PLAN.md` Results, `PROGRESS.md`, this file). Code is in `b113411`, pushed.
Tests run: `npx vitest run src tests/unit`; `npx tsc --noEmit`; `npx eslint .`; `npx prettier --check .`; `next build`; Playwright e2e on the production build (`next start -p 3100`, a dev server held :3000) with `--grep-invert "F0-07"`; a Playwright width sweep with fixtures and a stress case
Test results: 1480 of 1480 unit (380 of 380 in the feature-related files); tsc, eslint (0 errors, 3 old warnings) and prettier clean; build succeeds; e2e 36 of 36 (the flaky `[F0-15]` 480/338px tests passed this time); sweep clean at every width. CI is down, so all of this ran locally.
Current blocker: None. READY FOR PR; waiting for the human's "yes" to open it.
Important discoveries:
- A very large History amount broke mid-number at 768px until the amount column's floor went from 7rem to 9rem (FD-10). Found only by the stress check in a real browser, so any change to the History columns needs that check again.
- The two `[F0-15]` shell e2e failures are not from this feature: same failure on a clean `origin/family-dev` build. The shell is not lane F's, so raise it with its owner rather than fix it here.
- Turbopack cannot build from a worktree whose `node_modules` is a symlink; clone it instead (`cp -cR` on APFS).
- The PRD's "DataTable" and the design's card are met by local components (FD-03, FD-01), and the design does not draw the "Recorded by" line (FD-05): all flagged for the PR.
Important decisions: FD-01 to FD-10 in DECISIONS.md (FD-10 new: History column sizes); CHG-019 in root DECISIONS.md
Exact next action: on the human's "yes", open the PR `FAM-UI-05 Family Budget screen (UI)` to `family-dev`. The body follows `docs/DEVELOPMENT_WORKFLOW.md` §8, takes its flags from PROGRESS.md "Ready for PR", says CI is down so the checks ran locally, and has no AI attribution. Before opening, `git fetch` and check that `origin/family-dev` is still an ancestor; if it has moved, merge it and re-run the checks.
Files likely to be touched next: none, unless PR review asks for changes.
Warning for next session: do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs (CLAUDE.md §8, memory). Do not open the PR without the human's "yes". Do not change the tests to get green: they are the spec (CLAUDE.md §5); if one looks wrong, stop and ask.

## Preview
`http://localhost:3000/family/client-margaret/budget` on the dev server (`npm run dev`). The bare origin is the component showcase, not this screen.
