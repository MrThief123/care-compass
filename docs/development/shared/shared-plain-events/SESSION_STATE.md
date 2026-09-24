# Session State — UI-05 Plain events in the shared kit and contracts (CHG-009)

Last session date: 2026-09-24
Current branch: `feature/shared-plain-events`
Worked on: Task 2 (types): audit, FD-03, tests first, `src/types/domain.ts`.
What changed: `src/types/domain.ts` (plain-event occurrence types, `isPlainEvent`, `TaskLogQuerySchema.type`, generic `TaskLogResult`), `src/types/domain.test.ts`, feature docs (FD-03, AC-04 wording).
Tests run: `src/types/domain.test.ts` (7 failing first, then 8/8), `npm run typecheck`, prettier check, `npm test` (432 passed; 5 F0-04/F0-07 integration tests fail on local Supabase "Invalid API key", same without this change).
Test results: green apart from the unrelated integration failures.
Current blocker: none. FD-01, FD-02, FD-03 all ANSWERED.
Important discoveries: `family-dev` reads `occurrence.status` in ~12 places, hence FD-03 Option A (backward-compatible types). Stale `.next/types` from other branches break `tsc`; delete `.next/types` if it happens. `npm run verify` stops at format check on the uncommitted `.claude/settings.json`.
Important decisions: FD-01 (Option A), FD-02 (option a), FD-03 (Option A).
Exact next action: on the human's go-ahead, Task 3: write failing `[UI-05][AC-03..06]` tests (T-04 to T-08) in `src/server/events/queries.test.ts` / `src/mocks/fixtures.test.ts`, then add walk occurrences (automatic, `kind: "event"`) to the reference week and calendar fixtures, the `type` filter in the mock adapter, `getTodayOccurrences(clientId, { type })` and `getOccurrence(clientId, key, { type })` overloads, and the `getTaskLog` JSDoc about log/export callers passing `type: "all"`.
Files likely to be touched next: `src/mocks/fixtures.ts`, `src/mocks/history.ts`, `src/mocks/queries/events.ts`, `src/server/events/queries.ts`, and their tests.
Warning for next session: do not edit `src/features/**` or `src/app/**` (except the two dev-preview kit pages, FD-02); do not commit `.claude/settings.json`; no Co-Authored-By lines.
