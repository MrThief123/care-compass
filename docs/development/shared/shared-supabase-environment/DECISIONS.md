# Decisions — F0-04 Environment configuration and Supabase integration

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-17 | Hosting, email, scheduler, environments and availability | no | Vercel (or equivalent) + Supabase paid tier; Resend (or Supabase SMTP) for email; Vercel Cron or pg_cron for jobs — confirm budget with client. |

## Feature decisions log

### FD-01 — Don't add the `supabase` npm CLI wrapper as a devDependency
- Date: 2026-09-18
- Context: `db:types` and integration testing need the Supabase CLI. It's already installed globally (Homebrew, v2.6.8) and used to run `supabase init`/`supabase start` in this session.
- Decision: Reference the global `supabase` binary from npm scripts (`db:types`); do not add the `supabase` npm package.
- Reason: `npm install -D supabase` pulled in a vulnerable `tar` version (1 critical, 1 high — GHSA-34x7-hfp2-rc4v and others), which would fail F0-03's `npm audit --audit-level=high` CI job.
- Alternatives considered: pin an older/patched `supabase` npm version — none available without the vulnerable `tar` transitive dependency at time of writing.
- Consequences: `npm run db:types` requires a locally-installed Supabase CLI (documented in README). No dependency added.
- Human confirmation required: no (security-driven, not a product/architecture decision)

### FD-02 — Test tooling: `test:integration` script, `.env.local` loading, `server-only` alias
- Date: 2026-09-18
- Context: TESTING.md §5 already names `npm run test:integration` as a command but it didn't exist (F0-02 hadn't added it); F0-04 is the first feature with tests that need real Supabase env vars and the first to import `server-only`.
- Decision: Added `"test:integration": "vitest run tests/integration"` (kept `"test": "vitest run"` unchanged — it still covers `tests/integration/**` too, since existing DATA_SOURCE=mock tests there belong in the default run). Added `.env.local` auto-loading to `vitest.setup.ts` via `process.loadEnvFile` (no-op if the file is absent). Added a `server-only` → its own `empty.js` alias in `vitest.config.ts`, since Vite/Vitest never sets Next's `react-server` resolve condition and `server-only` throws unconditionally otherwise (same fix Next's own Vitest examples use).
- Reason: needed real, working AC-03 integration test evidence without breaking `npm test`/CI for people without a local Supabase stack running.
- Consequences: any future `src/server/jobs/**`-style server-only-guarded module is testable under Vitest without extra setup.
- Human confirmation required: no (test infrastructure, not product behaviour)

### FD-03 — AC-03 test methodology: mirrored cookie jar, not a real Next request
- Date: 2026-09-18
- Context: `src/lib/supabase/server.ts` calls `cookies()` from `next/headers`, which only works inside a real Next.js request lifecycle — not in a plain Vitest test.
- Decision: `tests/integration/shared-supabase-environment.test.ts` signs in a real (throwaway, admin-created) user against local Supabase using `@supabase/ssr`'s `createServerClient` backed by an in-memory cookie `Map`, then mocks `next/headers` so the actual `src/lib/supabase/server.ts` factory reads from that same `Map` and calls `.auth.getUser()`, asserting the resolved user id matches.
- Reason: exercises the real production code path (not a reimplementation of it) while staying runnable in plain Vitest; proves "the query runs with that user's JWT (auth.uid() equals the user id)" without needing any domain table (schema is out of scope until F0-06).
- Consequences: test is skipped (`describe.skipIf`) when `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` aren't set — i.e. in CI until F0-06 wires a Supabase service in, and locally before `supabase start`. Ran and passed locally against the real local stack (2026-09-18).
- Human confirmation required: no

### FD-04 — Extended F0-03's `.github/workflows/ci.yaml` to enforce AC-04
- Date: 2026-09-18
- Context: AC-04 requires the client bundle never contain the service-role key's variable name. `scripts/check-client-bundle-secrets.mjs` proves this locally (deliberate-failure demo in PROGRESS.md), but needs to run in CI to stay enforced.
- Decision: Added one step (`npm run check:client-bundle-secrets`) to F0-03's existing `build` job, right after `npm run build`.
- Reason: this is the natural, minimal place to enforce it going forward; F0-04 is Shared-stream work same as F0-03, not a dashboard feature reaching into someone else's folder.
- Consequences: none to existing jobs — the new step only reads `.next/static`.
- Human confirmation required: no

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
