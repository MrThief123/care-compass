# Session State — F0-15 Role app shell: rail, header and layouts

Last session date: 2026-09-18
Current branch: `feature/shared-app-shell`
Worked on: Full implementation — Rail, RailNav, PageHeader, ScreenTitle, nav-config, three role layouts, 14 placeholder route pages, new `clients`/`auth` server contracts.
What changed: see PROGRESS.md "Files changed".
Tests run: `npx vitest run` (107/107 pass, repo-wide), `npx eslint .` (0 errors), `npx tsc --noEmit` (clean), `npx prettier --check .` (clean), `npx playwright test tests/e2e/shared-app-shell.spec.ts` (1/1 pass, against `next dev`).
Test results: all 6 ACs MET.
Current blocker: none for merging the code; two items need human review before PR (see below).
Important discoveries:
- `npm run pretest:e2e` (`next build`) fails for **any** route under a role layout, because `src/mocks/current-user.ts`'s production-safety guard throws when `NODE_ENV=production` during static prerender. This will block e2e for every future dashboard feature, not just F0-15 — see DECISIONS.md FD-03.
- Margaret's fixture (`src/mocks/fixtures.ts`, UI-00) computes to 75 years / Ringwood, not the Figma mockup's 78 years / Preston VIC that AC-01's literal example text uses — see DECISIONS.md FD-02.
Important decisions: FD-01 (authored `src/server/clients/**` and `src/server/auth/**`, no prior owner), FD-02, FD-03 — all in DECISIONS.md.
Exact next action: human review of FD-02/FD-03, then push (already pushed) and open PR to `main` once approved (CLAUDE.md §8).
Files likely to be touched next: none for F0-15 itself; FD-03's fix (if any) likely touches `playwright.config.ts` / `package.json` / `src/mocks/current-user.ts`, owned by other features.
Warning for next session: do not open the PR without explicit human approval.
