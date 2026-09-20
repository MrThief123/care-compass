# Session State — FAM-UI-01 Family Home screen (UI)

Last session date: 2026-09-20
Current branch: `feature/family-ui-home` (from `origin/family-dev`; upstream `origin/feature/family-ui-home`; `origin/fix/shared-app-shell-nav-header` merged in, 3a8978a, FD-22; `origin/family-dev` merged in after the sync #56, cd02d17)
Worked on: FAM-UI-01 rework so Home works for real, growing data at every width (tests first)
What changed: local `TodayTimeline` (at-rest details, stacking), per-status loader (Recent activity right for any log size), Overdue total and "View all N overdue", link rows with two-line titles, Budget tile (cents, any count, overspend), three-letter dates, responsive grid (stack under 1280px; cards side by side from 1024px). Details in PROGRESS.md and DECISIONS.md FD-13 to FD-21.
Tests run: `npx vitest run src` (65 files / 544 pass); plain `npx vitest run` (68 files pass, 1 baseline failure, 550 tests pass); lint (0 errors, 23 pre-existing warnings); typecheck; format:check; a Playwright width sweep 1920 to 375 on the mock route and a throwaway long-fixture preview.
Test results: all green except the known baseline `tests/integration/shared-supabase-environment.test.ts` (throws at import: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). After merging `origin/family-dev` (cd02d17) and `npm ci` (`@types/node` 26.5.1, `@testing-library/react` 16.3.3): typecheck, lint (0 errors, 23 warnings) and format:check clean; `vitest run src` 65 files / 544 pass; plain `vitest run` 67 of 69 files pass, the two failures being that baseline and `tests/integration/mocks-import-boundary.test.ts` timing out at 5 s under load (passes alone, 3 of 3).
Current blocker: None. PR #54 is merged to `family-dev` (2026-09-20).
Important discoveries:
- An unfiltered `getTaskLog` page one is wrong for Recent activity when the newest 20 rows are planned or the history is long; the loader now asks per status (FD-16).
- The shared header overflowed the page at 375px (not this feature's); the shared shell fix merged here (FD-22) removes it, and the rail is now sticky.
- The kit `formatShortDate` writes "Sept" and `formatMoney` drops cents; local formatters cover both (FD-13).
Important decisions: FD-13 to FD-21; the human answered UI-04's FD-04 ("Doesn't matter") and FD-05 ("Based off time they were created in calendar") on 2026-09-20 (FD-19).
Exact next action: none. The feature is merged. The DECISIONS.md "HUMAN REVIEW summary" items (FD-14 stacking and hour label colour, FD-15 title/name truncation rule, FD-16 which five overdue, FD-18 breakpoints, FD-21 test changes) stay recorded for the design owner.
Files likely to be touched next: none for the feature, unless review asks for changes.
Warning for next session: the feature is merged (#54); do not restart it. Do not edit `src/components/**`, `src/mocks/**`, `src/server/**`, `src/lib/**`, `src/types/**` or the family `layout.tsx` from this feature; raise kit changes as shared PRs (FD-05, FD-13, FD-15, FD-17). Task log and task detail routes exist only on the FAM-UI-07 branch, so Home's `/tasks` links 404 in isolation (FD-11). Scratch scripts and screenshots were in `/tmp` and are not committed.
