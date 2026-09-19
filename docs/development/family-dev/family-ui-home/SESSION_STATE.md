# Session State — FAM-UI-01 Family Home screen (UI)

Last session date: 2026-09-19
Current branch: `feature/family-ui-home` (from `origin/family-dev`; upstream `origin/feature/family-ui-home`)
Worked on: FAM-UI-01, all six ACs, tests first
What changed: Family Home route, `src/features/family-home/` (view, panels, data loader and selectors, routes, states), tests, and the feature docs. Details in PROGRESS.md "Files changed".
Tests run: `npx vitest run src/features/family-home` (31 pass); `npx vitest run src` (51 files / 318 pass); plain `npx vitest run` (only the known integration file fails); `npm run lint` (0 errors, 23 pre-existing warnings); `npm run typecheck`; `npm run format:check`; `next build` with inline dummy Supabase env; headless-browser comparison with `family-01-home.png`.
Test results: all green except the known baseline failure `tests/integration/shared-supabase-environment.test.ts` (throws at import: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from `src/lib/env.ts`), which is not this feature's and was not touched.
Current blocker: None. Status is READY FOR PR, waiting for explicit human approval; the PR has not been opened.
Important discoveries:
- The app's mock fixtures do not contain the design's Home data, so the running app shows different content from the design (DECISIONS.md FD-08). Tests use test-local fixtures.
- Shared kit components differ from the design (DECISIONS.md FD-09), notably the `DayTimeline` block layout: pill, assignee and duration are only on the hover card at these heights.
- `ActivityRow` lets a long carer name crush its row; worked around with a local `RecentActivityRow` (FD-06).
- PD-038 (full names) truncates titles in the 340px Recent activity rows (FD-01).
- Next.js 16.3: `error.js` receives `retry` (FD-07). `params` is a Promise.
- Home links to `/family/<id>/tasks` and `/tasks/<encoded key>`, which FAM-UI-07 builds; they 404 until both features are on `family-dev` (FD-11).
Important decisions: FD-01 to FD-12 in DECISIONS.md. OQ-29 ANSWERED and followed; OQ-24 OPEN, proposed default applied and flagged. No blocking OQ was touched or answered.
Exact next action: human reviews the DECISIONS.md "HUMAN REVIEW summary". On explicit approval: set PROGRESS.md and this file to `PR OPEN`, commit `docs(family-ui-home): ...`, push, then open the PR to `family-dev` titled `FAM-UI-01 Family Home screen (UI)` using `docs/DEVELOPMENT_WORKFLOW.md` §8, with a side-by-side screenshot.
Files likely to be touched next: none for the feature; only PROGRESS.md / SESSION_STATE.md when the PR opens, or fixes if review asks for changes.
Warning for next session: do not open the PR without approval. Do not edit `src/components/shared/**`, `src/mocks/**` or `src/app/(family)/family/[clientId]/layout.tsx` from this feature; raise kit changes as shared PRs (FD-05, FD-06, FD-09). Screenshots and the throwaway scripts are in `/tmp/fam-shot/` on the working machine and are not committed.

## Session 2026-09-20 (rework for real-world volumes) - running notes
- M0 done and pushed (a29df9f): red tests committed with three empty stub modules (`home-format.ts`, `today-layout.ts`, `today-timeline.tsx`). Red run: 64 failed / 141 in the new files, all on behaviour.
- Next step: implement task 6 formatting (`home-format.ts`) first, then `today-layout.ts` + `today-timeline.tsx` (task 1), then the loader/cards (tasks 2, 3, 4), then Budget strip (task 5). Commit and push after each. Remove the `RED-RUN ONLY` router mock in `activity-cards.test.tsx` when the rows become links.
- M1 (c920a6e) `home-format.ts` done: 9 pass. M2 (e303033 layout: 23 pass; then TodayTimeline: 15 pass) done. `[FAM-UI-01][AC-01]` in `family-home.test.tsx` was rewritten (hover card to at-rest link block): record in DECISIONS as a test change (before: `button` role plus hover tooltip; after: `link` role, text at rest, no tooltip).
- Next step: tasks 2 and 3 (loader per-status calls, Overdue card with total and View all, link rows for Overdue and Recent activity), then task 5 (Budget strip local card, unique keys), then docs (FD-13 onwards), browser check.
