# SESSION STATE — Care Compass (root, team log)

Root session state is a **team-level log**. Update it only in daily sync PRs or checkpoint PRs on `main`, never on feature branches. Live per-feature state lives in `docs/development/**/<slug>/SESSION_STATE.md`. Live status: `node scripts/plan-status.mjs`.

---

## Log

### 2026-09-17 — Planning pack v0.2 (Claude chat, no repository access)
**Worked on**
- v0.1 (earlier the same day): read the client documents, the Confluence SD export, Figma Foundations and 20 exported screens, then produced the full pack (58 features).
- v0.2: at the human's request, restructured for a **2-week parallel sprint, UI first**. Dashboards now run at the same time, and more than one person works from this shared plan.

**What changed in v0.2**
- 78 features (66 SPRINT, 3 STRETCH, 9 POST-SPRINT) in 5 phases and 6 lanes. New features:
  - UI-00 contracts + fixtures
  - UI-01 calendar kit, UI-02 forms kit, UI-03 lists/cards kit
  - 16 screen-on-fixtures features (FAM-UI-01..07, CAR-UI-01..04, ADM-UI-01..05)
- FAM/CAR/ADM features became data-wiring features that depend on their screen plus the backend; cross-dashboard dependencies were removed.
- `client_info_sections` moved from FAM-09 to F0-06. Shared component ownership moved from FAM-04/06/13 to the kits.
- Phase-end releases were replaced by continuous shared PRs to `main`, daily `main` → dev syncs and checkpoints at D7, D10 and D12.
- Coordination for several people:
  - claiming via the pushed branch plus the `Owner:` field
  - folder ownership by lane
  - a generated root status (`scripts/plan-status.mjs`)
  - git worktrees
- New files: `docs/SPRINT_PLAN.md`, `scripts/plan-status.mjs`. CLAUDE.md was rewritten, with the Next.js rules in §15 (AGENTS.md removed at the human's request).
- Jira tickets and CSV regenerated with Sprint, Lane and Planned days.
- DECISIONS.md:
  - PD-011 superseded.
  - PD-026 to PD-029 added.
  - C-25 added.
  - **All OQs remain OPEN.** The human will close them personally.

**Tests run**
- `node scripts/plan-status.mjs --write` ran against the generated docs. Result: no feature ready, because F0-01 waits on OQ-01 and OQ-20.
- Consistency checks: every feature folder has 7 files; all dependencies exist; no sprint feature depends on a post-sprint one; dependency day order is valid.

**Blockers**
- OQ-01 (branching for shared work) and OQ-20 (repository/infrastructure reality) block F0-01 and therefore everything.
- The critical-path decisions and the day each first blocks work are in `docs/SPRINT_PLAN.md` §4.

**Discoveries carried from v0.1**
- Figma MCP exposed only Foundations. Admin Staff, Clients and Settings and the States sheet still need exporting to `docs/design/screens/`.
- Client Information Sheet 4 (budgeting) was not supplied, so the budget model is unconfirmed.
- Source documents contain third-party credentials. Never copy them.

**Exact next action**
1. Human:
   - Merge this pack into the repository root on `main` (delete AGENTS.md and the `@AGENTS.md` line).
   - Export the missing screens.
   - Fill the lane owners in `docs/SPRINT_PLAN.md` §2.
2. Human: go through DECISIONS.md §3 and close decisions, starting with OQ-01 and OQ-20.
3. Lane S owner: `START FEATURE F0-01` once `plan-status` lists it as ready.
4. Lane B owner: install Docker and the Supabase CLI while F0-01 runs.

**Warnings**
- No application code before F0-01 is merged and its validation report approved (G1).
- No `feature/shared-*` branch until OQ-01 is answered.
- Never act on a proposed default for a blocking decision. Treat every PROPOSED label as unconfirmed.

---

### 2026-09-18 — Doc-drift cleanup: status corrections, attribution rule (Claude Code, repository access)
**Worked on**
- Found via `gh pr list` that F0-05 (PR #9), F0-09 (PR #10) and UI-00 (PR #11) were all merged to `main`, but each feature's own `PROGRESS.md` still said `Status: PR OPEN` — the merge never triggered a doc update. Root `PROGRESS.md`'s generated Status block was also a day stale (predated all three merges), and `docs/VALIDATION_REPORT.md`'s sign-off checkbox/signature were left blank even though DECISIONS.md §1 already records the human's G1 approval.
- Added a repo-wide rule (CLAUDE.md §8): commits/PRs must not carry `Co-Authored-By: Claude …` trailers or a "Generated with Claude Code" footer — human request, applies to every session on this repo.

**What changed**
- `docs/development/shared/shared-design-tokens/PROGRESS.md`: `PR OPEN` → `MERGED TO DEV` (branch `docs/fix-f0-05-status`, PR #13, open).
- `docs/development/shared/shared-recurrence-engine/PROGRESS.md` and `docs/development/shared/shared-domain-contracts-fixtures/PROGRESS.md`: same correction (this branch, `chore/refresh-project-status`).
- Root `PROGRESS.md`: regenerated Status block via `node scripts/plan-status.mjs --write`; hand-updated the `## Overall` table (Stage → G1, merged-to-main list, next human actions).
- `docs/VALIDATION_REPORT.md`: sign-off checkbox checked, signature/date filled to match the approval already recorded in DECISIONS.md §1.
- CLAUDE.md §8: added the no-AI-attribution rule (branch `docs/no-ai-attribution`, PR #14, open).

**Tests run**
- None — docs-only changes, nothing to run.

**Exact next action**
- Human: merge PR #13, PR #14 and this branch's PR. Re-run `node scripts/plan-status.mjs --write` once all three land, since each merge changes feature counts.
- Human: lane owners in `docs/SPRINT_PLAN.md` §2 are still blank — assign before more lanes start.
- Next ready-to-start features once caught up: F0-03 (CI pipeline), F0-04 (Supabase env) — both lane S/B, unclaimed.

**Warnings**
- This is the second time a merged PR left its feature's `Status:` field stale — consider adding "update PROGRESS.md to MERGED TO DEV" as an explicit post-merge step in `docs/DEVELOPMENT_WORKFLOW.md` if it recurs a third time.
