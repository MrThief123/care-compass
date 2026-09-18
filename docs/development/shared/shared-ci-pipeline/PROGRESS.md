# Progress — F0-03 Continuous integration pipeline

Status: IN PROGRESS
Owner: MrThief123
Lane: S — Shared kit
Sprint: SPRINT · planned D2
Branch: `feature/shared-ci-pipeline`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18

## Blockers
- None — OQ-01 ANSWERED (see root DECISIONS.md)

## Dependencies status
- F0-02 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Rebuilt `.github/workflows/ci.yaml` (kept this filename — see Decisions) into 8 parallel jobs: `lint`, `typecheck`, `format`, `unit`, `build`, `audit`, `commitlint`, `db-test`, plus `e2e`. Each job does its own checkout/setup-node/`npm ci` so independent jobs run in parallel per PRD Functional Requirements.
- Triggers widened from `main`-only to `push`/`pull_request` on `main`, `family-dev`, `carer-dev`, `admin-dev` (AC-01).
- Re-enabled the unit/component test step that a prior out-of-process commit (`chore/typo-pipeline`, merged to `main` before this feature existed) had commented out.
- Added `.github/dependabot.yml`: weekly `npm` and `github-actions` update checks.
- `db-test` job: checks for `supabase/tests`; skips cleanly while absent (current state), installs the Supabase CLI and runs `supabase test db` once it exists (F0-06) — CLI-install failure at that point fails the job rather than being swallowed by the `if:` guard (PRD Error/Edge Cases).
- `commitlint` job (`wagoid/commitlint-github-action@v6`) runs against PR commits using the existing `commitlint.config.cjs`.
- `e2e` job runs Playwright on pull requests only (not push), per PRD scope; not marked required yet.
- Verified `docs/DEVELOPMENT_WORKFLOW.md` §4 branch-protection checklist already lists the matching check names (lint, typecheck, format, unit, build, audit, commitlint) — no change needed there.

## In progress
- None

## Remaining
- Nothing in scope. Follow-ups for later features: db-test job's happy/fail paths need re-verification once F0-06 adds `supabase/tests` (AC-04); branch protection rules themselves are applied by a human in GitHub settings (PRD note, out of scope for this feature).

## Acceptance criteria status
- 3 / 4 MET (AC-01, AC-02, AC-03); AC-04 BLOCKED on F0-06 (see ACCEPTANCE_CRITERIA.md)

## Tests
- Written: 4 / 4 (TESTING.md §2 exception for pure-configuration features: proved by demonstrating a deliberate failure and a pass per check, not classical red/green — see TEST_PLAN.md Result column for exact commands and dates)
- Passing: 3 (T-01, T-02, T-03)
- Failing: 0 (T-04 blocked, not failing)

## Files changed
- `.github/workflows/ci.yaml` (rewritten)
- `.github/dependabot.yml` (new)
- This feature's `PROGRESS.md`, `ACCEPTANCE_CRITERIA.md`, `TEST_PLAN.md`, `SESSION_STATE.md`

## Decisions
- Kept the existing filename `.github/workflows/ci.yaml` rather than renaming to the PRD's literal `ci.yml` — GitHub Actions treats both extensions identically, and renaming means a delete+add that the session's auto-mode classifier blocks as a "CI bypass" risk (deleting a CI workflow file). Content matches PRD scope exactly. Non-blocking, noted here rather than as a DECISIONS.md entry since it doesn't affect behaviour.
- See root DECISIONS.md for OQ-01 (ANSWERED, unblocked this branch).

## Problems encountered
- `node_modules` was stale (missing `eslint-config-prettier`) at session start; `npm ci` resolved it before any checks were run.
- `git rm` on the old `.github/workflows/ci.yaml` was denied by the auto-mode classifier ("CI Bypass"); worked around by editing the file in place instead of delete+recreate.

## Assumptions
- PROPOSED items in PRD.md (OQ-23 audit-level interpretation, OQ-17 CD scope) are unconfirmed until answered; audit job implements the documented proposed default (`npm audit --audit-level=high`) only, no CD.

## Next action
- Ready for PR. Human should review the "CI Bypass" note above (about the old `ci.yaml` disabling tests) before approving.

## Ready for PR
- Yes
