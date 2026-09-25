# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7; `family-dev` had not moved at the last check)
Worked on: CHG-021 build (step 1), committed (`feat(family)`), with ids on the six test/showcase literals and the built fields recorded in FD-12; before that, CHG-021 tests written first and run red (`test(family)` commit); before that, CHG-020 tests (`fecb598`) and build (`997ef7b`); then, after the human's review of the inline form, CHG-021 recorded (PD-059, FD-12): 'Edit' opens an Edit budget page; buckets are open (add, rename, remove)
What changed: see PROGRESS.md "Files changed". Code commits `68e7e9c`, `8732005`, `7ecd0c2`, `4cc8aec`; the docs commit follows them.
Tests run: `npx vitest run src/features/family-budget src/server/budget src/mocks/queries/budget.test.ts`; `npx vitest run src tests/unit`; `npx tsc --noEmit`; `npx eslint .`; `npx prettier --check .`; `next build`; Playwright e2e on the production build with `--grep-invert "F0-07"`
Test results: 92 of 92 feature tests pass; 1270 of 1270 in the full unit run; tsc, eslint (0 errors) and prettier clean; e2e 34 pass and 2 fail (`[F0-15]` header at 480px and 338px on Home, which also fail on a clean `origin/family-dev`, see TEST_PLAN.md Results). CI is down, so all of this ran locally.
Current blocker: None. Waiting for the human's go-ahead on step 2.
Important discoveries:
- A very large History amount broke mid-number at 768px until the amount column's floor went from 7rem to 9rem (FD-10). Found only by the stress check in a real browser, so any change to the History columns needs that check again.
- The two `[F0-15]` shell e2e failures are not from this feature: same failure on a clean `origin/family-dev` build. The shell is not lane F's, so raise it with its owner rather than fix it here.
- Turbopack cannot build from a worktree whose `node_modules` is a symlink; clone it instead (`cp -cR` on APFS).
- The PRD's "DataTable" and the design's card are met by local components (FD-03, FD-01), and the design does not draw the "Recorded by" line (FD-05): all flagged for the PR.
Important decisions: FD-01 to FD-10 in DECISIONS.md (FD-10 new: History column sizes); CHG-019 in root DECISIONS.md
Exact next action: Step 1 is committed. 808 of 808 tests pass across family-budget, family-home, server, mocks and shared components; `npx tsc --noEmit` is clean (stale `.next/dev/types` fixed with `npx next typegen`); eslint 0 errors (2 pre-existing import-order warnings in `src/app/page.tsx`); prettier clean. Step 2, once the human says go: full local suite (`npx vitest run src tests/unit`, `npx eslint .`, `npx prettier --check .`, `next build`, e2e with `--grep-invert "F0-07"`), then a real-browser width sweep, 1920 to 768, of Budget, Edit budget and Home, then update AC status and TEST_PLAN Results.
Files likely to be touched next: `src/features/family-budget/**` (Edit budget page, local holder; `update-funds.tsx` and `fund-update.ts` replaced), `src/app/(family)/family/[clientId]/budget/` (`layout.tsx`, `edit/page.tsx`), `src/types/domain.ts`, `src/server/budget/queries.ts`, `src/mocks/fixtures.ts`, `src/mocks/queries/budget.ts` (bucket `id`, optional `kind`, `bucketId`), `src/features/family-home/**` (tiles keyed by `id`).
Warning for next session: do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs (CLAUDE.md §8, memory). Do not open the PR without the human's "yes". Do not change the tests to get green: they are the spec (CLAUDE.md §5); if one looks wrong, stop and ask.

## Preview
`http://localhost:3000/family/client-margaret/budget` on the dev server (`npm run dev`). The bare origin is the component showcase, not this screen.
