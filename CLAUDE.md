# CLAUDE.md — Care Compass Operating Constitution for Claude Code

> Read this file before doing anything else. It is the behavioural contract for every Claude Code session on this repository, for every team member. If another document conflicts with it, this file wins; if it conflicts with an explicit instruction from the human in the current session, stop and ask.

Plan version: **v0.2 (2-week sprint, UI-first, parallel lanes)** · 17 September 2026

---

## 0. Project in one paragraph

Care Compass ("Scheduling of Care Program") is a desktop web app safeguarding the lifelong care of a person with special needs. Families schedule perpetual recurring care events; carers see assigned patients and shifts and tick off care with their name recorded; organisation admins manage staff, clients and shifts; budgets per funding bucket are tracked with automatic warning emails. Three separate dashboards — **Family, Carer, Admin** — on Next.js (App Router, TypeScript, Tailwind v4, shadcn/ui) and Supabase (Postgres, Auth, Storage, Row Level Security).

---

## 1. Reading order (kept lean to save usage)

Every session:
1. `CLAUDE.md` (this file).
2. Work out **which feature you are on**: from the current branch name (`feature/<slug>` → `docs/development/*/<slug>/`) or the feature ID the human gave you.
3. That feature's `PRD.md`, `ACCEPTANCE_CRITERIA.md`, `TEST_PLAN.md`, `PROGRESS.md`, `SESSION_STATE.md` (+ `DECISIONS.md`, `DATA_MODEL.md` if present).

Only when needed — search, don't read whole files:
- Feature's row/card: `grep -n "<ID>" DEVELOPMENT_PLAN.md`
- Decision status: `grep -n "OQ-xx" DECISIONS.md`
- Architecture/testing rules: open the relevant section of `ARCHITECTURE.md` / `TESTING.md`
- Lane schedule and staffing: `docs/SPRINT_PLAN.md`
- Design: `docs/design/screens/<screen>.png`, Figma MCP (file `DFcLy7U1caCVNlhT6eazF5`)
- Project state: run `node scripts/plan-status.mjs` (never hand-count)

Never rely on memory from earlier sessions. The repository is the only source of state.

---

## 2. Plan structure and gates

| Phase | What | Lanes | Runs |
|---|---|---|---|
| 0 | Foundation & shared UI kit (tooling, CI, tokens, primitives, data contracts + fixtures, app shell, calendar/forms/lists kits) | S | Days 1–4, sequential then parallel |
| 1 | Screens on fixtures — every designed screen, no database | F, C, A | Days 4–7, **three dashboards in parallel** |
| 2 | Backend & data layer — Supabase, schema, RLS, auth, recurrence, events, shifts, budget, documents, seed | B | Days 2–7, **in parallel with Phases 0–1** |
| 3 | Data wiring & behaviour — replace fixtures with real data, actions, permissions | F, C, A | Days 8–11, three dashboards in parallel |
| 4 | Integration, hardening, release | I (+ B stretch) | Days 11–14 |

Lanes: **S** Shared kit · **B** Backend · **F** Family · **C** Carer · **A** Admin · **I** Integration.

Gates:
- **G0 — Pack imported:** only F0-01 may run.
- **G1 — Plan validated:** F0-01 merged and `docs/VALIDATION_REPORT.md` approved → Phase 0 and Phase 2 may start.
- A feature may start when **all its dependencies are merged** (to `main` for shared features, to its dev branch or `main` for dashboard features) **and every blocking decision listed in its PRD is ANSWERED in DECISIONS.md**. `node scripts/plan-status.mjs` computes this.

**Open decisions stay open until the human closes them.** Never mark an OQ answered, never act on a "proposed default" for a blocking OQ, and never infer an answer from other documents. Features blocked by an open decision stay blocked. Non-blocking OQs: use the documented proposed default and note it in the feature `DECISIONS.md`.

---

## 3. Git rules

### 3.1 Branches
```
main                          production; shared (lane S/B/I) feature PRs merge here
├── family-dev                Family integration (lane F)
├── carer-dev                 Carer integration (lane C)
└── admin-dev                 Admin integration (lane A)
feature/<slug>                one feature per branch; slug = feature doc folder name
```
- Dashboard features (`family-*`, `carer-*`, `admin-*`): branch from and PR to their dev branch.
- Shared features (`shared-*`): branch parent/target per **OQ-01**. The plan assumes Option B (from `main`, PR to `main`, human review). **Until OQ-01 is ANSWERED, do not create `feature/shared-*` branches — stop and ask.**

### 3.2 Always
1. `git status` and `git branch --show-current` first; unexplained dirty tree → stop and ask.
2. `git fetch origin`; update the parent branch with `git pull --ff-only`.
3. If `feature/<slug>` exists locally or on origin → check it out and continue from its PROGRESS/SESSION_STATE. Otherwise create it from the updated parent and push immediately (this is how you **claim** it, §4).
4. Verify parentage: `git merge-base --is-ancestor <parent> HEAD`.
5. Before starting work each day on a dashboard feature branch: merge the latest dev branch (`git merge origin/<dev-branch>`), which itself receives `main` daily (§3.4).

### 3.3 Never
- Commit or implement on `main`, `master`, `family-dev`, `carer-dev`, `admin-dev`.
- Create a feature branch from the wrong parent.
- Merge PRs yourself, force-push shared branches, rewrite pushed history, delete branches.
- Commit secrets, `.env*.local`, or credentials from source documents.

### 3.4 Continuous integration of shared work (replaces phase-end releases)
- Shared PRs merge to `main` as soon as reviewed.
- Once per day (and whenever a needed shared feature lands), the lane owner opens/merges a sync PR `main` → `<dashboard>-dev`.
- Dashboard dev branches are merged to `main` at three checkpoints: **end of Day 7** (all screens on fixtures — clickable prototype), **end of Day 10**, **end of Day 12** (release candidate). Human approval required.
- Conflicts outside your feature's owned folders → stop and ask.

---

## 4. Working in parallel with other people

Several people run Claude Code against this one plan at the same time. To avoid collisions:

### 4.1 Claiming
- A feature is claimed when its branch exists on origin **and** its `PROGRESS.md` has `Owner: <name>` committed on that branch. Claim before writing code: create branch → set `Owner:` and `Status: IN PROGRESS` → commit `docs(<slug>): claim` → push.
- If the branch already exists with another owner, do not touch it; tell the human.
- Only start features that `node scripts/plan-status.mjs` lists as **Ready to start**, unless the human explicitly assigns one.

### 4.2 Folder ownership
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

### 4.3 State files that don't conflict
- Per-feature `PROGRESS.md` and `SESSION_STATE.md` are the live state; edit them only on that feature's branch.
- Root `PROGRESS.md` status section is **generated** by `node scripts/plan-status.mjs --write`; run it only on `main` after merges (or in the daily sync PR). Never hand-edit it on a feature branch.
- Root `SESSION_STATE.md` is a team-level log updated only in sync/checkpoint PRs.

### 4.4 Parallel sessions on one machine
Use git worktrees, one per lane: `git worktree add ../care-compass-family family-dev`. Only lane B runs `supabase db reset`; other lanes use fixtures (`DATA_SOURCE=mock`) until Phase 3, then point at the shared local stack without resetting it.

---

## 5. Development method (tests first)

1. **Understand** the feature docs; list the ACs for this session.
2. **Check** dependencies merged and blocking OQs ANSWERED; otherwise stop and report.
3. **Inspect** existing code; reuse kit components and contracts.
4. **Write tests first** from `TEST_PLAN.md`; test titles start `[<ID>][AC-xx]`.
5. **Run** them; confirm they fail for the right reason; record in PROGRESS.md; commit `test(<scope>): …`.
6. **Implement** the minimum within scope.
7. **Run** until green; refactor; re-run.
8. **Run the relevant suite** (§5.2).
9. **Update** feature PROGRESS.md, SESSION_STATE.md, DECISIONS.md; commit.
10. **Definition of Done met** → push → open PR to the correct target.

### 5.1 Minimum tests by feature type
| Feature type | Tests-first minimum |
|---|---|
| Kit component (UI-01..03, F0-14) | Component test per state/variant in AC + axe |
| Screen on fixtures (`*-UI-*`) | Component test per AC (renders design content, empty/error state, key interaction) + axe on the page component. No Playwright except where an AC says e2e |
| Backend schema (F0-06, 08, 10–13) | pgTAP allow **and** deny cases for every role touching the table |
| Pure logic (F0-09, formatters) | Unit tests incl. edge cases in AC |
| Wiring (FAM/CAR/ADM-xx) | Integration tests for queries/actions against local Supabase + RLS negative case + component tests updated to use real contract shape |
| Integration (INT) | Playwright journeys |

### 5.2 Relevant suite before a PR
`npm run verify` always; `supabase test db` if schema touched; `npm run test:integration` for wiring; Playwright only for e2e ACs and Phase 4.

### 5.3 Changing existing tests
Only for: misread requirement, invalid assumption, infrastructure defect, recorded requirement change, genuine test bug. Record in feature DECISIONS.md (test ID, before, after, reason); mention in the commit body; flag **HUMAN REVIEW: test expectation changed** in PROGRESS.md and the PR when behaviour changes or an assertion is removed. Never skip, `.only`, or delete tests to get green.

### 5.4 Never claim something works without running it.

---

## 6. Scope control
- Build only the PRD **Scope**; **Out of Scope** stays out.
- Phase 1 screens: no database, no persistence, no auth guards — fixtures only.
- Phase 3 wiring: don't redesign the screen; connect data and behaviour.
- New requirements, large supporting work or improvements become a new feature, Parking lot item, or controlled change (§9) — never folded in.

---

## 7. Engineering standards (full text: ARCHITECTURE.md §12)
- TypeScript strict; Zod for validation; one pattern per problem.
- Screens read data **only** through `src/server/**` contract functions; never import `src/mocks` from `src/app` or `src/features` (lint-enforced).
- Server Components for reads, Server Actions for UI mutations, Route Handlers only for external triggers.
- Authorisation lives in RLS; UI hides disallowed controls (absent, not disabled) but never grants access. Every new client-scoped table enables RLS in the same migration.
- Money `numeric(12,2)`; dates `timestamptz`, business logic in `Australia/Melbourne`; recurrence only via `src/lib/recurrence`.
- Visuals only via tokens from Figma Foundations; white text never on #0C9BA9; status never colour alone; 44×44px targets.
- kebab-case files; one component per file; plain-English user-facing errors; no PII in logs.
- New dependencies need a feature DECISIONS entry; no second library for an existing concern.

---

## 8. Commits and PRs
- Conventional Commits: `feat(family): …`, `test(carer): …`, `fix(admin): …`, `feat(db): …`, `chore(ci): …`, `docs(<slug>): …`. Never `update`, `wip`, `fix`, `stuff`.
- PR title `<ID> <Feature name>`; body from `docs/DEVELOPMENT_WORKFLOW.md` §7 (include AC table, tests-first commit, commands run, screenshots vs design for UI).

### Definition of Done (feature → READY FOR PR)
- [ ] In-scope ACs MET with tests written first and passing
- [ ] Blocking decisions answered; non-blocking defaults used are noted
- [ ] Empty/loading/error/permission states handled as the PRD lists
- [ ] Relevant suite green (§5.2)
- [ ] Only owned folders changed (§4.2)
- [ ] Feature PROGRESS.md, SESSION_STATE.md, DECISIONS.md updated
- [ ] Branch pushed; PR opened to the correct target

---

## 9. Requirements control
`PRD.md`, `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`, feature `PRD.md` and `ACCEPTANCE_CRITERIA.md` are controlled. Change them only to record a decision the human has answered, or through a `CHG-xxx` entry in DECISIONS.md confirmed by the human.

---

## 10. Stop and ask when
Requirements are ambiguous; sources or Figma conflict; a blocking OQ is open; security/privacy interpretation is unclear; scope would grow; a destructive change is proposed; an architectural choice would add a second pattern; the branch or parent is unclear; a test must change for a non-obvious reason; you need to edit a folder your lane doesn't own; another person owns the feature.
When asking: the question, options, your recommendation, affected features, and what you'll do meanwhile.

---

## 11. Commands

### `PROJECT STATUS`
Run `node scripts/plan-status.mjs` (add `--lane X` if the human names a lane), `git status`, `git branch -a`, `gh pr list` (if available). Report: current gate; per-lane progress; ready-to-start features; in-flight features and owners; blocked features with the OQ IDs or dependencies blocking them; open blocking decisions that would unblock the most features; git state; recommended next feature for this person and why.

### `NEXT FEATURE [lane]`
From `plan-status` "Ready to start", filtered to the person's lane if given, pick the earliest planned day, then lowest phase. Explain why; if nothing is ready, list what it's waiting on (features and decisions).

### `FEATURE STATUS <ID>`
Read the feature folder; check branch on origin and PR (`gh pr list --head feature/<slug>`). Report description, lane, target, owner, status, AC table summary, tests, blockers, decisions, next action.

### `START FEATURE <ID>`
Read feature docs → check gate, dependencies, blocking OQs, owner (stop if any fail) → update parent → create/check out branch → claim (§4.1) → inspect code → tests first → implement scope → run suite → update docs → commit → PR when done.

### `RESUME`
Current branch → feature folder → read PROGRESS.md + SESSION_STATE.md → `git log <parent>..HEAD` and `git status` (warn on mismatch) → run the feature's tests → continue from **Exact next action**.

### `END SESSION` (also before stopping for any reason)
Update feature SESSION_STATE.md and PROGRESS.md; commit `docs(<slug>): update session state`; push.

---

## 12. Status values
`NOT STARTED` → `PLANNED` → `IN PROGRESS` → `IMPLEMENTED` → `READY FOR PR` → `PR OPEN` → `MERGED TO DEV` (for shared features: merged to `main`) → `IN DEVELOPMENT TESTING` → `READY FOR PRODUCTION` → `COMPLETE`, plus `BLOCKED (<DECISION OQ-xx | DEPENDENCY <ID> | DESIGN | TECHNICAL>; was <status>)`.

---

## 13. Safety and privacy
Client data is health and financial information about vulnerable people. Only synthetic fixtures/seed data. Never copy credentials found in source documents. No analytics or external services without a recorded decision.

---

## 14. File map
| Need | File |
|---|---|
| Lane schedule, staffing, daily rhythm | `docs/SPRINT_PLAN.md` |
| Live status (generated) | `node scripts/plan-status.mjs`, `PROGRESS.md` |
| Backlog and feature cards | `DEVELOPMENT_PLAN.md` |
| Tickets | `docs/JIRA_TICKETS.md`, `docs/JIRA_BACKLOG.csv` |
| Requirements and traceability | `PRD.md`, `docs/SOURCES.md` |
| Architecture, data model, standards | `ARCHITECTURE.md` |
| Testing | `TESTING.md` |
| Decisions, open questions, conflicts | `DECISIONS.md` |
| Workflow, PR template, releases | `docs/DEVELOPMENT_WORKFLOW.md` |
| Feature docs | `docs/development/{shared,family-dev,carer-dev,admin-dev}/<slug>/` |
| New-feature templates | `docs/templates/FEATURE_TEMPLATE/` |
| Designs | `docs/design/screens/`, Figma MCP |

---

## 15. Next.js version rules
This project uses a recent Next.js whose APIs and file conventions may differ from your training data (for example, request middleware is `proxy.ts` in Next.js 16). Before writing Next.js code — routing, layouts, server actions, caching, proxy/middleware, config — read the relevant guide in `node_modules/next/dist/docs/` and follow deprecation notices. If a guide conflicts with ARCHITECTURE.md, follow the guide, record it in the feature DECISIONS.md and flag it for a controlled change.
