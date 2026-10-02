# Session State — ADM-03 Admin — Deactivate staff

Last session date: 2026-10-02
Current branch: `feature/admin-staff-deactivate` (worktree `../care-compass-adm-03`, cut from main at b662bfe)
Worked on: START FEATURE ADM-03 — docs and tests only
What changed: docs updated (FD-01 to FD-05, AC-01 to AC-09); four test files added
Tests run: new tests only (vitest component + unit, pgTAP, integration against local Supabase)
Test results: all fail for the expected reason, except 2 component tests that already hold
Current blocker: none
Important discoveries: `is_active` already gates RLS helpers, sign-in and the route guard (`evaluateRoleGuard` signs out with `/sign-in?reason=inactive`), and the admin carer pickers already filter `is_active`; so no service role or auth ban is needed. Completions snapshot `actor_display_name` with no FK, so history survives.
Important decisions: FD-01 to FD-05 (Inactive section, no reactivation, cancel future + end in-progress shifts)
Exact next action: implement per PROGRESS.md "Remaining", starting with the migration
Files likely to be touched next: see PROGRESS.md
Warning for next session: do not edit tests to get green; integration tests need the local stack env vars (the worktree's `.env.local` is the hosted project and skips them).
