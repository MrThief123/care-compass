# Progress — FAM-UI-05 Family Budget screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D6
Branch: `feature/family-ui-budget` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. **Scope grew under CHG-020 (2026-09-25):** the Update form and the pending display (AC-04 to AC-08, FD-11). Back to IN PROGRESS until they are built and green. Earlier note, kept for history: built and green; waiting only for the human's "yes" to open the PR. No open human decision blocks it (OQ-24, empty-state wording, stays open and uses the documented defaults, FD-07).
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

## In progress
- CHG-020: T-04 to T-08 written first and run red for the right reasons (37 fail, 67 pass in the four files that load; `fund-update.test.ts` fails at import). The FD-06 'Update' tests are replaced (HUMAN REVIEW, below). See TEST_PLAN.md "Red run for CHG-020".

## Remaining
- AC-04 to AC-08: implement the form and the pending display (types, contract, fixtures per CHG-002), then full local checks and a real-browser width sweep.
- Then the human's "yes", and open the PR to `family-dev` (the docs update ships in it).

## Acceptance criteria status
- 3 / 8 MET (AC-01 the three bucket cards, AC-02 the first History row, AC-03 the empty state), each with tests passing. AC-04 to AC-08 (CHG-020) NOT MET.

## Tests
- Written: 92 (T-01..T-03 and the tests beyond them, TEST_PLAN.md)
- Passing: 92 of 92 in this feature's five files; 1270 of 1270 in the full unit run (`src`, `tests/unit`)
- e2e (production build, `--grep-invert "F0-07"`): 34 pass, 2 fail. Both are `[F0-15]` header tests at 480px and 338px on Home, not this feature's page; they fail the same way on a clean `origin/family-dev` (480px always, 338px intermittently)

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

## Decisions
- See DECISIONS.md (FD-01 to FD-10; FD-10 is new in the build: History column sizes). Root `DECISIONS.md`: CHG-019 (amended 2026-09-25: entries name their recorder).

## HUMAN REVIEW: test expectation changed
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
- After the human reviews the CHG-020 docs: write T-04 to T-08 failing first.

## Ready for PR
- No (CHG-020 scope in progress). When it is, the PR body also flags: the undesigned Update form and pending display (PD-052), the replaced FD-06 tests (HUMAN REVIEW), CHG-020. Earlier list: PR body flags: local `BudgetBucketTile` and local History table instead of the kit's `BudgetBucketCard` and `DataTable` (FD-01, FD-03); the "Recorded by" line the design does not draw (FD-05); copy needing review (FD-06 Update message, FD-07 empty and error wording, FD-09 "No description"; OQ-24 stays open); CHG-019 touching `src/server/**` and `src/mocks/**`; the checks ran locally because CI is down; the two shell e2e failures that also fail on `family-dev`.
