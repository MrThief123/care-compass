# Session State — FAM-UI-05 Family Budget screen (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-budget` (from `origin/family-dev` at 02c7fa7)
Worked on: FAM-UI-05 tests-first: claim, the CHG-019 decision (History contract read and design fixtures), feature DECISIONS.md FD-01 to FD-09, TEST_PLAN.md, and five test files
What changed: see PROGRESS.md "Files changed". No production code.
Tests run: `npx vitest run src/features/family-budget src/server/budget src/mocks/queries/budget.test.ts` (red run); one throwaway copy of the screen test with `loading` stubbed, to see its per-test red state, deleted before commit
Test results: 84 tests written. 11 fail, 6 pass, 67 fail at import (missing modules). Red for the right reasons (TEST_PLAN.md Results).
Current blocker: None. Paused for the human's greenlight to implement.
Important discoveries:
- The History table has no contract read and no design fixtures. Added on this branch as CHG-019, human-confirmed 2026-09-25.
- PD-034 (History shows who recorded each entry) conflicts with the design, which draws date, description and amount only. Recorded as FD-05, a human decision. The default follows the design and the tests assert it.
- Home's `BudgetBucketTile` already draws the design's bucket card, so this screen reuses it (FD-01) rather than the kit's `BudgetBucketCard`.
- Vite fails a test file at load if it imports a module that does not exist, even through a dynamic `import()`.
Important decisions: FD-01 to FD-09 in DECISIONS.md; CHG-019 in root DECISIONS.md
Exact next action: wait for the human's greenlight. Then read the Next.js docs (CLAUDE.md §14) and implement in this order: `getFundHistory` and fixtures, `budget-format.ts`, `budget-data.ts`, the view components, `page.tsx` and `loading.tsx`. Run the red tests to green. Then the full local checks and the real-browser check.
Files likely to be touched next: `src/app/(family)/family/[clientId]/budget/page.tsx`, `src/app/(family)/family/[clientId]/budget/loading.tsx`, `src/features/family-budget/*`, `src/server/budget/queries.ts`, `src/mocks/queries/budget.ts`, `src/mocks/fixtures.ts`
Warning for next session: do not implement before the human's greenlight. Do not stage `.claude/settings.json` (unrelated, always dirty). Do not run the F0-07 auth e2e specs against the hosted project (`--grep-invert "F0-07"`). No AI-attribution lines in commits or PRs. Do not open the PR without the human's "yes".
