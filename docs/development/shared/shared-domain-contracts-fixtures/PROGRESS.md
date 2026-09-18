# Progress — UI-00 Domain types, data-access contracts and design fixtures

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D2
Branch: `feature/shared-domain-contracts-fixtures`
PR target: `main (per OQ-01 — shared work, ANSWERED PD-030)`
Last updated: 2026-09-18 (PR #11 merged to main)

## Blockers
- None. OQ-01 is ANSWERED (PD-030) in root DECISIONS.md; gate confirmed via `node scripts/plan-status.mjs` listing UI-00 under "Ready to start". Non-blocking OQ-13/OQ-22/OQ-29/OQ-33 are all ANSWERED and their answers are reflected in `src/types/domain.ts` and `src/mocks/fixtures.ts`.

**HUMAN REVIEW requested (not blocking, see DECISIONS.md FD-01/FD-02):**
1. AC-01/T-01 test expectation changed from `displayName('Aisha Rahman') === 'Aisha R.'` to `=== 'Aisha Rahman'` to match root DECISIONS.md PD-038 (CONFIRMED), which postdates and supersedes the abbreviated-name convention this feature's PRD/AC/TEST_PLAN were originally drafted against.
2. `src/server/budget/queries.ts` and `src/server/events/{queries,actions}.ts` were created by this (Lane S) feature even though `docs/AGENT_REFERENCE.md`'s folder-ownership table assigns `src/server/**` (except `data-source.ts`) to Lane B, and `ARCHITECTURE.md` §3.1 doesn't tag those files "(UI-00)". This was necessary to make AC-04 testable at all (PRD.md Scope explicitly names these files as UI-00 work). Please reconcile the three docs; no existing Lane B work was touched (all new files).

## Dependencies status
- F0-02 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Branch claimed; OQ-01/OQ-13/OQ-22/OQ-29/OQ-33 confirmed ANSWERED in root DECISIONS.md
- `src/types/domain.ts`: Zod schemas + types for Organisation, Profile, Client, ClientInfoSection, CareEvent, Occurrence, Shift, BudgetBucketSummary, FundEntry, DocumentRef, CarerNotification, StaffMember, plus TaskLogQuery/TaskLogResult.
- `src/server/data-source.ts`: `getDataSourceMode()` (`DATA_SOURCE` env, default `mock`) and `notImplementedForSupabase()` helper.
- `src/server/budget/queries.ts` (`getBudgetSummary`) and `src/server/events/queries.ts` (`getTodayOccurrences`, `getTaskLog`) + `src/server/events/actions.ts` (`setOccurrenceDone`, Server Action with Zod validation and the `{ok,data}|{ok:false,error}` result shape from ARCHITECTURE.md §4).
- `src/mocks/queries/budget.ts` and `src/mocks/queries/events.ts`: mock implementations reading `src/mocks/fixtures.ts`.
- `src/mocks/fixtures.ts`: Banksia Home Care; clients Margaret/Robert/Elsie/Frank/Doris/Harold/Jean; family Helen/Michael/Susan/Karen/Tom; carers Aisha Rahman/Daniel K./Sarah Nguyen/Marcus Chen/Fatima Ali; admin Priya Iyer; Margaret's budget buckets matching AC-04 exactly; sample occurrences/shifts/fund entries/documents/carer notifications. `deriveBudgetBucketSummary`/`deriveBudgetBucketState` apply the single 75/85/100 threshold constant (PD-032) so `remaining`/`percentUsed`/`state` can never drift from the stored `total`/`used`.
- `src/mocks/current-user.ts`: `getCurrentUser(role)` mock session + `resolveMockRole()` pure `?as=` parser; throws when `NODE_ENV=production`.
- Formatters in `src/lib/format/`: `display-name.ts`, `duration.ts`, `date.ts` (`formatLongDate`/`formatShortDate`), `money.ts`, `age.ts`.
- `eslint.config.mjs`: `no-restricted-imports` rule blocking `**/mocks/*` imports from `src/app/**` and `src/features/**` (AC-06).
- `vitest.config.ts`: extended `include` to also pick up `tests/integration/**/*.test.{ts,tsx}` (needed for T-04/T-06; was previously `src/**` only).
- `zod@^4.6.5` added as a direct dependency (was only a transitive dep before).

## In progress
- None — feature complete, pending human PR approval.

## Remaining
- None for this feature's Scope. (Out of Scope, correctly not built here: the Supabase implementation of these queries/actions, and the database schema — both explicitly Out of Scope in PRD.md, owned by F0-06 onward.)

## Acceptance criteria status
- 6 / 6 MET — see ACCEPTANCE_CRITERIA.md

## Tests
- Written: 6 required (T-01..T-06) + 7 supporting tests (formatMoney ×3, ageFromDob ×2, formatShortDate ×1, mocks-import-boundary "does not restrict src/server" ×1) — all written before their implementation.
- Passing: 54 / 54 (full `npx vitest run` suite, including all pre-existing F0-05 tests — no regressions)
- Failing: 0

## Files changed
- `src/types/domain.ts` (new)
- `src/server/data-source.ts`, `src/server/budget/queries.ts`, `src/server/events/queries.ts`, `src/server/events/actions.ts` (new)
- `src/mocks/fixtures.ts`, `src/mocks/current-user.ts`, `src/mocks/queries/budget.ts`, `src/mocks/queries/events.ts` (new)
- `src/lib/format/display-name.ts`, `duration.ts`, `date.ts`, `money.ts`, `age.ts` (new, each with a colocated `*.test.ts`)
- `tests/integration/shared-domain-contracts-fixtures.test.ts`, `tests/integration/mocks-import-boundary.test.ts` (new)
- `eslint.config.mjs` (restricted-imports rule added), `vitest.config.ts` (tests/integration include added)
- `package.json` / `package-lock.json` (added `zod` as a direct dependency)
- `docs/development/shared/shared-domain-contracts-fixtures/{PRD,ACCEPTANCE_CRITERIA,TEST_PLAN,DECISIONS,PROGRESS,SESSION_STATE}.md` (this session's doc updates)

## Decisions
- See DECISIONS.md — FD-01 (displayName full-name behaviour, HUMAN REVIEW: test expectation changed) and FD-02 (src/server/<domain>/ folder-ownership conflict, HUMAN REVIEW).

## Problems encountered
- `vitest.config.ts` only included `src/**/*.test.{ts,tsx}`, so the `tests/integration/**` convention TESTING.md defines didn't actually run under `npm run test`. Extended the include glob (see Files changed).
- No `node_modules/` existed in this worktree; ran `npm install` before starting.
- `docs/AGENT_REFERENCE.md` folder-ownership table conflicts with this feature's own PRD.md Scope for `src/server/<domain>/` — see FD-02.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md — all now validated/answered per root DECISIONS.md.
- `displayName` and `StaffMember`/`Profile` full-name display follow PD-038 (see FD-01), not the original PRD.md abbreviation example.

## Next action
- Await human review of the two HUMAN REVIEW items above, then human approval to open the PR to `main` (CLAUDE.md §8; PR approval gate).

## Ready for PR
- Yes, pending human approval to open the PR (not opened by this session).
