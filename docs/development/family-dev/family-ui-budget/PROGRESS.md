# Progress — FAM-UI-05 Family Budget screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-budget` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. **CHG-022 (2026-09-25):** the human reviewed the screen and added a Pending costs section, entry details, "Recorded by you" and the kept note, paying pending costs when funds are added, and History export (PD-060, AC-13 to AC-17), to be built here before the PR. Scope history: **CHG-021 (2026-09-25):** 'Update' became 'Edit', opening an Edit budget page that also adds, renames and removes buckets (AC-04 to AC-06 rewritten, AC-09 to AC-12 new, FD-12). **CHG-020 (2026-09-25):** the Update form and the pending display (AC-04 to AC-08, FD-11). Earlier note, kept for history: built and green; waiting only for the human's "yes" to open the PR. No open human decision blocks it (OQ-24, empty-state wording, stays open and uses the documented defaults, FD-07).
- FD-05 is answered: the human chose to show who recorded each entry (2026-09-25).

## Dependencies status
- F0-15 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed (`docs(family-ui-budget): claim`)
- Stop-and-ask on the missing History contract read and design fixtures: the human chose "On this branch as CHG-019". CHG-019 recorded in root `DECISIONS.md` (human-confirmed 2026-09-25).
- Feature `DECISIONS.md` written: FD-01 to FD-09 and the open-question table.
- Tests written first (84 tests in 5 files), run red for the right reasons (TEST_PLAN.md Results).
- FD-05 answered by the human: History shows "Recorded by <name>" under each description (PD-034). Tests, fixtures expectations, CHG-019 and the docs updated to match; re-run red (92 tests in 5 files).
- Implementation plan and interface contract written into SESSION_STATE.md, so the build could start cold.
- Implemented (commits `68e7e9c`, `8732005`, `7ecd0c2`, `4cc8aec`): `getFundHistory` contract read, mock and design fixtures (CHG-019); `budget-format.ts` and `budget-data.ts`; `family-budget-view`, local `history-table`, `update-funds-button`, `budget-error-state`, `budget-skeleton`; the route `page.tsx` and `loading.tsx` replacing the placeholder. Data only through `src/server/**`.
- Real-browser design check against `family-06-budget.png` and a width sweep (1920 to 600, normal and stress content): clean. One defect found and fixed on the way (a very large amount broke mid-number at 768; FD-10).
- Full local checks run (CI is down): all green except two shell e2e tests that fail the same way on a clean `origin/family-dev` (TEST_PLAN.md Results).

- CHG-020: T-04 to T-08 written first and run red (`fecb598`), then built (`997ef7b`): the inline Update form and the pending display. 137 of 137 feature tests; full unit run 1403 pass, 5 fail (the pre-existing Supabase "Invalid API key" integration tests). Not yet run for it: `next build`, e2e, the browser sweep.
- CHG-021 recorded (PD-059, FD-12) after the human reviewed the inline form.
- CHG-021 tests written first and run red for the right reasons (TEST_PLAN.md Results, "Red run for CHG-021"): T-04 to T-06 rewritten, T-09 to T-12 new, `budget-edit.test.ts` replacing `fund-update.test.ts`, plus bucket-id and `bucketId` tests for Home, the contract and the fixtures. Commit `test(family): …`.

- CHG-021 built (`feat(family)` commit): the Edit budget page, the open bucket model (`id`, optional `kind`, `bucketId`), the budget route's local holder, Home keyed by id, and ids added to six test/showcase literals (FD-12). 808 of 808 tests pass across family-budget, family-home, server, mocks and shared components; `tsc --noEmit` clean (after `next typegen`); eslint 0 errors on the touched folders; prettier clean.

- CHG-021 full local checks and width sweep (2026-09-25, TEST_PLAN.md "After CHG-021 implementation"). The full unit run passed 1480 of 1480, and tsc, eslint (0 errors) and prettier are clean. `next build` succeeded and e2e passed 36 of 36. The Playwright sweep of Budget, Edit budget and Home, 1920 to 768, found nothing, with the fixtures and with a stress case (40-character names, $9,999,999,999.99 amounts).

- CHG-022 recorded (root DECISIONS.md PD-060 and CHG-022, PRD.md REQ-29 and REQ-37, DEVELOPMENT_PLAN.md, feature PRD and AC-13 to AC-17).
- CHG-022 tests written first and run red for the right reasons (TEST_PLAN.md "Red run for CHG-022"): 59 fail and 395 pass in the files that load, and `budget-export.test.ts` fails at import (21 of 21 with a throwaway stub). FD-13 records the defaults and the five changed assertions. The CHG-022 impact line in root DECISIONS.md is corrected: it had said no assertion changes. Commit `test(family): …`.

- CHG-022 built (`36131f8`, TEST_PLAN.md "After CHG-022 implementation"):
  - `note` and `paidOn` on `FundEntry`.
  - In `applyBudgetEdit`: pending costs paid oldest first, plus "you" and the note on every row a save makes.
  - `budget-export.ts`.
  - The Pending costs section, the entry details dialog, and Export.
- CHG-022 checks: 474 of 475 feature tests pass, and the full unit run passes 1565 of 1567. The failures are the export test bug below and a FAM-UI-07 timeout under load that passes alone. tsc, eslint (0 errors) and prettier are clean, and `next build` succeeds. e2e passes 35 of 36; the one failure is the known `[F0-15]` 338px shell flake. The width sweep, 1920 to 768 with the fixtures and two stress cases, is clean, and so are the dialogs.

## In progress
- Waiting on the human: one CHG-022 test is wrong (below). Once that is settled, the human's "yes" to open the PR.

**Question for the human (test bug, CLAUDE.md §5).** `budget-export.test.ts`, "a field with a comma, a double quote or a line break is quoted…". Its `lineOf({ note: "Line one\r\nLine two" })` splits the file on CRLF and expects one line. A correctly quoted note with an embedded CRLF splits into two, so the test cannot pass without breaking RFC 4180. The CSV itself is right.
- Proposed fix: assert on the whole file, `expect(budgetHistoryCsv([row({ note: "Line one\r\nLine two" })], BUCKETS)).toContain(',"Line one\r\nLine two"\r\n')`. Record it in FD-13 as a genuine test bug, and flag it **HUMAN REVIEW: test expectation changed** here and in the PR. The asserted behaviour does not change; only how the test reads the file.

## Remaining
- Settle the CHG-022 export test bug (above) and re-run the feature suite.
- The human's "yes", then open the PR to `family-dev` (the docs update ships in it).

## Acceptance criteria status
- 16 / 17 MET. AC-01 to AC-16 have every tagged test passing. AC-17 (Export) is built and every tagged test but one passes. That one is a test bug (above), so AC-17 is NOT MET until it is settled.

## Tests
- Feature-related suites: 474 of 475 pass. Full unit run (`src`, `tests/unit`): 1565 of 1567 pass. The failures are the export test bug and the `[FAM-UI-07][AC-05]` paging timeout under load, which passes alone.
- e2e (production build, `--grep-invert "F0-07"`): 35 of 36 pass. The failure is the `[F0-15]` 338px header test, a known shell flake (it also fails on a clean `origin/family-dev`).

## Files changed
- `DECISIONS.md` — CHG-019
- `docs/development/family-dev/family-ui-budget/DECISIONS.md`, `TEST_PLAN.md`, `PROGRESS.md`, `SESSION_STATE.md`
- `src/features/family-budget/family-budget.test.tsx` (new)
- `src/features/family-budget/budget-format.test.ts` (new)
- `src/features/family-budget/budget-data.test.ts` (new)
- `src/server/budget/queries.test.ts` (new)
- `src/mocks/queries/budget.test.ts` (new)
- Tests amended for FD-05 (2026-09-25): the five test files above.
- Production code (this session): `src/app/(family)/family/[clientId]/budget/page.tsx` (placeholder replaced) and `loading.tsx` (new); `src/features/family-budget/` new: `budget-format.ts`, `budget-data.ts`, `family-budget-view.tsx`, `history-table.tsx`, `update-funds-button.tsx`, `budget-error-state.tsx`, `budget-skeleton.tsx`; `src/server/budget/queries.ts` (Lane B, CHG-019: `getFundHistory`); `src/mocks/queries/budget.ts` and `src/mocks/fixtures.ts` (Lane S, CHG-019: the read, and Margaret's three design rows plus one for Robert).
- No test file changed in this session.
- CHG-022 build (`36131f8`): `src/types/domain.ts` (`note`, `paidOn`). In `src/features/family-budget/`, changed: `budget-edit.ts`, `family-budget-view.tsx`, `history-table.tsx`, `budget-skeleton.tsx`. New: `budget-export.ts`, `entry-row.tsx`, `entry-details-dialog.tsx`, `pending-costs-table.tsx`. No test file changed.

## Decisions
- See DECISIONS.md (FD-01 to FD-10; FD-10 is new in the build: History column sizes). Root `DECISIONS.md`: CHG-019 (amended 2026-09-25: entries name their recorder).

## HUMAN REVIEW: test expectation changed
- CHG-022 (PD-060): five assertions changed.
  - The screen is three cards, not two.
  - A saved row says "Recorded by you": the screen test, and `recordedBy` in `applyBudgetEdit`.
  - Adding funds pays pending costs: the screen test gives $430, not $740, and so does `applyBudgetEdit`.

  Before and after for each: DECISIONS.md FD-13.
- CHG-021: the CHG-020 inline-form tests (`fecb598`) are replaced by the Edit budget page's tests (T-04 to T-06 rewritten, T-09 to T-12), and `fund-update.test.ts` is deleted with its module (replaced by `budget-edit.test.ts`). The assertions that changed behaviour: a blank amount is now no change (was "Enter an amount."), "Choose a bucket." is gone, the no-buckets body now reads "Choose ‘Edit’ to add a bucket.", and the fixture check matches entries to buckets by `bucketId` instead of `bucketKind`. Recorded requirement change (PD-059); each before and after is in DECISIONS.md FD-12.
- CHG-020: the FD-06 'Update' tests (announces "not available yet", changes nothing) are replaced by the form's tests T-04 to T-06. Existing loader, contract and fixture tests now also expect `today` and Margaret's pending cost. Recorded requirement change; each before and after is in DECISIONS.md FD-11.
- `[FAM-UI-05][PRD] FD-05: a row is date, description and amount only, with no 'recorded by' text drawn` asserted the opposite of the human's decision of 2026-09-25 (show who recorded each entry), so it was replaced by attribution tests before any implementation began. No other assertion changed. Before and after: DECISIONS.md FD-05, TEST_PLAN.md.
- The design (`family-06-budget.png`) does not draw the "Recorded by" line: flag for design review in the PR.

## Problems encountered
- Real-browser stress check: at a 768px window `+$9,999,999,999.99` broke mid-number, because the History amount column was too narrow. Fixed by widening its floor (FD-10, `4cc8aec`); the full width sweep was re-run clean.
- Two shell e2e tests (`[F0-15]` header, 480px and 338px, page loads Home) fail on the production build. Reproduced on a clean build of `origin/family-dev`, so not caused by this feature; the shell is not lane F's. To raise with the shell owner.
- CHG-018 (Info's contracts) is on unmerged PR #89, so this branch's contract change is numbered CHG-019.
- A test file that imports a module that does not exist fails at load in Vite, even for a dynamic `import()` with a literal path. `family-budget.test.tsx` therefore imports `budget/loading` and the page statically (the Info precedent), and its red state is "module does not exist". Its per-test red state was checked once with that import stubbed (TEST_PLAN.md Results).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- OQ-24 (empty-state wording) is open; the default wording in use is flagged in FD-07.

## Next action
- On the human's answer about the export test bug: apply it (or leave the test as it is), re-run the feature suite, and record it in FD-13.
- Later, on the human's "yes": open the PR `FAM-UI-05 Family Budget screen (UI)` to `family-dev`, with the flags below and the note that CI is down so every check ran locally.

## Ready for PR
- No: CHG-022 is built, but one export test is a test bug waiting on the human (In progress). The PR body also flags the undesigned Pending costs section, details dialog and Export button (PD-052) and CHG-022's contract fields. The PR body flags: the six test and showcase files given ids only, including the Lane S tests `budget-bucket-card.test.tsx` and `lists-cards-kit.axe.test.tsx` (FD-12); the undesigned Edit budget page and its copy, open buckets (PD-059, CHG-021) changing `src/types/**`, `src/server/**` and `src/mocks/**`, the replaced CHG-020 form tests (HUMAN REVIEW); the undesigned Update form and pending display (PD-052), the replaced FD-06 tests (HUMAN REVIEW), CHG-020. Earlier list: PR body flags: local `BudgetBucketTile` and local History table instead of the kit's `BudgetBucketCard` and `DataTable` (FD-01, FD-03); the "Recorded by" line the design does not draw (FD-05); copy needing review (FD-06 Update message, FD-07 empty and error wording, FD-09 "No description"; OQ-24 stays open); CHG-019 touching `src/server/**` and `src/mocks/**`; the checks ran locally because CI is down; the two shell e2e failures that also fail on `family-dev`; the `[FAM-UI-07][AC-05]` paging timeout under full-run load (FAM-UI-07's test, passes alone).
