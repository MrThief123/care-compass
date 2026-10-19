# Session State — F0-29 Tags on events and documents

Last session date: 2026-10-19
Current branch: `feature/shared-event-document-tags` (from `main`, pushed)
Worked on: the whole feature, tests first, one commit per step.
Tests run: Vitest full on mock (2963 pass), typecheck, lint, prettier, build, dev-server render check.
Not run: `npx supabase test db` (T-03), integration T-08, browser visual check — Docker was not running.
Current blocker: none in code; AC-05 needs pgTAP to run.
Exact next action: start Docker, `npx supabase start`, `npx supabase db reset`, `npm run db:types` (check the diff matches the hand edit), `npx supabase test db`, `npx vitest run tests/integration/shared-event-document-tags.test.ts`; then browser check and, with human approval, open the PR.
