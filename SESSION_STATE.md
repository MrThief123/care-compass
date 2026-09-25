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

---

### 2026-09-20 — Post-merge sync after UI-04, the F0-15 fix, FAM-UI-01 and FAM-UI-07 (Claude Code, repository access)
**Worked on**
- PRs #52 (UI-04) and #53 (F0-15 sticky rail and wrapping header fix) merged to `main`; #56 synced `main` into `family-dev`; #54 (FAM-UI-01) and #55 (FAM-UI-07) merged to `family-dev`. Status left stale by those merges: UI-04 still said `READY FOR PR` on `main`; FAM-UI-01 and FAM-UI-07 still said `PR OPEN` on `family-dev`; the root `PROGRESS.md` Overall table listed six merged features and the generated Status block predated the merges. This is the third time a merged PR has left its feature's `Status:` field stale (see the 2026-09-18 warning above).
- `carer-dev` and `admin-dev` were 18 commits behind `main` (last synced by #50 and #51 on 2026-09-19, before UI-04 and the F0-15 fix).

**What changed**
- `docs/development/shared/shared-screen-contracts-fixtures/PROGRESS.md` and `SESSION_STATE.md`: `READY FOR PR` → `MERGED TO DEV`; the "PR not opened" and "ask for approval" lines and the stale FD-04 switch warning replaced (the human answered FD-04 and FD-05 on 2026-09-20; fixtures unchanged).
- Root `PROGRESS.md`: regenerated Status block via `node scripts/plan-status.mjs --write`; hand-updated the `## Overall` merged list and next human actions.
- This entry.

**Tests run**
- None — docs-only changes. `node scripts/plan-status.mjs` re-run to confirm UI-04 now counts as merged (lane S 11 of 11).

**Exact next action**
- Human: merge this PR, then the three `main` → dev-branch sync PRs (`carer-dev`, `admin-dev`, `family-dev`). The `family-dev` sync also flips FAM-UI-01 and FAM-UI-07 to `MERGED TO DEV`, since `main` must not edit lane F docs.
- Human: delete the merged branches (CLAUDE.md §3 keeps branch deletion with the human).

**Warnings**
- `plan-status.mjs` reads the working tree only, so on `main` FAM-UI-01 and FAM-UI-07 still read "ready to start" until Checkpoint 1 merges `family-dev`. Lane F sessions read it on `family-dev`. Starting FAM-UI-01 or FAM-UI-07 from `main` would collide with the merged branches.
- The stale-`Status:` problem has now recurred three times: add the explicit post-merge step to `docs/DEVELOPMENT_WORKFLOW.md` (a controlled-workflow change, so the human decides).

---

### 2026-09-25 — Docs sync after PRs #78 to #109 (Claude Code, repository access)
**Worked on**
- Catch-up log for PRs merged since 2026-09-20. To `main`: #78 CHG-009 (tasks and plain events), #80 CHG-010 (self-serve sign-up), #81 UI-05, #82/#94 CI off then on, #83 Docker env ignore, #90 F0-10 status sync, #91 F0-08. To `family-dev`: #79 FAM-UI-03, #84 `main` sync, #85 to #88 CHG-014 to CHG-017, #89 FAM-UI-04, #92 FAM-UI-05, #93 FAM-UI-06, #98 status sync, #99 FAM-UI-08, #100 status strings, #102/#104 FAM-12, #103/#105/#108 FAM-13, #107 F0-11, #109 events contract fix. To `admin-dev`: #95 ADM-UI-01, #96 ADM-UI-02, #97 ADM-UI-03.
- Stale docs found: root `PROGRESS.md` Overall and Known risks dated 2026-09-20 (listed answered OQs as open); CHG-023 and CHG-024 confirmed only in FAM-UI-06 DECISIONS.md; the CHG-009 follow-up commit on `docs/chg-009-tasks-vs-events` never landed; ADM-UI-01 to 03 docs on `admin-dev` still `IN PROGRESS` after merging.

**What changed**
- Landed the CHG-009 follow-up (FAM-UI-03 shows the task switch; forms-kit follow-up listed); PRD REQ-35 conflict resolved by keeping REQ-36 to 38 and adding FAM-UI-03.
- Root DECISIONS.md §5: CHG-023 and CHG-024 mirrored from FAM-UI-06.
- Root `PROGRESS.md`: Overall and Known risks rewritten. Generated Status block left as is.
- `admin-dev` status sync goes in a separate PR to `admin-dev` (lane A's tree).

**Tests run**
- None — docs only. `node scripts/plan-status.mjs` run to confirm statuses.

**Exact next action**
- Human: review and merge this PR and the `admin-dev` status PR; merge `main` into `admin-dev` and `carer-dev` (52 commits behind); assign lane owners in `docs/SPRINT_PLAN.md` §2.

**Warnings**
- Merged PRs keep leaving feature `Status:` stale (ADM-UI-01 to 03 this time). The post-merge step suggested on 2026-09-18 is still not in `docs/DEVELOPMENT_WORKFLOW.md`.
