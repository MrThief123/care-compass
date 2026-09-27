# Session State — FAM-02 Family Home — Overdue card and Recent activity

Last session date: 2026-09-27
Current branch: `feature/family-home-overdue-activity` (from `family-dev`, pushed, claimed)
Worked on: wiring `getTaskLog` to Supabase (F0-11 infra) for the Overdue card and Recent activity; a copy fix to meet AC-02.
What changed:
- `src/server/events/queries.ts`: `getTaskLog` gained a `DATA_SOURCE=supabase` branch (`TASK_LOG_EARLIEST_DATE` sentinel + `loadOccurrences` + the mock's pure `queryTaskLog`). `getTodayOccurrences` left unimplemented — that's FAM-01's Today timeline, out of FAM-02's scope.
- `src/features/family-home/overdue-card.tsx`: empty-state body corrected to AC-02's wording.
- `src/features/family-home/activity-cards.test.tsx`: added `[FAM-02][AC-01/02/04]` tests.
- `tests/integration/family-home-overdue-activity.test.ts`: new, `[FAM-02]` suite against local Supabase (T-03 plus an Overdue-total case, a tick-off case, and an RLS negative case).
Tests run: `npx vitest run` (full suite), `npm run test:integration` (with local Supabase env vars overriding `.env.local`'s hosted project, per that suite's own header comment), `npm run verify`.
Test results: full unit/component suite 1808 passed / 16 skipped; new integration file 4/4 passed; pre-existing `family-change-organisation.test.ts` and `shared-authentication.test.ts` integration failures are environmental (local Supabase has MFA TOTP enrol disabled) and pre-date this branch — confirmed by running them unchanged on a stash of this branch's diff.
Current blocker: None
Important discoveries:
- FAM-UI-01 had already built the Overdue/Recent activity cards' UI, empty states and routing on the mock data source (`home-data.ts`, `overdue-card.tsx`, `recent-activity-card.tsx`, `home-routes.ts`) — closer to a Phase 3 shape than a typical fixture screen. The real remaining FAM-02 gap was just `getTaskLog`'s Supabase implementation and one copy string.
- `getOccurrences`'s existing Supabase path (F0-11) already returns plain events uniformly via `buildOccurrences`; `getTaskLog`'s Supabase branch reuses `loadOccurrences` directly rather than re-deriving that logic.
Important decisions: FD-01 (empty-state copy), FD-02 (task-log range sentinel) — both in this feature's DECISIONS.md.
Exact next action: None — merged (PR #133, directly to `main`).
Files likely to be touched next: none.
Warning for next session: local Supabase's `.env.local` points at a hosted project — integration tests need `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` overridden from `supabase status -o env` for a local run (see `tests/integration/care-events.test.ts`'s header comment).
