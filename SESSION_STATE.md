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
