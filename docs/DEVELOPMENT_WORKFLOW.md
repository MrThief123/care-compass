# Development Workflow — Care Compass

This document defines the exact lifecycle of every feature, the Git flow, PR template and release process. `CLAUDE.md` is the behavioural contract; this file is the procedure.

---

## 1. Feature lifecycle

```
Requirement (PRD.md REQ-xx, traced to source)
↓
Feature defined (DEVELOPMENT_PLAN.md row + detail card)
↓
Feature documentation created (docs/development/<stream>/<slug>/ from templates)
↓
Jira ticket created (import docs/JIRA_BACKLOG.csv; ticket key recorded in feature PROGRESS.md)
↓
Blocking decisions answered (DECISIONS.md) → status PLANNED
↓
Feature branch located or created from `main` (CHG-036)
↓
Feature documentation read (PRD, stories, AC, test plan, progress, session state, decisions)
↓
Existing implementation inspected
↓
Tests written (from TEST_PLAN.md) → committed
↓
Tests run → fail for the expected reason (recorded)
↓
Implementation written (scope only)
↓
Tests pass → full relevant suites pass
↓
Feature validation (AC walk-through, design comparison with Figma/screens, accessibility check)
↓
Progress updated · Session state updated · Decisions recorded
↓
Meaningful commits pushed
↓
Latest `main` merged in; relevant suite green locally → PR raised to `main` → status PR OPEN
↓
Human review (+ CI green when available) → merged → status MERGED TO DEV (means "merged to `main`")
↓
Regression + e2e on `main` (§9) → IN DEVELOPMENT TESTING
↓
Checkpoint checks pass (§10) → READY FOR PRODUCTION
↓
Release candidate passes Checkpoint 3 → COMPLETE
```

---

## 2. Stage gates (plan v0.2)

| Gate | Entry condition | Allowed work |
|---|---|---|
| G0 Planning pack imported | Docs copied into repo | F0-01 only (after OQ-01 and OQ-20 answered) |
| G1 Plan validated | F0-01 merged; `docs/VALIDATION_REPORT.md` approved by human | Phase 0 (lane S) and Phase 2 (lane B) in parallel |
| Per feature | All dependencies merged; every blocking decision in its PRD ANSWERED by the human | That feature (`node scripts/plan-status.mjs` lists it as ready) |
| Checkpoint 1 (end D7) | All Phase 1 screens merged | Clickable prototype on fixtures on `main` |
| Checkpoint 2 (end D10) | Core wiring merged to `main` | Checks in §10 on `main` |
| Checkpoint 3 (end D12) | Integration journeys green | Release candidate on `main` |

There is no "foundation released" gate any more: a feature starts as soon as the parts it depends on are on `main`.

Open decisions stay OPEN until the human closes them. A blocked feature stays blocked; the lane picks other ready work.

---

## 3. Branching

### 3.1 Long-lived branches
| Branch | Purpose | Direct commits |
|---|---|---|
| `main` | Production and the only integration branch; always releasable | Never (PR merges only) |

`family-dev`, `carer-dev` and `admin-dev` were retired by CHG-036 (2026-09-30), once all their work was on `main`. Never branch from, commit to or PR to them. They stay on origin until a human deletes them.

### 3.2 Feature branches
- Name: `feature/<slug>` (slug = feature doc folder, always prefixed by stream: `family-`, `carer-`, `admin-`, `shared-`). Screen features use `<stream>-ui-<screen>` (e.g. `feature/family-ui-home`).
- Parent and PR target: `main`, for every stream (CHG-036; shared features already did this per OQ-01).
- One feature per branch; keep it short-lived and the PR small. Delete after merge (human).

### 3.3 Creating or resuming a feature branch
```bash
git status                                   # must be clean or explained
git fetch origin
git checkout main && git pull --ff-only
if git show-ref --verify --quiet refs/heads/feature/<slug> || git ls-remote --exit-code --heads origin feature/<slug>; then
  git checkout feature/<slug> && git pull --ff-only
  git log --oneline main..HEAD               # inspect existing progress
else
  git checkout -b feature/<slug> main
  git push -u origin feature/<slug>
fi
git merge-base --is-ancestor main HEAD && echo "parent OK"
```

### 3.4 Keeping a feature branch current
Merge (not rebase, since branches are pushed) `main` into the feature branch at the start of each day and again before opening the PR: `git merge origin/main`. Conflicts in files outside the feature's scope → stop and ask.

### 3.5 Shared code, migrations and contracts
- Shared components live only in the kits (F0-14, F0-15, UI-00..03) and are changed only by lane S shared PRs to `main`. A dashboard feature that needs a change records it in its DECISIONS.md and asks; it may build a local wrapper in `src/features/<screen>/` meanwhile.
- **Migrations:** create each with `supabase migration new` so the version is a real, unique timestamp; never hand-pick or reuse one. One feature changes a given table's schema at a time. Keep changes additive: add → backfill → drop in a later PR; never rename or drop a column in the PR that stops using it. A PR that alters a table another feature reads says so in its summary.
- **Contracts:** two in-flight features that change the same `src/server/**` contract function are sequenced; the second waits for the first to merge.
- **Pre-PR check:** while CI is unavailable, run the relevant suite locally after merging the latest `main` and list the commands and results in the PR (§8).
- A feature is implementable when its dependencies are merged to `main`.

### 3.6 Claiming and working in parallel
1. Run `node scripts/plan-status.mjs --lane <X>` and pick a feature under **Ready to start** (or one the human assigned).
2. Create the branch (§3.3). Set `Owner: <name>` and `Status: IN PROGRESS` in its PROGRESS.md; commit `docs(<slug>): claim`; push immediately. The pushed branch is the claim.
3. If the branch already exists on origin with another owner, don't touch it; pick another feature.
4. Edit a feature's PROGRESS.md and SESSION_STATE.md only on its own branch. The root PROGRESS.md status section is generated (`--write`) on `main` in a status-sync PR or at checkpoints.
5. For several sessions on one machine, use one git worktree per feature: `git worktree add ../care-compass-<lane> feature/<slug>`. Usage limits are per account, so extra sessions don't add capacity.

---

## 4. Branch protection (applied by a human in GitHub)

For `main`:
- Require pull request before merging; ≥1 approving review
- Require status checks: lint, typecheck, format, unit, build, audit, commitlint (+ db tests and e2e once enabled)
- Require branches up to date before merging
- Disallow force pushes and deletions
- `main` additionally: restrict who can merge to the release owner(s)

---

## 5. Commit conventions
See CLAUDE.md §7. Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `build`, `perf`, `style`. Breaking database changes use `feat(db)!:` with a migration note in the body.

---

## 6. Jira
- Tickets: `docs/JIRA_TICKETS.md` (readable, one Story per feature under five Epics) and `docs/JIRA_BACKLOG.csv` (import: Epic rows first, Stories reference them via Parent ID).
- Record the Jira key at the top of the feature PROGRESS.md.
- Jira fields added in v0.2: Sprint bucket (SPRINT/STRETCH/POST-SPRINT), Lane, Planned days. Assign the ticket to the person who claimed the branch.
- Jira status mapping: NOT STARTED/PLANNED → To Do; IN PROGRESS/IMPLEMENTED → In Progress; READY FOR PR/PR OPEN → In Review; MERGED TO DEV/IN DEVELOPMENT TESTING/READY FOR PRODUCTION → Testing; COMPLETE → Done; BLOCKED → Blocked flag.
- The repository documents remain the source of truth for AI sessions; Jira mirrors them.

---

## 7. PR approval gate

Claude Code never opens a PR unprompted, even once a feature meets the Definition of Done (CLAUDE.md §8). Instead:

1. On reaching Definition of Done, report status and state readiness to open the PR, then stop.
2. Wait for explicit human approval (e.g. "yes").
3. On approval, update the feature's `PROGRESS.md` / `SESSION_STATE.md` to `PR OPEN` (§1) on the same feature branch, commit it together with the final implementation work, push, then open the PR — as one unit. The docs update ships inside the PR, not before or after it.
4. Never create a separate branch after a PR merges solely to update docs saying "PR was merged" — that status flows through the normal `MERGED TO DEV` update (§8) on the next touch of that feature, not a dedicated cleanup branch.

---

## 8. Pull request template

Title: `<ID> <Feature name>` (e.g. `FAM-01 Family Home — Today day-view timeline`)

```markdown
## Summary
<what the feature does, 2–4 sentences>

## Feature
- ID / docs: <ID> — docs/development/<stream>/<slug>/
- Jira: <key>
- Target branch: `main`
- Latest `main` merged at: <sha>
- Tables / contracts other features read that this PR changes: None / <list>

## Requirements addressed
- REQ-xx …

## User stories addressed
- US-01 …

## Acceptance criteria
| AC | Status | Test(s) |
|---|---|---|
| AC-01 | MET | T-01 |

## Tests
- Added: <n> (unit x, component x, integration x, db x, e2e x) — written before implementation (commit <sha>)
- Commands run and results:
  - `npm run verify` → pass
  - `supabase test db` → pass (n tests)
  - `npx playwright test tests/e2e/<feature>.spec.ts` → pass

## Test changes after implementation began
- None / <test ID — reason — link to DECISIONS entry> **HUMAN REVIEW: test expectation changed**

## Decisions
- <FD/PD IDs and one-line summary>
- PROPOSED items relied on: <list>

## Screenshots
<Figma frame vs implementation, for UI features>

## Known limitations
- …

## Follow-up work
- <new feature IDs or parking lot items>
```

---

## 9. Testing on `main`
After each merge to `main`:
1. CI (when available) runs lint, typecheck, unit/component, build, db and integration jobs on `main`. While CI is down, the PR's local run (§3.5) stands in for it.
2. Update the merged feature to MERGED TO DEV (meaning merged to `main`).
3. Before a checkpoint, run the axe checks and the e2e specs that exist on `main`; move features to IN DEVELOPMENT TESTING, then READY FOR PRODUCTION when they pass.
4. Defects: fix on `fix/<short>` or `feature/<stream>-fix-<short>` from `main` (minimal docs: PRD summary, AC, TEST_PLAN, PROGRESS), never directly on `main`.

---

## 10. Checkpoints

Plan v0.2 replaces per-dashboard phase releases with three team checkpoints. Since CHG-036 everything is already on `main`, so a checkpoint is a check and a tag, not a merge:

| Checkpoint | When | Contents | Exit check |
|---|---|---|---|
| 1 — Prototype | End of D7 | All Phase 1 screens on fixtures; Phase 0 kit; backend features merged so far | Every designed screen renders with fixtures; `npm run verify` green on `main` |
| 2 — Wired core | End of D10 | Phase 3 wiring merged so far | `npm run verify`, `supabase test db`, `npm run test:integration` green on `main` |
| 3 — Release candidate | End of D12 | Integration journeys (INT-02..04) | Above + Playwright journeys green; demo script rehearsed |

Procedure:
1. Lane owners confirm which features are MERGED TO DEV (on `main`); unfinished features stay on their feature branches.
2. Run the exit check on `main` (locally while CI is down). Claude Code may prepare the checkpoint summary: features, AC status, test results, migrations, known gaps, open decisions still blocking.
3. Run `node scripts/plan-status.mjs --write` on `main`; update root SESSION_STATE.md with a checkpoint entry.
4. Tag `checkpoint-<n>-<yyyy-mm-dd>` (human or on instruction). Features in the RC that pass Checkpoint 3 become COMPLETE.
5. Hosted migrations are applied only by the documented runbook (INT-08) after OQ-17 is answered.

---

## 11. Session hygiene
- Start: CLAUDE.md §1 reading order.
- During: update feature PROGRESS.md at each meaningful step; commit.
- End (always, including before likely context/usage exhaustion): run `END SESSION` (CLAUDE.md §11) — update the feature's SESSION_STATE.md and PROGRESS.md on its branch; commit and push. Root files are updated only in status-sync or checkpoint PRs to `main`.
