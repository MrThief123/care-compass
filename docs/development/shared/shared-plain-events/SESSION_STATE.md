# Session State — UI-05 Plain events in the shared kit and contracts (CHG-009)

Last session date: 2026-09-24
Current branch: `feature/shared-plain-events`
Worked on: Task 7 (full verification, T-19 / AC-13). Before that: Tasks 1–6 and the FD-07 hydration fix.
What changed: feature docs only (PROGRESS, SESSION_STATE, TEST_PLAN, ACCEPTANCE_CRITERIA, DECISIONS FD-09). No code.
Tests run: `npm run verify` (lint 0 errors / 3 pre-existing warnings, typecheck clean, stops at `format:check` on the uncommitted `.claude/settings.json`); `prettier --check . '!.claude/**'` clean; `npm run test` 510 passed / 5 failed; `npx vitest run src` 500 / 500; `npm run test:e2e` on a fresh build 6 passed / 2 failed; the same 2 e2e fail on `origin/main` (scratch worktree, removed). Playwright real-Chromium sweep 1920/1440/1280/1024/768 of `/`, `/dev-preview-calendar-kit` (Day/Week/Month) and `/dev-preview-forms-kit`: clean.
Test results: green apart from the 7 environment-only failures (local Supabase "Invalid API key"; FD-09). CI on head 2e74531 green on every job (e2e skipped in CI).
Current blocker: none. Waiting for the human's yes to open the PR.
Important discoveries: pre-existing showcase issue on `/` — the standalone `CurrentTimeLine` line crosses the "Navigation Rail" label (no positioned wrapper); outside UI-05, reported, not fixed. Turbopack refuses a symlinked `node_modules` in a scratch worktree; run `npm ci` there. A `next dev` server is running on :3000 again (restarted after the e2e run).
Important decisions: FD-01 to FD-08 as before; FD-09 (AC-13 judged MET on the environment-failure evidence).
Exact next action: on the human's yes, open the PR to `main`, titled "UI-05 Plain events in the shared kit and contracts", with the body per `docs/DEVELOPMENT_WORKFLOW.md` §8 and the dashboard-lane notes from PROGRESS.md.
Files likely to be touched next: none (PR only).
Warning for next session: do not commit `.claude/settings.json`; no Co-Authored-By lines or "Generated with Claude Code" footer; do not open the PR until the human says yes.
