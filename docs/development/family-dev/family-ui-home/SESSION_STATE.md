# Session State — FAM-UI-01 Family Home screen (UI)

Last session date: 2026-09-20
Current branch: `feature/family-ui-home` (from `origin/family-dev`; upstream `origin/feature/family-ui-home`; `origin/fix/shared-app-shell-nav-header` merged in, 3a8978a, FD-22)
Worked on: FAM-UI-01 rework so Home works for real, growing data at every width (tests first)
What changed: local `TodayTimeline` (at-rest details, stacking), per-status loader (Recent activity right for any log size), Overdue total and "View all N overdue", link rows with two-line titles, Budget tile (cents, any count, overspend), three-letter dates, responsive grid (stack under 1280px; cards side by side from 1024px). Details in PROGRESS.md and DECISIONS.md FD-13 to FD-21.
Tests run: `npx vitest run src` (65 files / 544 pass); plain `npx vitest run` (68 files pass, 1 baseline failure, 550 tests pass); lint (0 errors, 23 pre-existing warnings); typecheck; format:check; a Playwright width sweep 1920 to 375 on the mock route and a throwaway long-fixture preview.
Test results: all green except the known baseline `tests/integration/shared-supabase-environment.test.ts` (throws at import: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
Current blocker: None. READY FOR PR, waiting for explicit human approval; the PR has not been opened.
Important discoveries:
- An unfiltered `getTaskLog` page one is wrong for Recent activity when the newest 20 rows are planned or the history is long; the loader now asks per status (FD-16).
- The shared header overflowed the page at 375px (not this feature's); the shared shell fix merged here (FD-22) removes it, and the rail is now sticky.
- The kit `formatShortDate` writes "Sept" and `formatMoney` drops cents; local formatters cover both (FD-13).
Important decisions: FD-13 to FD-21; the human answered UI-04's FD-04 ("Doesn't matter") and FD-05 ("Based off time they were created in calendar") on 2026-09-20 (FD-19).
Exact next action: human reviews the DECISIONS.md "HUMAN REVIEW summary" (FD-14 stacking and hour label colour, FD-15 title/name truncation rule, FD-16 which five overdue, FD-18 breakpoints, FD-21 test changes). On explicit approval: set PROGRESS.md and this file to `PR OPEN`, commit `docs(family-ui-home): ...`, push, open the PR to `family-dev` titled `FAM-UI-01 Family Home screen (UI)` (UI-04 to `main` first, or note its commits are in the diff), with a side-by-side screenshot.
Files likely to be touched next: none for the feature; only PROGRESS.md / SESSION_STATE.md when the PR opens, or fixes if review asks for changes.
Warning for next session: do not open the PR without approval. Do not edit `src/components/**`, `src/mocks/**`, `src/server/**`, `src/lib/**`, `src/types/**` or the family `layout.tsx` from this feature; raise kit changes as shared PRs (FD-05, FD-13, FD-15, FD-17). Task log and task detail routes exist only on the FAM-UI-07 branch, so Home's `/tasks` links 404 in isolation (FD-11). Scratch scripts and screenshots were in `/tmp` and are not committed.
