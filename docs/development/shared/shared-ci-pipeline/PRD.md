# F0-03 — Continuous integration pipeline

| Field | Value |
|---|---|
| Feature ID | F0-03 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-ci-pipeline` |
| Documentation | `docs/development/shared/shared-ci-pipeline/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D2 |
| Status / owner | See PROGRESS.md |

## Purpose
Enforce quality gates automatically on every pull request.

## Problem
Manual checking is inconsistent; the team agreed CI must block merges.

## Description
Automates the quality gates agreed in the Testing Decision and team meetings so no PR can merge with failing checks.

## User value
Prevents regressions and insecure dependencies reaching integration branches or main.

## Users
- Developers
- Reviewers

## Scope
- Workflow `.github/workflows/ci.yml` triggered on pull requests targeting `main`, `family-dev`, `carer-dev`, `admin-dev` and on pushes to those branches.
- Jobs: install (cached) → lint → typecheck → format check → unit/component tests → `next build`.
- Dependency audit job: `npm audit --audit-level=high` (PROPOSED interpretation of 'X-ray', OQ-23) plus Dependabot config for weekly updates.
- Commit message job: commitlint over PR commits.
- Database test job placeholder that runs `supabase test db` when `supabase/tests` exists (activated by F0-06).
- E2E job running Playwright on PRs targeting dashboard dev branches and main (can be marked required later).
- Document required branch-protection settings in docs/DEVELOPMENT_WORKFLOW.md (applied by a human in GitHub settings).

## Out of Scope
- Continuous deployment / hosting (blocked by OQ-17; handled in INT-08)
- Secrets for real environments

## Functional Requirements
- Any failing job marks the PR check as failed.
- Jobs run in parallel where independent.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-02 (Tooling baseline: TypeScript, lint, format, test runners)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-23, OQ-17

## Inputs
- Repository

## Outputs
- CI workflow
- dependabot.yml
- Branch protection checklist

## Error / Edge Cases
- Supabase CLI unavailable in runner → job must fail loudly, not silently skip, once `supabase/tests` exists.

## Security / Permissions
- No secrets in workflow files; use GitHub encrypted secrets only when later needed.
- Workflows use pinned major versions of actions.

## Technical Considerations
- GitHub Actions (tooling doc confirms GitHub).
- Cache dependencies by lockfile hash.

## Traceability
- Product requirements: REQ-N4 (Security: TLS, hashed credentials, session expiry/refresh, input validation, OWASP Top 10 …), REQ-N9 (Maintainable with comprehensive plain-English handover documentation.)
- Sources: TD (CI/CD decision); TM-2808; TM-0409
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
