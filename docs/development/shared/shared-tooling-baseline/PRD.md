# F0-02 — Tooling baseline: TypeScript, lint, format, test runners

| Field | Value |
|---|---|
| Feature ID | F0-02 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-tooling-baseline` |
| Documentation | `docs/development/shared/shared-tooling-baseline/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D1 |
| Status / owner | See PROGRESS.md |

## Purpose
Give every later feature a working, enforced quality toolchain.

## Problem
The scaffold has no agreed lint, format or test setup; the team decided standards must be enforced by tools, not convention.

## Description
Configures the engineering toolchain every later feature relies on, and creates the dashboard development branches from the validated baseline.

## User value
Tests-first development is impossible without working test runners; consistent tooling keeps multi-session AI work uniform.

## Users
- Developers
- Claude Code

## Scope
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*` → `src/*`.
- ESLint (Next.js config + TypeScript rules + import ordering); Prettier with a single shared config; `eslint-config-prettier`.
- Vitest with jsdom environment, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event; one example unit test and one example component test.
- Playwright configured for Chromium with a smoke test that loads `/` against `next dev`/`next start`.
- commitlint with Conventional Commits config (local hook optional, CI enforcement in F0-03).
- package.json scripts: `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `verify` (= lint + typecheck + format:check + test).
- Create `family-dev`, `carer-dev`, `admin-dev` from `main` after this feature merges (Day 1–2) so all three dashboard lanes can start as soon as the UI kit lands.

## Out of Scope
- CI workflow (F0-03)
- Supabase tooling (F0-04)
- Any application UI

## Functional Requirements
- `npm run verify` exits 0 on a clean checkout.
- A type error or lint error makes `npm run verify` exit non-zero.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-01 (Validate planning pack against repository, Figma and sources)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Validated repository

## Outputs
- Config files
- Example tests
- Three dashboard dev branches

## Error / Edge Cases
- Scaffold uses a different package manager (pnpm/yarn) → use the lockfile's manager consistently and update docs (record in feature DECISIONS.md).

## Security / Permissions
- Pin dev dependencies via lockfile; no `latest` ranges in package.json.

## Technical Considerations
- Use the package manager already implied by the lockfile.
- Vitest chosen over Jest for native ESM/TypeScript speed (PD-014, PROPOSED).

## Traceability
- Product requirements: REQ-N9 (Maintainable with comprehensive plain-English handover documentation.)
- Sources: TM-2808 (coding standards enforced in CI); TM-0409 (Conventional Commits); TD (linting, unit tests); ADR-02
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
