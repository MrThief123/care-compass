# Progress — UI-04 Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

Status: READY FOR PR
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D6
Branch: `feature/shared-screen-contracts-fixtures`
PR target: `main (per OQ-01 — shared work, ANSWERED PD-030)`
Last updated: 2026-09-19

The PR is not opened: CLAUDE.md §8 needs the human's approval first.

## Blockers
- None. OQ-01 ANSWERED (PD-030). Work authorised by CHG-004 and CHG-005 (human, in-session 2026-09-19).

**HUMAN REVIEW requested:**
1. **HUMAN REVIEW: test expectation changed.** `tests/integration/shared-app-shell-clients-contract.test.ts` (F0-15): Margaret's `age` 75 to 78 and `suburb` "Ringwood" to "Preston VIC", to match the design (DECISIONS.md FD-06).
2. **Design conflict (FD-04).** `family-01-home.png` draws three overdue items (badge 3), `family-07-task-log.png` two. One dataset cannot satisfy both FAM-UI-01 AC-02 and FAM-UI-07 AC-02. The Task log reading was chosen, so Home on the mock data shows an Overdue badge of 2. The one-row change to switch is in FD-04.
3. **Within-day order (FD-05).** The mandated newest-first rule reverses the drawn order on Mon 30 Nov (Afternoon check-in, Physiotherapy, Morning medication). FAM-UI-07 AC-01 ("starting Morning medication") needs new wording.
4. **Contract behaviour (FD-02).** `getTaskLog` rejects `page` 0, negative, fractional, NaN, Infinity and an unknown `status` with a `ZodError`. Screens must sanitise URL params first (FAM-UI-07 AC-06 already does).
5. **Plan and docs.** New feature `UI-04` and its card added to DEVELOPMENT_PLAN.md (totals now 79 features, 320 criteria); `docs/JIRA_TICKETS.md`, `docs/JIRA_BACKLOG.csv` and the team-level root `SESSION_STATE.md` ("78 features") are not updated.
6. **Judgement calls to confirm:** the temporary 51-character carer is not on the staff list (FD-08); shifts, notifications and the other six clients are untouched, with two known wrinkles (FD-09); Collect prescription and Afternoon walk events kept but moved after the reference week (FD-13).
7. **Baseline flakes, not caused here:** `src/components/shared/calendar/day-timeline.test.tsx` fails two tests when the real clock is near an hour label (seen at about 19:21); `tests/integration/mocks-import-boundary.test.ts` starts ESLint and is load-sensitive (FD-12).

## Dependencies status
- UI-00 — MERGED TO DEV

## Completed
- Branch claimed (`cd15c5d`); feature docs, plan card, CHG-004 and CHG-005 recorded.
- Contract (`5c4905d`, pushed as the milestone before the fixtures): `getTaskLog` newest first by start instant, ties by key, `total` after filters, page size 20 (`TASK_LOG_PAGE_SIZE`), Zod-validated query, empty page beyond the last; `getTodayOccurrences` oldest first on the Melbourne day; `getOccurrence`; `getEventDocuments` and `EventDocument`; own-property client lookups so "constructor" is an unknown client.
- Fixtures (`1c09440`): the design week, 128 generated history rows via the recurrence engine, long title and carer name, six documents on five events, Robert's rows for isolation, header 78 years in Preston VIC.
- Docs: ACs MET, TEST_PLAN results, DECISIONS FD-01 to FD-13.

## In progress
- Nothing.

## Remaining
- Human approval to open the PR to `main`; then the human merges. FAM-UI-01 and FAM-UI-07 owners adopt the contract (notes below).

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 127 tests titled `[UI-04][AC-xx]` (AC-01 15, AC-02 13, AC-03 12, AC-04 15, AC-05 15, AC-06 16, AC-07 2, AC-08 7, AC-09 17, AC-10 15) in seven new colocated files, plus one changed existing test (FD-06).
- Passing: all. `npx vitest run src` → 56 files, 414 tests passed. `npx vitest run` → 60 files, 420 tests passed; the only failing file is the known `tests/integration/shared-supabase-environment.test.ts` (missing Supabase env vars at import). Baseline before this feature: 293 tests.
- `npm run lint` → 0 errors, 23 warnings (all pre-existing, in `scripts/plan-status.mjs` and `src/app/page.tsx`); `npm run typecheck` clean; `npm run format:check` clean.
- Tests-first evidence, contract phase: `f27c28d` and `337209a` (58 tests, 50 failed for the expected reasons: missing functions, no validation, fixture order, unresolved documents modules), green in `5c4905d`.
- Tests-first evidence, fixtures phase: `bf311cc` (86 tests, 31 failed: no history generator or `localToMelbourneIso`, three occurrences, no documents, no temporary carer, no second client's rows, header 75 years in Ringwood), green in `1c09440`.
- One guard test (real Melbourne offsets on every timestamp) was added after the fixtures and passed first time; it was mutation-checked. One of this feature's own new tests was corrected after its first run (FD-11).

## Files changed
- `src/types/domain.ts`, `src/server/events/queries.ts`, `src/server/documents/queries.ts` (new), `src/mocks/queries/events.ts`, `src/mocks/queries/documents.ts` (new), `src/mocks/melbourne-time.ts` (new), `src/mocks/history.ts` (new), `src/mocks/fixtures.ts`, seven new test files, `tests/integration/shared-app-shell-clients-contract.test.ts`.
- `DECISIONS.md` (CHG-004, CHG-005), `DEVELOPMENT_PLAN.md` (UI-04), this feature's docs.
- Nothing under `src/app`, `src/features`, `src/components`, `src/lib`, `supabase/`, `src/proxy.ts`, or any family feature docs. No new dependency.

## Decisions
- FD-01 to FD-13 in DECISIONS.md; CHG-004 and CHG-005 in root DECISIONS.md.

## Problems encountered
- The new jsdom test files made the load-sensitive ESLint boundary test time out in the plain full run; fixed by running the pure new tests in the node environment (FD-12).

## Assumptions
- See DECISIONS.md; the open ones are FD-04, FD-05, FD-08, FD-09 and FD-13.

## Notes for the family lane (not edited here)
- Task detail: replace `findOccurrence` with `getOccurrence(clientId, key)` and pass the documents card `getEventDocuments(clientId, occurrence.eventId)`. Its test that expects "No documents attached." at the Morning medication key must change: that event now has "Medication chart.pdf".
- Task log: rely on the contract's order and `total`; never re-sort. Margaret's log is 137 rows (six pages of 20, then 17). Page 1 starts Afternoon check-in, Physiotherapy, Morning medication (Mon 30 Nov), and the nine design rows are followed by eleven history rows. The Overdue filter returns two rows.
- Home: Overdue reads 2 on the mock data (FD-04). Recent activity from page 1 matches the design row for row. Overdue items come from page 1 of the overdue rows only (20 at most) while the badge is the true total.

## Next action
- Ask the human for approval to open the PR to `main`.

## Ready for PR
- Yes, awaiting human approval (CLAUDE.md §8).
