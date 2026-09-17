# Agent Reference Tables — Care Compass

Supporting tables for `CLAUDE.md`. These are reference data, not daily-reading — open the section you need.

---

## Folder ownership (CLAUDE.md §4.2)

| Folder | Owned by |
|---|---|
| `src/components/ui/**`, `src/components/shared/**`, `src/styles/**`, `src/types/**`, `src/lib/**`, `src/mocks/**`, `src/server/data-source.ts` | Lane S (shared PRs) |
| `supabase/**`, `src/server/**` (except data-source.ts), `src/lib/supabase/**`, `proxy.ts`/`middleware.ts` | Lane B (shared PRs); dashboard wiring features may add functions in `src/server/<domain>/` for their feature |
| `src/app/(family)/**`, `src/features/family-*/**` | Lane F |
| `src/app/(carer)/**`, `src/features/carer-*/**` | Lane C |
| `src/app/(admin)/**`, `src/features/admin-*/**` | Lane A |
| `tests/e2e/**` | Owner of the feature adding the spec |
| Root plan docs (`PRD.md`, `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`, `DECISIONS.md`, `TESTING.md`) | Human / controlled changes only |

A dashboard feature that needs a change to a shared component **must not edit it**. Record the need in the feature `DECISIONS.md`, tell the human, and either wait for a shared PR or build a local wrapper in `src/features/<screen>/`.

## State files that don't conflict (CLAUDE.md §4)

- Per-feature `PROGRESS.md` and `SESSION_STATE.md` are the live state; edit them only on that feature's branch.
- Root `PROGRESS.md` status section is **generated** by `node scripts/plan-status.mjs --write`; run it only on `main` after merges (or in the daily sync PR). Never hand-edit it on a feature branch.
- Root `SESSION_STATE.md` is a team-level log updated only in sync/checkpoint PRs.

## Parallel sessions on one machine (CLAUDE.md §4)

Use git worktrees, one per lane: `git worktree add ../care-compass-family family-dev`. Only lane B runs `supabase db reset`; other lanes use fixtures (`DATA_SOURCE=mock`) until Phase 3, then point at the shared local stack without resetting it.

---

## Minimum tests by feature type (CLAUDE.md §5)

| Feature type | Tests-first minimum |
|---|---|
| Kit component (UI-01..03, F0-14) | Component test per state/variant in AC + axe |
| Screen on fixtures (`*-UI-*`) | Component test per AC (renders design content, empty/error state, key interaction) + axe on the page component. No Playwright except where an AC says e2e |
| Backend schema (F0-06, 08, 10–13) | pgTAP allow **and** deny cases for every role touching the table |
| Pure logic (F0-09, formatters) | Unit tests incl. edge cases in AC |
| Wiring (FAM/CAR/ADM-xx) | Integration tests for queries/actions against local Supabase + RLS negative case + component tests updated to use real contract shape |
| Integration (INT) | Playwright journeys |

## Relevant suite before a PR (CLAUDE.md §5)

`npm run verify` always; `supabase test db` if schema touched; `npm run test:integration` for wiring; Playwright only for e2e ACs and Phase 4.

---

## Plan structure (phases, lanes, days)

| Phase | What | Lanes | Runs |
|---|---|---|---|
| 0 | Foundation & shared UI kit (tooling, CI, tokens, primitives, data contracts + fixtures, app shell, calendar/forms/lists kits) | S | Days 1–4, sequential then parallel |
| 1 | Screens on fixtures — every designed screen, no database | F, C, A | Days 4–7, **three dashboards in parallel** |
| 2 | Backend & data layer — Supabase, schema, RLS, auth, recurrence, events, shifts, budget, documents, seed | B | Days 2–7, **in parallel with Phases 0–1** |
| 3 | Data wiring & behaviour — replace fixtures with real data, actions, permissions | F, C, A | Days 8–11, three dashboards in parallel |
| 4 | Integration, hardening, release | I (+ B stretch) | Days 11–14 |

Lanes: **S** Shared kit · **B** Backend · **F** Family · **C** Carer · **A** Admin · **I** Integration.

Full day-by-day schedule and staffing: `docs/SPRINT_PLAN.md`. Full stage-gate table: `docs/DEVELOPMENT_WORKFLOW.md` §2.

---

## Status values (used in PROGRESS.md)

`NOT STARTED` → `PLANNED` → `IN PROGRESS` → `IMPLEMENTED` → `READY FOR PR` → `PR OPEN` → `MERGED TO DEV` (for shared features: merged to `main`) → `IN DEVELOPMENT TESTING` → `READY FOR PRODUCTION` → `COMPLETE`, plus `BLOCKED (<DECISION OQ-xx | DEPENDENCY <ID> | DESIGN | TECHNICAL>; was <status>)`.
