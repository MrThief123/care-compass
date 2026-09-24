# Session State — UI-05 Plain events in the shared kit and contracts (CHG-009)

Last session date: 2026-09-24
Current branch: `feature/shared-plain-events`
Worked on: Task 7 (full verification, T-19 / AC-13). Before that: Tasks 1–6 and the FD-07 hydration fix.
What changed: feature docs only (PROGRESS, SESSION_STATE, TEST_PLAN, ACCEPTANCE_CRITERIA, DECISIONS FD-09). No code.
Tests run: `npm run verify` (lint 0 errors / 3 pre-existing warnings, typecheck clean, stops at `format:check` on the uncommitted `.claude/settings.json`); `prettier --check . '!.claude/**'` clean; `npm run test` 510 passed / 5 failed; `npx vitest run src` 500 / 500; `npm run test:e2e` on a fresh build 6 passed / 2 failed; the same 2 e2e fail on `origin/main` (scratch worktree, removed). Playwright real-Chromium sweep 1920/1440/1280/1024/768 of `/`, `/dev-preview-calendar-kit` (Day/Week/Month) and `/dev-preview-forms-kit`: clean.
Test results: green apart from the 7 environment-only failures (local Supabase "Invalid API key"; FD-09). CI on head 2e74531 green on every job (e2e skipped in CI).
Current blocker: none. PR #81 to `main` is open (https://github.com/MrThief123/care-compass/pull/81).
Important discoveries: pre-existing showcase issue on `/` — the standalone `CurrentTimeLine` line crosses the "Navigation Rail" label (no positioned wrapper); outside UI-05, reported, not fixed. Turbopack refuses a symlinked `node_modules` in a scratch worktree; run `npm ci` there. A `next dev` server is running on :3000 again (restarted after the e2e run).
Important decisions: FD-01 to FD-08 as before; FD-09 (AC-13 judged MET on the environment-failure evidence).
Exact next action: respond to review feedback on PR #81, if any; the human merges.
Files likely to be touched next: none unless review asks for changes.
Warning for next session: do not commit `.claude/settings.json`; no Co-Authored-By lines or "Generated with Claude Code" footer; never merge the PR yourself.
