# Session State — FAM-05 Family Calendar — Tasks panel and Log panel

Last session date: 2026-09-27
Current branch: `feature/family-calendar-tasks-log` (from `family-dev`, pushed, claimed)
Worked on: wiring the Tasks panel's tick/untick to real persistence (`set_occurrence_done` /
`set_occurrence_undone` RPCs), an inline save-error state, and verifying the Log panel/subtitle
(already built by FAM-UI-02) against FAM-05's own ACs.
What changed:
- `src/server/events/actions.ts`: Supabase branch for `setOccurrenceDone`; new `setOccurrenceUndone`.
- `src/mocks/queries/events.ts`: new mock `setOccurrenceUndone`, mirroring `setOccurrenceDone`.
- `src/features/family-calendar/family-calendar-view.tsx`: `toggleTick` (optimistic + revert +
  error), passed to `TasksPanel`.
- `src/features/family-calendar/tasks-panel.tsx`: `errorMessage` prop, `role="status"` row.
- `src/features/family-calendar/family-calendar.test.tsx`: FAM-05 tests; relabelled one
  `[FAM-UI-02][AC-08]` test whose assertion FAM-05 makes false (DECISIONS.md FD-02).
- `tests/integration/family-calendar-tasks-log.test.ts`: new, against local Supabase.
Tests run: `npx vitest run` (full suite), `npm run test:integration` (local Supabase env
overriding `.env.local`'s hosted project), `npx playwright test tests/e2e/family-calendar.spec.ts`
(needed a fresh `npm run build`), `npm run verify`.
Test results: full suite green (1936 passed / 30 skipped); new integration file 4/4 passed;
family-calendar e2e 10/10 passed (after killing a stale `next start` process left on :3000 from
an earlier session's Playwright run — that caused 6 spurious failures on the first attempt, not
a real regression).
Current blocker: None. FD-01 (undo scope, see DECISIONS.md) was flagged for human review and
merged as implemented (PR #137) — treated as accepted.
Important discoveries:
- FAM-UI-02 had already built the Tasks panel, Log panel and optimistic tick display, with its
  own doc comments explicitly deferring persistence to FAM-05 — the real gap matched the PRD
  closely here (unlike FAM-02/FAM-04, where prior features had already closed most of it).
- `set_occurrence_done`/`set_occurrence_undone` RPCs (F0-11) return the completion row directly
  as `.data` (not wrapped in an array) — confirmed against `tests/integration/care-events.test.ts`'s
  existing usage before writing the action's RPC call.
- This repo's Playwright e2e always runs `DATA_SOURCE=mock` (no env override in
  `playwright.config.ts`), so real-persistence verification (T-01) had to be an integration test,
  not e2e as TEST_PLAN originally specified — recorded in that doc.
Important decisions: FD-01 (undo scope — HUMAN REVIEW), FD-02 (test expectation change) in this
feature's DECISIONS.md.
Exact next action: None — merged (PR #137, directly to `main`).
Files likely to be touched next: none.
Warning for next session: if reusing `npm run start` + Playwright locally, check `lsof -i :3000`
first — `reuseExistingServer: !CI` means Playwright silently reuses a stale server from an
earlier branch's build if one is still running, producing confusing, unrelated-looking failures.
