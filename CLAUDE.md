# CLAUDE.md — Care Compass Operating Constitution for Claude Code

> Read this file before doing anything else. It is the behavioural contract for every Claude Code session on this repository, for every team member. If another document conflicts with it, this file wins; if it conflicts with an explicit instruction from the human in the current session, stop and ask.
>
> This file holds only what's essential every session or a hard rule. Detail and reference tables live in the files it points to — open those only when the task in front of you needs them.

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
- Lane schedule, staffing, phase table: `docs/SPRINT_PLAN.md`, `docs/AGENT_REFERENCE.md`
- Design: `docs/design/screens/<screen>.png`, Figma MCP (file `DFcLy7U1caCVNlhT6eazF5`)
- Project state: run `node scripts/plan-status.mjs` (never hand-count)

Never rely on memory from earlier sessions. The repository is the only source of state.

---

## 2. Gates (hard rule)

A feature may start only when `node scripts/plan-status.mjs` lists it as **Ready to start** — all its dependencies are merged (to `main` for shared features, to its dev branch or `main` for dashboard features) and every blocking decision in its PRD is ANSWERED in DECISIONS.md.

**Open decisions stay open until the human closes them.** Never mark an OQ answered, never act on a "proposed default" for a blocking OQ, and never infer an answer from other documents. Features blocked by an open decision stay blocked. Non-blocking OQs: use the documented proposed default and note it in the feature `DECISIONS.md`.

Before **G1 — Plan validated** (F0-01 merged, `docs/VALIDATION_REPORT.md` approved), only F0-01 may run. Full phase/lane table and stage gates: `docs/AGENT_REFERENCE.md`, `docs/DEVELOPMENT_WORKFLOW.md` §2.

---

## 3. Git rules

Branches: `main` (production) ← `family-dev` / `carer-dev` / `admin-dev` (per-dashboard integration) ← `feature/<slug>` (one feature per branch). Dashboard features (`family-*`, `carer-*`, `admin-*`) branch from and PR to their dev branch. **Shared features (`shared-*`): do not create `feature/shared-*` branches until OQ-01 is ANSWERED — stop and ask.**

### Always
1. `git status` and `git branch --show-current` first; unexplained dirty tree → stop and ask.
2. `git fetch origin`; update the parent branch with `git pull --ff-only`.
3. If `feature/<slug>` exists locally or on origin → check it out and continue from its PROGRESS/SESSION_STATE. Otherwise create it from the updated parent and push immediately (this is how you **claim** it, §4).
4. Verify parentage: `git merge-base --is-ancestor <parent> HEAD`.
5. Before starting work each day on a dashboard feature branch: merge the latest dev branch (`git merge origin/<dev-branch>`).

### Never
- Commit or implement on `main`, `master`, `family-dev`, `carer-dev`, `admin-dev`.
- Create a feature branch from the wrong parent.
- Merge PRs yourself, force-push shared branches, rewrite pushed history, delete branches.
- Commit secrets, `.env*.local`, or credentials from source documents.

Full branching, daily sync and checkpoint procedure: `docs/DEVELOPMENT_WORKFLOW.md` §3–§10.

---

## 4. Working in parallel with other people

Several people run Claude Code against this one plan at the same time.

### 4.1 Claiming
- A feature is claimed when its branch exists on origin **and** its `PROGRESS.md` has `Owner: <name>` committed on that branch. Claim before writing code: create branch → set `Owner:` and `Status: IN PROGRESS` → commit `docs(<slug>): claim` → push.
- If the branch already exists with another owner, do not touch it; tell the human.
- Only start features that `node scripts/plan-status.mjs` lists as **Ready to start**, unless the human explicitly assigns one.

### 4.2 Folder ownership
Never edit a folder your lane doesn't own — full table in `docs/AGENT_REFERENCE.md`. A dashboard feature that needs a change to a shared component **must not edit it**: record the need in the feature `DECISIONS.md`, tell the human, and either wait for a shared PR or build a local wrapper in `src/features/<screen>/`.

Root `PROGRESS.md`/`SESSION_STATE.md` and multi-worktree setup: `docs/AGENT_REFERENCE.md`.

---

## 5. Development method (tests first)

1. **Understand** the feature docs; list the ACs for this session.
2. **Check** dependencies merged and blocking OQs ANSWERED; otherwise stop and report.
3. **Inspect** existing code; reuse kit components and contracts.
4. **Write tests first** from `TEST_PLAN.md`; test titles start `[<ID>][AC-xx]`.
5. **Run** them; confirm they fail for the right reason; record in PROGRESS.md; commit `test(<scope>): …`.
6. **Implement** the minimum within scope.
7. **Run** until green; refactor; re-run.
8. **Run the relevant suite** — minimum tests by feature type and suite-per-PR table in `docs/AGENT_REFERENCE.md`.
9. **Update** feature PROGRESS.md, SESSION_STATE.md, DECISIONS.md; commit.
10. **Definition of Done met** (§8) → push → open PR to the correct target.

**Changing existing tests:** only for a misread requirement, invalid assumption, infrastructure defect, recorded requirement change, or genuine test bug. Record in feature DECISIONS.md (test ID, before, after, reason); flag **HUMAN REVIEW: test expectation changed** in PROGRESS.md and the PR when behaviour changes or an assertion is removed. Never skip, `.only`, or delete tests to get green.

**Never claim something works without running it.**

---

## 6. Scope control
- Build only the PRD **Scope**; **Out of Scope** stays out.
- Phase 1 screens: no database, no persistence, no auth guards — fixtures only.
- Phase 3 wiring: don't redesign the screen; connect data and behaviour.
- New requirements, large supporting work or improvements become a new feature, Parking lot item, or controlled change (§9) — never folded in.

---

## 7. Engineering standards (full text: `ARCHITECTURE.md` §12)
- TypeScript strict; Zod for validation; one pattern per problem.
- Screens read data **only** through `src/server/**` contract functions; never import `src/mocks` from `src/app` or `src/features` (lint-enforced).
- Authorisation lives in RLS; UI hides disallowed controls (absent, not disabled) but never grants access. Every new client-scoped table enables RLS in the same migration.
- Money `numeric(12,2)`; dates `timestamptz`, business logic in `Australia/Melbourne`; recurrence only via `src/lib/recurrence`.
- Visuals only via tokens from Figma Foundations; white text never on #0C9BA9; status never colour alone; 44×44px targets.
- No PII in logs. New dependencies need a feature DECISIONS entry; no second library for an existing concern.

---

## 8. Commits and PRs
- Conventional Commits: `feat(family): …`, `test(carer): …`, `fix(admin): …`, `feat(db): …`, `chore(ci): …`, `docs(<slug>): …`. Never `update`, `wip`, `fix`, `stuff`.
- PR title `<ID> <Feature name>`; body from `docs/DEVELOPMENT_WORKFLOW.md` §8. Never open the PR without prior human approval (`docs/DEVELOPMENT_WORKFLOW.md` §7).
- No AI-attribution lines in commits or PRs: never add `Co-Authored-By: Claude …` trailers or a "Generated with Claude Code" footer. Commits and PRs are authored under the human owner's name only.

### Definition of Done (feature → READY FOR PR)
- [ ] In-scope ACs MET with tests written first and passing
- [ ] Blocking decisions answered; non-blocking defaults used are noted
- [ ] Empty/loading/error/permission states handled as the PRD lists
- [ ] Relevant suite green (§5)
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
`PROJECT STATUS` · `NEXT FEATURE [lane]` · `FEATURE STATUS <ID>` · `START FEATURE <ID>` · `RESUME` · `END SESSION`. Full definitions: `docs/AGENT_COMMANDS.md`. Always run `END SESSION` before stopping for any reason.

---

## 12. Safety and privacy
Client data is health and financial information about vulnerable people. Only synthetic fixtures/seed data. Never copy credentials found in source documents. No analytics or external services without a recorded decision.

---

## 13. File map
| Need | File |
|---|---|
| Lane schedule, staffing, daily rhythm | `docs/SPRINT_PLAN.md` |
| Command definitions | `docs/AGENT_COMMANDS.md` |
| Reference tables (folder ownership, test matrix, status values, phase table) | `docs/AGENT_REFERENCE.md` |
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

## 14. Next.js version rules
This project uses a recent Next.js whose APIs and file conventions may differ from your training data (for example, request middleware is `proxy.ts` in Next.js 16). Before writing Next.js code — routing, layouts, server actions, caching, proxy/middleware, config — read the relevant guide in `node_modules/next/dist/docs/` and follow deprecation notices. If a guide conflicts with ARCHITECTURE.md, follow the guide, record it in the feature DECISIONS.md and flag it for a controlled change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
