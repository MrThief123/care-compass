# Progress — F0-02 Tooling baseline: TypeScript, lint, format, test runners

Status: NOT STARTED
Owner: unclaimed
Lane: S — Shared kit
Sprint: SPRINT · planned D1
Branch: `feature/shared-tooling-baseline` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-01 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*` → `src/*`.
- ESLint (Next.js config + TypeScript rules + import ordering); Prettier with a single shared config; `eslint-config-prettier`.
- Vitest with jsdom environment, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event; one example unit test and one example component test.
- Playwright configured for Chromium with a smoke test that loads `/` against `next dev`/`next start`.
- commitlint with Conventional Commits config (local hook optional, CI enforcement in F0-03).
- package.json scripts: `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `verify` (= lint + typecheck + format:check + test).
- Create `family-dev`, `carer-dev`, `admin-dev` from `main` after this feature merges (Day 1–2) so all three dashboard lanes can start as soon as the UI kit lands.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `commitlint.config.cjs`, `tests/e2e/smoke.spec.ts`, `src/lib/example.test.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
