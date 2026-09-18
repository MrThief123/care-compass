# Care Compass

Care Compass ("Scheduling of Care Program") is a desktop web app safeguarding the lifelong care of a person with special needs. Families schedule perpetual recurring care events; carers see assigned patients and shifts and tick off care with their name recorded; organisation admins manage staff, clients and shifts; budgets per funding bucket are tracked with automatic warning emails. Three dashboards — Family, Carer, Admin — on Next.js (App Router, TypeScript, Tailwind v4, shadcn/ui) and Supabase (Postgres, Auth, Storage, Row Level Security).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result. Run `npm run verify` (lint + typecheck + format check + tests) before committing.

## Supabase local development

Requires [Docker](https://docs.docker.com/get-docker/) and the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`brew install supabase/tap/supabase`).

```bash
supabase start          # starts the local Postgres/Auth/Storage stack
supabase status -o env  # prints API_URL, ANON_KEY, SERVICE_ROLE_KEY, ...
```

Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` from that output (never commit `.env.local`). Then:

```bash
supabase db reset            # (re)applies supabase/migrations and supabase/seed.sql
supabase test db             # runs pgTAP tests under supabase/tests
npm run test:integration     # runs tests/integration/**, including ones that need the local stack
npm run db:types             # regenerates src/lib/supabase/database.types.ts from the local schema
supabase stop                # stops the stack when you're done
```

Query Supabase only through `src/lib/supabase/browser.ts` (Client Components) or `src/lib/supabase/server.ts` (Server Components, Server Actions, Route Handlers) — both run as the signed-in user, so RLS stays the authorisation boundary. `src/server/jobs/supabase-admin.ts` is the one service-role (RLS-bypassing) client, restricted by lint to `src/server/jobs/**`.

## Project docs

This repo is run by a documented plan (see `CLAUDE.md` for the full operating rules). Every session starts by reading `CLAUDE.md`, then the current feature's docs under `docs/development/`. The rest of the root-level docs are the plan's controlled source of truth:

| File | What it's for |
|---|---|
| `CLAUDE.md` | Operating rules for every session/agent working in this repo — read this first |
| `PRD.md` | Product requirements and traceability |
| `ARCHITECTURE.md` | Directory layout, data model, engineering standards |
| `DEVELOPMENT_PLAN.md` | Backlog and feature cards (F0-xx, UI-xx, FAM-xx, CAR-xx, ADM-xx, INT-xx) |
| `DECISIONS.md` | Open questions, answered decisions, controlled changes (CHG-xxx) |
| `TESTING.md` | Testing strategy and standards |
| `PROGRESS.md` / `SESSION_STATE.md` | Generated/live project status — see `node scripts/plan-status.mjs` |

Further reference docs (sprint schedule, folder ownership, agent commands, workflow/PR template, per-feature `PRD.md`/`ACCEPTANCE_CRITERIA.md`/`TEST_PLAN.md`) live under `docs/` — see `CLAUDE.md` §13 for the full map.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
