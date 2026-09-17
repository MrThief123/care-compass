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
Dashboard development branch identified (PRD header)
↓
Feature branch located or created from that dev branch
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
PR raised to dashboard dev branch → status PR OPEN
↓
Human review + CI green → merged → status MERGED TO DEV
↓
Development-branch testing (dashboard regression + e2e) → IN DEVELOPMENT TESTING
↓
Checkpoint 2 or 3 checks pass (§9) → READY FOR PRODUCTION
↓
Merged to `main` at a checkpoint and Checkpoint 3 checks pass (§9) → COMPLETE
↓
Downstream sync (main merged into the other dev branches)
```

---

## 2. Stage gates (plan v0.2)

| Gate | Entry condition | Allowed work |
|---|---|---|
| G0 Planning pack imported | Docs copied into repo | F0-01 only (after OQ-01 and OQ-20 answered) |
| G1 Plan validated | F0-01 merged; `docs/VALIDATION_REPORT.md` approved by human | Phase 0 (lane S) and Phase 2 (lane B) in parallel |
| Per feature | All dependencies merged; every blocking decision in its PRD ANSWERED by the human | That feature (`node scripts/plan-status.mjs` lists it as ready) |
| Checkpoint 1 (end D7) | All Phase 1 screens merged to dev branches | Dev branches → `main`: clickable prototype on fixtures |
| Checkpoint 2 (end D10) | Core wiring merged | Dev branches → `main` |
| Checkpoint 3 (end D12) | Integration journeys green | Release candidate on `main` |

There is no "foundation released" gate any more: screens start as soon as the kit parts they depend on are on `main` and synced.

Open decisions stay OPEN until the human closes them. A blocked feature stays blocked; the lane picks other ready work.

---

## 3. Branching

### 3.1 Long-lived branches
| Branch | Purpose | Direct commits |
|---|---|---|
| `main` | Production; always releasable | Never |
| `family-dev` | Family dashboard integration | Never (PR merges only) |
| `carer-dev` | Carer dashboard integration | Never |
| `admin-dev` | Admin dashboard integration | Never |

### 3.2 Feature branches
- Name: `feature/<slug>` (slug = feature doc folder, always prefixed by stream: `family-`, `carer-`, `admin-`, `shared-`). Screen features use `<stream>-ui-<screen>` (e.g. `feature/family-ui-home`).
- Parent: the stream's dev branch. Shared features (lanes S, B, shared I): per **OQ-01**. Plan v0.2 assumes from `main`, PR to `main`, human review, then daily downstream sync. Don't create `feature/shared-*` branches until OQ-01 is answered.
- One feature per branch. Delete after merge (human).

### 3.3 Creating or resuming a feature branch
```bash
git status                                   # must be clean or explained
git fetch origin
git checkout <dev-branch> && git pull --ff-only
if git show-ref --verify --quiet refs/heads/feature/<slug> || git ls-remote --exit-code --heads origin feature/<slug>; then
  git checkout feature/<slug> && git pull --ff-only
  git log --oneline <dev-branch>..HEAD       # inspect existing progress
else
  git checkout -b feature/<slug> <dev-branch>
  git push -u origin feature/<slug>
fi
git merge-base --is-ancestor <dev-branch> HEAD && echo "parent OK"
```

### 3.4 Keeping a feature branch current
Merge (not rebase, since branches are pushed) the dev branch into the feature branch when it moves ahead: `git merge origin/<dev-branch>`. Conflicts in files outside the feature's scope → stop and ask.

### 3.5 Shared code and daily sync (replaces release-then-sync)
- Shared components live only in the kits (F0-14, F0-15, UI-00..03) and are changed only by lane S shared PRs to `main`. A dashboard feature that needs a change records it in its DECISIONS.md and asks; it may build a local wrapper in `src/features/<screen>/` meanwhile.
- **Daily sync:** each dashboard lane owner opens and merges a PR `main` → `<dashboard>-dev` at the start of the day, and again whenever a shared feature they need lands. Feature branches then merge their dev branch (§3.4).
- A dashboard feature is implementable when its dependencies are on `main` (shared) or its own dev branch, and synced.

### 3.6 Claiming and working in parallel
1. Run `node scripts/plan-status.mjs --lane <X>` and pick a feature under **Ready to start** (or one the human assigned).
2. Create the branch (§3.3). Set `Owner: <name>` and `Status: IN PROGRESS` in its PROGRESS.md; commit `docs(<slug>): claim`; push immediately. The pushed branch is the claim.
3. If the branch already exists on origin with another owner, don't touch it; pick another feature.
4. Edit a feature's PROGRESS.md and SESSION_STATE.md only on its own branch. The root PROGRESS.md status section is generated (`--write`) on `main` during the daily sync or at checkpoints.
5. For several sessions on one machine, use one git worktree per lane: `git worktree add ../care-compass-<lane> <branch>`. Usage limits are per account, so extra sessions don't add capacity.

---

## 4. Branch protection (applied by a human in GitHub)

For `main`, `family-dev`, `carer-dev`, `admin-dev`:
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
- Target branch: <dev-branch>

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

## 9. Development-branch testing
After each merge into a dev branch:
1. CI runs lint, typecheck, unit/component and build on the dev branch (integration and db jobs once F0-06 exists).
2. Update the merged feature to MERGED TO DEV.
3. Before a checkpoint, run the dashboard's axe checks and any e2e specs that exist; move features to IN DEVELOPMENT TESTING, then READY FOR PRODUCTION when they pass.
4. Defects: fix on `feature/<stream>-fix-<short>` from the dev branch (minimal docs: PRD summary, AC, TEST_PLAN, PROGRESS), never directly on the dev branch.

---

## 10. Checkpoints (dev → main)

Plan v0.2 replaces per-dashboard phase releases with three team checkpoints:

| Checkpoint | When | Contents | Exit check |
|---|---|---|---|
| 1 — Prototype | End of D7 | All Phase 1 screens on fixtures; Phase 0 kit; backend features merged so far | Every designed screen renders with fixtures; `npm run verify` green on `main` |
| 2 — Wired core | End of D10 | Phase 3 wiring merged so far | `npm run verify`, `supabase test db`, `npm run test:integration` green on `main` |
| 3 — Release candidate | End of D12 | Integration journeys (INT-02..04) | Above + Playwright journeys green; demo script rehearsed |

Procedure for each dev branch:
1. Lane owner confirms included features are MERGED TO DEV with CI green; unfinished features stay on their feature branches (they are not in the dev branch yet).
2. Claude Code may prepare the PR description: features, AC status, test results, migrations, known gaps, open decisions still blocking.
3. Open PR `<dev-branch>` → `main`. **Human approval required.** Merge the three dev branches one at a time; after each, re-run CI on `main`.
4. Sync `main` back into all dev branches the same day.
5. Run `node scripts/plan-status.mjs --write` on `main`; update root SESSION_STATE.md with a checkpoint entry.
6. Tag `checkpoint-<n>-<yyyy-mm-dd>` (human or on instruction). Features in the RC that pass Checkpoint 3 become COMPLETE.
7. Hosted migrations are applied only by the documented runbook (INT-08) after OQ-17 is answered.

---

## 11. Session hygiene
- Start: CLAUDE.md §1 reading order.
- During: update feature PROGRESS.md at each meaningful step; commit.
- End (always, including before likely context/usage exhaustion): run `END SESSION` (CLAUDE.md §11) — update the feature's SESSION_STATE.md and PROGRESS.md on its branch; commit and push. Root files are updated only in sync/checkpoint PRs.
