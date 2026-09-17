# F0-04 — Environment configuration and Supabase integration

| Field | Value |
|---|---|
| Feature ID | F0-04 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-supabase-environment` |
| Documentation | `docs/development/shared/shared-supabase-environment/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D2 |
| Status / owner | See PROGRESS.md |

## Purpose
Provide a single, safe Supabase integration pattern for the whole codebase.

## Problem
Next.js has a server layer; using the service-role key in request paths would silently bypass RLS (ADR-02).

## Description
Sets up environment variable validation, Supabase CLI local development, and the only approved ways to create Supabase clients (browser, server, middleware, and an isolated service-role client for jobs).

## User value
Keeps RLS as the enforcement layer on every request and prevents secret leakage.

## Users
- Developers

## Scope
- `supabase init` config committed; README section for `supabase start`, `supabase db reset`, `supabase test db`.
- `src/lib/env.ts`: Zod schema for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public) and `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional in dev); fail fast with the missing variable name.
- `.env.example` with every variable and comments; `.env*.local` git-ignored.
- `src/lib/supabase/browser.ts`, `server.ts` (cookies-based `createServerClient`), `middleware.ts` (session refresh helper) and root `middleware.ts` (named `proxy.ts` in Next.js 16 — follow `node_modules/next/dist/docs/`).
- `src/server/jobs/supabase-admin.ts` service-role client guarded by `import 'server-only'`.
- ESLint `no-restricted-imports` rule: the service-role module may only be imported from `src/server/jobs/**`.
- Generated database types script `npm run db:types` → `src/lib/supabase/database.types.ts`.

## Out of Scope
- Schema and RLS policies (F0-06 onward)
- Authentication UI (F0-07)
- Hosted environments (OQ-17)

## Functional Requirements
- Server Components, Server Actions and Route Handlers query Supabase as the signed-in user.
- Middleware refreshes expired sessions on navigation.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-02 (Tooling baseline: TypeScript, lint, format, test runners)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-17

## Inputs
- Environment variables

## Outputs
- Supabase client factories
- Env validation
- Lint guard

## Error / Edge Cases
- Missing public env var at build → build fails with clear message.
- Service-role key absent in dev → jobs that need it throw a descriptive error only when invoked.

## Security / Permissions
- Service-role key never reachable from client bundles (verified by lint rule and a build-output grep test).
- Cookies set httpOnly/secure per @supabase/ssr defaults.

## Technical Considerations
- @supabase/ssr + @supabase/supabase-js.
- Zod is the single validation library (PD-015).

## Traceability
- Product requirements: REQ-03 (Authorisation enforced by the database (RLS) on every read and write.), REQ-N4 (Security: TLS, hashed credentials, session expiry/refresh, input validation, OWASP Top 10 …)
- Sources: ADR-01; ADR-02 Part 3; ADR-03
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
