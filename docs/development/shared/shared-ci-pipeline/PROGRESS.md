# Progress — F0-03 Continuous integration pipeline

Status: NOT STARTED
Owner: unclaimed
Lane: S — Shared kit
Sprint: SPRINT · planned D2
Branch: `feature/shared-ci-pipeline` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Workflow `.github/workflows/ci.yml` triggered on pull requests targeting `main`, `family-dev`, `carer-dev`, `admin-dev` and on pushes to those branches.
- Jobs: install (cached) → lint → typecheck → format check → unit/component tests → `next build`.
- Dependency audit job: `npm audit --audit-level=high` (PROPOSED interpretation of 'X-ray', OQ-23) plus Dependabot config for weekly updates.
- Commit message job: commitlint over PR commits.
- Database test job placeholder that runs `supabase test db` when `supabase/tests` exists (activated by F0-06).
- E2E job running Playwright on PRs targeting dashboard dev branches and main (can be marked required later).
- Document required branch-protection settings in docs/DEVELOPMENT_WORKFLOW.md (applied by a human in GitHub settings).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `docs/DEVELOPMENT_WORKFLOW.md`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
