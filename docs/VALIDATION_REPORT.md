# Validation Report — F0-01

Feature: F0-01 Validate planning pack against repository, Figma and sources
Branch: `feature/shared-plan-validation` · Date: 17 September 2026 · Run by: Claude Code (Dhruv Verma, owner)

This report is the evidence base for Gate **G1 — Plan validated**. Gate G1 also requires this report to be **approved by the human** — see "Sign-off" at the end. Approved 17 September 2026; the planning freeze is recorded in DECISIONS.md §1.

---

## 1. Repository inspection

| Check | Result | Evidence |
|---|---|---|
| Package manager | npm | `package-lock.json` present; no `yarn.lock`/`pnpm-lock.yaml` |
| Framework / version | Next.js 16.3.3, App Router | `package.json` `"next": "16.3.3"`; `src/app/layout.tsx`, `src/app/page.tsx` exist; no `pages/` directory |
| React version | 19.2.8 | `package.json` |
| TypeScript | 5.x, `strict: true` | `tsconfig.json` |
| Styling | Tailwind v4 | `package.json` `"tailwindcss": "^4"`, `"@tailwindcss/postcss": "^4"`; `postcss.config.mjs` |
| Lint | ESLint 9, `eslint-config-next` (core-web-vitals + typescript) | `eslint.config.mjs`. No custom rule yet enforcing "never import `src/mocks` from `src/app`/`src/features`" (ARCHITECTURE.md §12) — expected, since `src/mocks` doesn't exist until UI-00; not a discrepancy, just not yet due. |
| Existing app code | Only the default `create-next-app` scaffold | `src/app/page.tsx` is the stock Next.js starter page; no domain code, no `src/server`, `src/components`, `src/lib`, `src/mocks` |
| `supabase/` directory | Absent | `ls supabase` → no such file or directory |
| Test framework | None installed | No Vitest/Jest/Playwright/pgTAP in `package.json`; matches ARCHITECTURE.md §2 labels (all PROPOSED, not yet installed) |
| CI | `.github/workflows/ci.yaml` exists | Steps: checkout, setup Node 22, `npm ci`, `npm audit --audit-level=high`, `npm outdated` (informational), `npm run lint`, `npx tsc --noEmit`, `npm run build`, upload build artifact. **Test step is present but commented out** (`# - name: Test`) — no test framework to run yet. **No commitlint step.** |
| Branches on origin (at start of F0-01) | `main`, `chore--test-pull-request`, `chore/typo-pipeline`, `chore/update-pipeline` (historical, already merged), `feature/shared-plan-validation` (this feature) | `git branch -a` |
| `docs/sources/` | Only `README.md` (a manifest); none of the "required but missing" source documents it lists have been added | `ls docs/sources` |

### Discrepancy: team-meeting report (TM-0409) vs. actual repository

TM-0409 (4/9 team meeting) reported a live repository with CI, a Supabase schema and RLS tests for all four roles. The actual repository has:
- A CI workflow, but scoped to lint/typecheck/build/audit only — **no Supabase schema, no RLS tests, no database at all** (`supabase/` does not exist).
- No application code beyond the Next.js starter template.

This confirms the human's report over TM-0409, per PD-031 (OQ-20, ANSWERED 2026-09-17): *"the current repository (empty Next.js scaffold) is treated as the actual starting state... the 4/9 team-meeting report... does not apply here."* No further action needed — OQ-20 was already answered on this basis; this inspection corroborates it with direct evidence rather than superseding it.

---

## 2. Figma inspection

Checked via Figma MCP `get_metadata` against file `DFcLy7U1caCVNlhT6eazF5`.

- Top-level page listing returns exactly one page: `01 · Foundations` (node `0:1`).
- Drilling into `0:1` returns two frames: `Foundations · Colour` (`3:2`) and `Foundations · Type, Space, Radius` (`3:100`), matching the token values already recorded in ARCHITECTURE.md §4.
- Pages 02–06 (screens, states) are **still not reachable** — same gap recorded in DECISIONS.md OQ-19 at planning time. Nothing has changed on the Figma MCP side.

Recorded in `docs/design/FIGMA_INDEX.md` (new file), including node IDs and the re-check procedure for a future session where more pages become visible.

Per PD (OQ-19, ANSWERED 2026-09-17): this gap does not block F0-01, and screens are built from `docs/design/screens/*` (exported images) plus the Foundations tokens; any control missing from both is a design gap to flag per-PR, not a reason to pause.

---

## 3. `docs/sources/` check (OQ-19 cross-reference)

`docs/sources/README.md` lists documents required but missing at planning time (Client Information Sheet No 4, workshop decks, UI Spec v1/handoff docs, Domain Model/Wireframes/sequence diagrams, sample Care Need Items) and documents supplied but not yet copied in. As of this check, **no new source files have been added** to `docs/sources/` — only the manifest `README.md` exists.

This does not block F0-01 or Gate G1. It does mean:
- OQ-04's proposed default ("Obtain CIS4 before F0-12") still needs CIS4 obtained before F0-12 starts.
- Any feature whose PRD cites one of these missing documents as a source is working from the manifest's description of it, not the primary document.

No DECISIONS.md changes needed here — this is status quo, not a new discrepancy.

---

## 4. Decisions status (DECISIONS.md)

Both Gate 0 decisions are ANSWERED:
- **OQ-01** (branch parent/naming for shared work) — ANSWERED 2026-09-17, PD-030, Option B.
- **OQ-20** (repository/infrastructure reality) — ANSWERED 2026-09-17, PD-031.

Full sweep of the open-decisions table (`DECISIONS.md` §3): every decision marked **Blocking: YES** currently has **Status: ANSWERED**. The decisions still **OPEN** (OQ-02, OQ-18, OQ-21, OQ-23, OQ-24, OQ-30, OQ-31, OQ-32, OQ-34, OQ-37, OQ-38, OQ-39) are all marked **Blocking: no** — each uses its proposed default and does not stop any feature.

**Conclusion: no feature is currently blocked by an open blocking decision.** `node scripts/plan-status.mjs` independently confirms this (see §5) — every lane reports 0 "waiting on decisions."

No feature's PRD needed a blocker correction — none listed a blocking OQ that is still OPEN, and none was missing a blocker for one that is (spot-checked the PRDs of F0-01 through F0-16, UI-00 through UI-03; all "Blocking open decisions" lines match DECISIONS.md's current status).

---

## 5. Feature status re-derivation

`docs/development/**/PROGRESS.md` files' `Status:` field, plus each feature's PRD `Dependencies` line, plus `DECISIONS.md`'s OQ status table are the live source of truth — computed on demand by `node scripts/plan-status.mjs`, per CLAUDE.md §1 ("never hand-count"). `DEVELOPMENT_PLAN.md`'s backlog table Status column is explicitly documented there as **initial only** ("live status comes from each feature PROGRESS.md via `node scripts/plan-status.mjs`") and is intentionally left as originally drafted rather than hand-edited to avoid drifting out of sync with the generated source of truth.

Ran `node scripts/plan-status.mjs --write` to refresh the generated block in root `PROGRESS.md`. Current result:
- **Ready to start:** none (F0-01 is claimed/in-flight; everything else is correctly gated on F0-01 or its dependents — no feature is ready to start until F0-02 exists, which is expected: F0-02 depends on F0-01 merging).
- **Claimed / in flight:** F0-01 only (this feature, owner Dhruv Verma, IN PROGRESS).
- **Waiting on decisions, all lanes:** 0 — confirms §4's conclusion mechanically.
- All other features remain **NOT STARTED**, waiting on feature dependencies (never on an open decision).

This satisfies AC-03: no feature is listed as ready/PLANNED while a blocking decision it depends on is OPEN, because none currently has one.

---

## 6. ARCHITECTURE.md updates made

Labels changed from PROPOSED/UNKNOWN to CONFIRMED (or annotated) using the repository facts above and the now-answered OQ-17/OQ-19/OQ-20:
- Header status: DRAFT → validated, pointing at this report.
- "Repository state" paragraph (§1): UNKNOWN until F0-01 → CONFIRMED, with the actual stack and the CI/Supabase/RLS discrepancy spelled out.
- Scheduled job runner / email provider / hosting (§1 diagram and §2 table): UNKNOWN (OQ-17) → CONFIRMED (PD-050 — Vercel + Supabase paid tier + Resend/Supabase SMTP + Vercel Cron/pg_cron).
- Commits / CI rows (§2): corrected to reflect that commitlint is not yet in CI (PROPOSED, not CONFIRMED) and that the CI test step exists but is commented out pending a test framework.
- External integrations (§8): Supabase, email, scheduler rows updated to CONFIRMED; Figma MCP row updated to note the re-check result.
- Deployment architecture (§10): UNKNOWN → CONFIRMED stack (environments still PROPOSED, unchanged — that's an implementation choice, not a source-backed fact).

No changes were made to labels that remain genuinely undecided (e.g. §5 Auth method detail beyond OQ-08's answer, §6 schema PROPOSED status) — those stay as originally labelled.

---

## 7. Files changed by this feature

Per PRD Out-of-Scope ("no non-documentation file changes") and AC-04 (`git diff --stat` only touches `docs/` or root `*.md`):
- `docs/VALIDATION_REPORT.md` (new, this file)
- `docs/design/FIGMA_INDEX.md` (new)
- `ARCHITECTURE.md` (labels updated per §6 above)
- `PROGRESS.md` (root — generated status block refreshed via `plan-status.mjs --write`)
- `docs/development/shared/shared-plan-validation/PROGRESS.md` (feature claim, then this session's progress)

No dependencies were installed, no application code was touched, no branches were created for other features.

---

## 8. Outstanding items (non-blocking, carried forward)

- CIS4 still not supplied — OQ-04's "obtain before F0-12" condition remains open operationally.
- Commitlint is not wired into CI — flagged for whichever feature first touches `.github/workflows/ci.yaml` (F0-03, Continuous integration pipeline) to add, if still wanted.
- Test frameworks (Vitest, Playwright, pgTAP) remain to be installed — this is F0-02's job (Tooling baseline), not a validation finding.
- `docs/sources/` still missing the documents listed in its own README — no action required unless a human supplies them.

---

## Sign-off

- [x] **Human approval of this report** (required for Gate G1, per CLAUDE.md §2). Approved — see the "Planning freeze" entry in DECISIONS.md §1 declaring the pack authoritative; F0-02 became startable from that point.

Approved by: Dhruv Verma · Date: 17 September 2026
