# Progress — FAM-UI-07 Family Task log and Task detail screens (UI)

Status: IMPLEMENTED
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6–D7
Branch: `feature/family-ui-task-log-detail` (created from `origin/family-dev`)
PR target: `family-dev`
Last updated: 2026-09-19

**Not READY FOR PR yet.** The code is finished and green, but AC-01, AC-02 and AC-04 are **BLOCKED** because the shared mock fixtures do not hold the design's data (FD-02). It becomes READY FOR PR when the human either has the shared fixtures extended (then those ACs go MET with no code change) or accepts the blocked ACs for this PR. Nothing has been opened or merged.

## Blockers
- **BLOCKED (TECHNICAL, shared fixtures; FD-02):** `src/mocks/fixtures.ts` (UI-00, not lane F's) has 3 occurrences for Margaret, all on 30 Nov. The design and ACs need 9 rows over 26–30 Nov, Overdue = Weekly weigh-in + Medication review, "Completed at 09:14". On the running app today: 3 rows, the Overdue filter shows "Collect prescription", and the Morning medication detail says "Completed at 09:05". Affects AC-01, AC-02, AC-04 (and FAM-UI-01 Home, which needs the same rows).
- **Contract gap (FD-03):** no `getOccurrence(clientId, key)`. Task detail derives the occurrence from `getTaskLog`, which is correct only inside the log's range and page size.
- **Contract gap (FD-04):** no way to read an event's documents, so the Documents card always shows "No documents attached." on the running screen.

## HUMAN REVIEW
- **AC wording changed (FD-01):** AC-01 and AC-04 (and T-01/T-04) now say full names ("Aisha Rahman") per PD-038, which supersedes the design's "Aisha R.". Same precedent as UI-00 FD-01 and F0-14 FD-02. No existing assertion was changed.
- **Design gaps built from tokens, please review (FD-08, PD-052):** skeletons, empty / no-results / not-found copy, "Assigned to —", "No documents attached.", the hidden result-count line.
- **Shared kit / lib requests (FD-09):** vertical file tile, `DataTable` column widths, a time-of-day formatter, `SearchField` label and its differences from the design.
- **Non-blocking OQs (FD-05..07):** OQ-29 followed (ANSWERED, PD-055); OQ-31 and OQ-39 are OPEN, proposed defaults applied.

## Dependencies status
- F0-15 (Role app shell) — merged to `family-dev` (plan-status "Ready to start", 2026-09-19)
- UI-03 (Lists and cards kit) — merged
- UI-02 (Forms kit) — merged

## Completed
- Route `/family/[clientId]/tasks` and `/family/[clientId]/tasks/[occurrenceKey]` with `loading.tsx`, `error.tsx` (Next 16 `retry`), and a segment `not-found.tsx`.
- Task log: title, search "Search tasks", Status select (All statuses / Planned / Done / Overdue), DATE · TASK · NURSE · STATUS table with links, row navigation and chevrons; client-side search and filter; newest day first; empty, no-results, loading and error states; live result count for assistive technology.
- Task detail: Back to Task log, title, "<long date> · Assigned to <name>", Status card with "Completed at HH:mm", Description card with Edit link to the edit-event route, Documents card (read-only tiles or empty state), 404 for an unknown or other-client key.
- Data only through `src/server/**` (`getTaskLog`); no `src/mocks` import from `src/app` or `src/features`; `layout.tsx` and every non-owned folder untouched.
- Browser check in headless Chromium against `next dev` (see below).

## In progress
- None

## Remaining
- Human decision on FD-02: extend the shared fixtures (suggested rows are in `src/features/family-task-log/design-fixtures.ts`), then re-run `npx vitest run src` and flip AC-01, AC-02, AC-04 to MET; or accept BLOCKED for the PR.
- Shared / contract requests in FD-03, FD-04, FD-09.
- The PRD asks for a side-by-side screenshot against the design in the PR. The screenshots taken in this session were throwaway files outside the repo, so regenerate them when the PR is approved (dev server needs the dummy env in the note below; the nine-row screen needs the fixtures from FD-02).
- Not run, and not applicable here: `supabase test db` (no schema change; Supabase CLI out of bounds) and Playwright e2e (no e2e AC).

## Acceptance criteria status
- 1 / 4 MET; 3 BLOCKED on FD-02.

| AC | Status | Proven by |
|---|---|---|
| AC-01 | BLOCKED (FD-02) | Component: `[FAM-UI-07][AC-01] renders 9 rows starting Mon 30 Nov · Morning medication · Aisha Rahman · Done · Aisha Rahman` and `…lists every design row…` (design-matching rows). Real contract: `[FAM-UI-07][AC-01] renders the Task log with one row per occurrence getTaskLog returns` (3 rows today). |
| AC-02 | BLOCKED (FD-02) | Component: `[FAM-UI-07][AC-02] shows only Weekly weigh-in and Medication review, each with nurse '—', when Status is Overdue`. On shared fixtures the filter shows "Collect prescription". |
| AC-03 | MET | `[FAM-UI-07][AC-03] shows 'No matches for "Zoe".' and no rows when the search matches nothing` (component), `[FAM-UI-07][AC-03] finds nothing for 'Zoe' in the contract's data` (real contract), and seen in the running app. |
| AC-04 | BLOCKED (FD-02) | Component: `[FAM-UI-07][AC-04] shows 'Done · Aisha Rahman' and 'Completed at 09:14' for the Morning medication`. Real contract: `[FAM-UI-07][AC-04] renders the Morning medication detail from the contract: Done · Aisha Rahman with a completion time` (fixture time is 09:05). |

## Tests
- Written first: 75 tests in 12 files, all colocated (`[FAM-UI-07][AC-01]` 15, `[AC-02]` 5, `[AC-03]` 7, `[AC-04]` 8, `[PRD]` 40).
- Red run (before any implementation): `npx vitest run src/features src/app` → 12 files failed, 0 tests ran; every failure was `Failed to resolve import "./<module>"` for a not-yet-existing implementation module, and no other error type. Committed as `test(family): add failing tests…` (2d09b28).
- Two tests were added after a browser check found layout bugs jsdom cannot see (nurse name wrapping, link focus ring width); each was run red, then fixed (d9b0eaf). One existing test had its jsdom click handling adjusted with no assertion change (FD-11).
- Passing: 75 / 75. Failing: 0.

## Verification (final code, 2026-09-19)
- `npm run lint` → 0 errors, 23 warnings, all in files this feature did not touch (`scripts/plan-status.mjs`, `src/app/page.tsx`). `npx eslint src/features "src/app/(family)/family/[clientId]/tasks" --max-warnings 0` → clean.
- `npm run typecheck` → clean.
- `npm run format:check` → clean.
- `npx vitest run src` → 61 files, 362 tests, all pass.
- `npx vitest run` (plain) → 65 files: 64 pass, 1 fails, 368 tests pass. The one failure is the **known baseline**: `tests/integration/shared-supabase-environment.test.ts` throws at import because `src/lib/env.ts` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Same on main in a fresh worktree; not this feature's, not modified.
- `npm run verify` is therefore red for that one reason only; its other steps were run individually as above.

## Visual check (headless Chromium via Playwright, `next dev -p 3107` with dummy Supabase env, `?as=family`)
- The Claude in Chrome extension was not connected, so the pages were driven with the project's own Playwright and its already-cached Chromium (no download), at 1440×1024 and 1.5× scale (the design PNGs' export size). Throwaway scripts and screenshots lived in `/tmp`; two temporary preview routes (nine design rows; a document tile) were created and deleted before commit. Nothing was committed and the tree is clean.
- Works end to end: the log and detail render; clicking a row's non-link cell opens the detail; Back returns; Tab reaches the task link and Enter opens it; an unknown key shows the not-found page; no console errors or warnings.
- Matches the design (measured against the PNGs, CSS px): title, search box (142px top, 44px, 1072px wide), Status select (220px wide at x=1196), all nine rows exactly 50px, DATE column 136px, chevron position, table card bottom (737 vs 739), Back link, title, subline and card tops within about 3px, Edit link, and the 104×104 document tile (`#8DB8C8` border, 10px radius).
- Bugs found and fixed by this check: nurse names wrapped so rows grew to 57px; the task link's focus ring spanned the whole column.
- Discrepancies from the design, none fixable in lane F:
  1. Names are full ("Aisha Rahman"), so the NURSE column and Done pill are wider (PD-038, FD-01).
  2. The Nurse column is aligned on every row; the design misaligns it on Planned rows (OQ-39, FD-07).
  3. Client line reads "75 years · Ringwood" and the header date is the real date, where the design has "78 years · Preston VIC" and "Monday 30 November 2026" (layout and fixtures, FD-10).
  4. Rail Budget icon is a circled `$` where the design has a plain `$` (shared rail/icon).
  5. Kit differences: search border and placeholder colour, search focus ring, table header colour and underline, row-separator inset, status pill 26px vs about 24px, and 4px label-to-select gap (FD-09).
  6. The running screen on shared fixtures shows 3 rows, not 9 (FD-02). The nine-row screen was compared using a temporary page fed the design rows.

## Files changed
- `src/app/(family)/family/[clientId]/tasks/`: `page.tsx`, `loading.tsx`, `error.tsx`, `[occurrenceKey]/page.tsx`, `[occurrenceKey]/loading.tsx`, `[occurrenceKey]/not-found.tsx`, plus `page.test.tsx`, `page.error.test.tsx`, `states.test.tsx`, `[occurrenceKey]/page.test.tsx`, `[occurrenceKey]/states.test.tsx`.
- `src/features/family-task-log/`: `task-log-view.tsx`, `task-log-skeleton.tsx`, `task-log-query.ts`, `occurrence-display.ts`, `task-routes.ts`, `melbourne-time.ts`, `design-fixtures.ts` (test-support), and tests for each.
- `src/features/family-task-detail/`: `task-detail-view.tsx`, `task-detail-skeleton.tsx`, `document-tile.tsx`, `back-to-task-log-link.tsx`, `find-occurrence.ts`, and tests.
- `docs/development/family-dev/family-ui-task-log-detail/`: this feature's PROGRESS, SESSION_STATE, DECISIONS, TEST_PLAN, ACCEPTANCE_CRITERIA.
- Nothing outside the lane-F folders and this feature's docs (checked with `git diff --name-only origin/family-dev...HEAD`).

## Decisions
- See DECISIONS.md: FD-01 (full names, PD-038), FD-02 (fixture gap), FD-03 / FD-04 (contract gaps), FD-05 (OQ-29), FD-06 (OQ-31), FD-07 (OQ-39), FD-08 (design gaps), FD-09 (kit and lib gaps), FD-10 (Next.js 16, layout), FD-11 (test changes).

## Problems encountered
- Shared fixtures do not match the design (FD-02).
- The mock `getTaskLog` searches titles only and returns fixture order; the screen filters and orders client-side, as the PRD says.
- The Claude in Chrome extension was not connected (see Visual check).
- jsdom logged "Not implemented: navigation" on link clicks; fixed in the test (FD-11).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- To run the pages locally: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy SUPABASE_SERVICE_ROLE_KEY=dummy npx next dev -p 3107`, then open `/family/client-margaret/tasks?as=family`.

## Next action
- Human: decide FD-02 (extend shared fixtures, or accept the BLOCKED ACs), review FD-01 and FD-08, and route the FD-03 / FD-04 / FD-09 requests. Then this feature can move to READY FOR PR; do not open the PR without approval (PD-056).

## Ready for PR
- No — AC-01, AC-02, AC-04 BLOCKED on FD-02. Implementation, tests and docs are otherwise complete.
