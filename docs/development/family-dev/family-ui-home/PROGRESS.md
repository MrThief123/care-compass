# Progress — FAM-UI-01 Family Home screen (UI)

Status: READY FOR PR (PR not opened: waiting for explicit human approval)
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D4
Branch: `feature/family-ui-home` (created from `origin/family-dev`)
PR target: `family-dev`
Last updated: 2026-09-19 (implementation complete, END SESSION)

## Blockers
- None.

## Dependencies status
- F0-15, UI-01, UI-03 — merged to `family-dev` (gate verified by the session caller with `plan-status` before this session; not re-derived here). Their components are in the tree and used as-is.

## Completed
- Route `/family/[clientId]/home`: Today panel (`DayTimeline`, caption "Mon 30 Nov · day view"), 340px right column (Enter event link, Overdue `AlertListCard`, Recent activity with "View all" and chevrons to task detail), Budget strip (aggregate line, "View breakdown", three `BudgetBucketCard`s).
- Loading skeleton (`loading.tsx`), empty states (Overdue "All caught up", Today, Recent activity, Budget) and error state ("Something went wrong" with Retry) wired to the contract's pending / empty / rejected states.
- Data only through `src/server/**` (`getTodayOccurrences`, `getTaskLog`, `getBudgetSummary`); no `src/mocks` import; no new contract function needed.
- Browser check against `family-01-home.png` (see below) and the fixes it prompted (type sizes, link insets, long carer names).
- Feature docs: ACCEPTANCE_CRITERIA, TEST_PLAN, DECISIONS (FD-01 to FD-12), PROGRESS, SESSION_STATE.

## In progress
- None.

## Remaining
- Human review of the items in DECISIONS.md "HUMAN REVIEW summary", then explicit approval to open the PR.
- PR must attach a side-by-side screenshot of the render and `docs/design/screens/family-01-home.png` (PRD UI/UX Requirements). Screenshots were taken to `/tmp/fam-shot/` on the working machine and deliberately not committed; regenerate them if that folder is gone (dev server on a spare port with inline dummy Supabase env, then a headless screenshot at 1440x1024, device scale 1.5).

## Acceptance criteria status
- 6 / 6 MET

| AC | Status | Proving test |
|---|---|---|
| AC-01 | MET (see caveat) | `[FAM-UI-01][AC-01] Today panel shows Morning medication (Done · Aisha Rahman), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned)` |
| AC-02 | MET | `[FAM-UI-01][AC-02] Overdue card badge is 3 and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov), oldest first`; `[FAM-UI-01][AC-02] sortOldestFirst` x2 |
| AC-03 | MET | `[FAM-UI-01][AC-03] budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state`; `[FAM-UI-01][AC-03] summariseBudget` x2 |
| AC-04 | MET | `[FAM-UI-01][AC-04] Recent activity 'View all' targets /family/<id>/tasks` |
| AC-05 | MET | `[FAM-UI-01][AC-05] Overdue card shows 'All caught up' when nothing is overdue` |
| AC-06 | MET | `[FAM-UI-01][AC-06] shows 'Something went wrong' with Retry when %s rejects` x3 (each contract function); `[FAM-UI-01][AC-06] logs a feature-tagged line, without the error's message, when the contract rejects` |

- AC-01 caveat: the shared `DayTimeline` shows the pill, assignee and "1 hr 30 min" only on the hover/focus card at these block heights, not inline as the design does (DECISIONS.md FD-09 item 1). The test proves what the kit exposes.
- AC-01 wording changed from "Aisha R." to "Aisha Rahman" per PD-038 (DECISIONS.md FD-01). **HUMAN REVIEW: test expectation changed.**

## Tests
- Written first: yes. Red run recorded before implementation (2026-09-19): `family-home.test.tsx` 22 tests, 19 failed on assertions (stub page rendered "Coming soon."), 3 passed vacuously (axe on the stub); `home-data.test.ts` failed to import the not-yet-written `./home-data`. A temporary `loading.tsx` stub was used only to get past the missing import and was not committed. The logging test was also written red first (0 calls to `console.error`).
- Now: `src/features/family-home/family-home.test.tsx` 23 tests, `src/features/family-home/home-data.test.ts` 8 tests; 31 / 31 passing.
- `npm run lint`: 0 errors, 23 warnings, all pre-existing and none in this feature's files (same count as before any change).
- `npm run typecheck`: clean. `npm run format:check`: clean.
- `npx vitest run src`: 51 files / 318 tests pass (baseline before this feature was 49 files / 287 tests).
- Plain `npx vitest run`: 54 files pass, 1 fails: `tests/integration/shared-supabase-environment.test.ts` throws at import ("Missing or invalid environment variable(s): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY" from `src/lib/env.ts`). This is the known baseline failure on `main` in a fresh worktree; not touched. 324 tests pass.
- `next build` with inline dummy Supabase env: compiled; `/family/[clientId]/home` is a dynamic route.
- Not run: `supabase test db` and any `supabase` CLI (instruction: do not run), Playwright e2e (needs a build server and Supabase env; there are no Family e2e specs yet).

## Browser check (headless Chromium via the repo's Playwright, 1440x1024 at 1.5x, compared with `family-01-home.png`)
- Matches within about 1px: page padding, the 340px right column, Enter event 340x52, Today card and card positions, the timeline's 07:00 gridline, block positions (09:00, 11:30 to 13:00, 15:00), and text sizes (measured in the real font: caption 13px, aggregate line 13px, Enter event 15px, links 14px).
- With the app's own mock data the content differs from the design (fixtures, FD-08): Today shows Morning medication / Collect prescription / Afternoon walk, Overdue shows 1, Recent activity shows 2, and the header reads "75 years · Ringwood". Budget figures match exactly.
- Differences that come from shared kit components are listed in DECISIONS.md FD-09 (block layout, hour labels, clipped "18:00", upper-case bucket labels, row and card heights, "Sept").
- Long-text check (very long titles and carer name): found and fixed a row break (FD-06). No horizontal overflow, no console errors.

## Files changed
- `src/app/(family)/family/[clientId]/home/page.tsx` (replaced stub), `loading.tsx` (new)
- `src/features/family-home/`: `family-home-view.tsx`, `today-panel.tsx`, `overdue-card.tsx`, `recent-activity-card.tsx`, `recent-activity-row.tsx`, `budget-strip.tsx`, `enter-event-link.tsx`, `home-error-state.tsx`, `home-skeleton.tsx`, `home-data.ts`, `home-routes.ts`, `family-home.test.tsx`, `home-data.test.ts`
- `docs/development/family-dev/family-ui-home/`: `ACCEPTANCE_CRITERIA.md`, `TEST_PLAN.md`, `DECISIONS.md`, `PROGRESS.md`, `SESSION_STATE.md`
- Nothing outside the Family lane's folders and this feature's docs folder. `src/app/(family)/family/[clientId]/layout.tsx`, the shared kit, `src/mocks`, `src/server`, `src/lib`, `src/types` and root plan docs were not touched.

## Decisions
- See DECISIONS.md. OQ-29 ANSWERED (PD-055) followed; OQ-24 OPEN, proposed default applied and flagged; no blocking OQ.

## Problems encountered
- Known baseline: `tests/integration/shared-supabase-environment.test.ts` fails on an unset Supabase env (see Tests).
- The Chrome browser extension was not connected, so the visual check used the repo's Playwright Chromium from a throwaway script outside the repo.
- A throwaway preview route (design data, long text) was used for the browser check and deleted before committing; `git status` is clean.

## Assumptions
- "Recent activity" = five latest done or overdue occurrences from the task log, newest first (FD-04). Flagged for review.
- Empty-state copy other than "All caught up" is proposed copy under OQ-24 (OPEN).

## Next action
- Human reviews DECISIONS.md "HUMAN REVIEW summary" and approves. On approval: set this file and SESSION_STATE.md to `PR OPEN` on this branch, commit, push, and open the PR to `family-dev` titled `FAM-UI-01 Family Home screen (UI)` with the side-by-side screenshot.

## Ready for PR
- Yes, pending explicit human approval. The PR has not been opened.
