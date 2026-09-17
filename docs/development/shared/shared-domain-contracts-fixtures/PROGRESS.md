# Progress — UI-00 Domain types, data-access contracts and design fixtures

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D2
Branch: `feature/shared-domain-contracts-fixtures`
PR target: `main (per OQ-01 — shared work, ANSWERED PD-030)`
Last updated: 2026-09-17 (implementation session)

## Blockers
- None. OQ-01 is ANSWERED (PD-030) in root DECISIONS.md; gate confirmed via `node scripts/plan-status.mjs` listing UI-00 under "Ready to start".

## Dependencies status
- F0-02 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `src/types/domain.ts`: Organisation, Profile (role family|carer|admin), Client, ClientInfoSection, CareEvent, Occurrence {key, eventId, clientId, title, description, start, durationMinutes, status: 'planned'|'done'|'overdue', actor?, assignee?, completedAt?}, Shift, BudgetBucketSummary {kind, label, total, used, remaining, percentUsed, state}, FundEntry, DocumentRef, CarerNotification {source: 'admin'|'family', message, createdAt}, StaffMember.
- `src/server/<domain>/queries.ts` and `actions.ts` exported function signatures for every screen (e.g. `getTodayOccurrences(clientId)`, `getBudgetSummary(clientId)`, `getTaskLog(clientId, {q, status, page})`, `setOccurrenceDone(key)`), each delegating to a data source.
- `src/server/data-source.ts`: selects `mock` or `supabase` implementation via `DATA_SOURCE` env (default `mock` until Phase 3). Mock implementations live in `src/mocks/` and read fixtures.
- `src/mocks/fixtures.ts`: design content at reference date Monday 30 November 2026 (Banksia Home Care; Margaret, Robert, Elsie, Frank, Doris, Harold, Jean; Helen, Michael, Susan, Karen, Tom; Priya; Aisha Rahman, Daniel K., Sarah Nguyen, Marcus Chen, Fatima Ali; events, statuses, budgets, fund history, documents, notifications).
- `src/mocks/current-user.ts`: mock session with role selectable in development only (`?as=family|carer|admin` or cookie); throws in production builds.
- Formatters in `src/lib/format/`: `displayName` ('Aisha Rahman' → 'Aisha R.'), `ageFromDob`, `formatDuration` (90 → '1 hr 30 min'), `formatShortDate` ('Mon 30 Nov'), `formatLongDate` ('Monday 30 November 2026'), `formatMoney` ('$14,880', '+$6,000').

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 6 / 6 (T-01..T-06, plus supporting tests for formatMoney/ageFromDob/formatShortDate not tied to a specific AC)
- Passing: 0
- Failing: 6 (all failing for the expected reason before implementation: `npx vitest run` — T-01..T-05 fail with "Failed to resolve import" for the not-yet-created `src/lib/format/*` and `src/server/budget/queries.ts`/`src/mocks/*` modules; T-06 fails with `errorCount` 0 (expected >0) because the `no-restricted-imports` lint rule for `src/mocks` doesn't exist yet)

## Files changed
- None yet. Likely files: `src/types/domain.ts`, `src/server/data-source.ts`, `src/server/*/queries.ts`, `src/mocks/fixtures.ts`, `src/mocks/current-user.ts`, `src/lib/format/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE UI-00, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
