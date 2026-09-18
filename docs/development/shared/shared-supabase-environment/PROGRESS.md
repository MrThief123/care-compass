# Progress — F0-04 Environment configuration and Supabase integration

Status: IN PROGRESS
Owner: MrThief123
Lane: B — Backend
Sprint: SPRINT · planned D2
Branch: `feature/shared-supabase-environment`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18

## Blockers
- None — OQ-01 ANSWERED (see root DECISIONS.md)

## Dependencies status
- F0-02 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `supabase init` config committed; README section for `supabase start`, `supabase db reset`, `supabase test db`.
- `src/lib/env.ts`: Zod schema for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public) and `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional in dev); fail fast with the missing variable name.
- `.env.example` with every variable and comments; `.env*.local` git-ignored.
- `src/lib/supabase/browser.ts`, `server.ts` (cookies-based `createServerClient`), `middleware.ts` (session refresh helper) and root `middleware.ts` (named `proxy.ts` in Next.js 16 — follow `node_modules/next/dist/docs/`).
- `src/server/jobs/supabase-admin.ts` service-role client guarded by `import 'server-only'`.
- ESLint `no-restricted-imports` rule: the service-role module may only be imported from `src/server/jobs/**`.
- Generated database types script `npm run db:types` → `src/lib/supabase/database.types.ts`.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/config.toml`, `src/lib/env.ts`, `.env.example`, `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `proxy.ts (or middleware.ts per Next.js version)`, `src/server/jobs/supabase-admin.ts`, `eslint.config.mjs`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
