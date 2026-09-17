# Progress — F0-02 Tooling baseline: TypeScript, lint, format, test runners

Status: PR OPEN
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D1
Branch: `feature/shared-tooling-baseline`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (PR opened, human-approved)

## Blockers
- None — OQ-01 answered (PD-030, root DECISIONS.md)

## Dependencies status
- F0-01 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- TypeScript `strict: true` (already set) + `noUncheckedIndexedAccess: true` added; path alias `@/*` → `src/*` (already present)
- ESLint: `eslint-plugin-import` + `import/order` rule added on top of the existing Next.js core-web-vitals/TypeScript config; `eslint-config-prettier` disables formatting-conflicting rules
- Prettier configured (`.prettierrc.json`, `.prettierignore`); scoped to source/config files, not hand-authored planning docs (FD-02)
- Vitest (jsdom environment) + `@testing-library/react`/`jest-dom`/`user-event` installed; one example unit test (`src/lib/example.test.ts`) and one example component test (`src/lib/example-component.test.tsx`, inline component — real components belong to F0-14/F0-15)
- Playwright configured for Chromium (`playwright.config.ts`) with a smoke test (`tests/e2e/smoke.spec.ts`) that loads `/` against `next build` + `next start`; Chromium browser binary installed locally
- commitlint config added (`commitlint.config.cjs`, Conventional Commits) — no local git hook installed (optional per PRD; CI enforcement is F0-03)
- package.json scripts added: `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `pretest:e2e`, `test:e2e`, `verify`
- Vitest/Vite/plugin-react pinned to a non-vulnerable, mutually compatible version set (FD-01); `npm audit` clean
- `"type": "module"` added to `package.json` (FD-03)

## In progress
- None

## Remaining
- Create `family-dev`, `carer-dev`, `admin-dev` from `main` **after this PR merges** (AC-04/T-04) — first action once merge lands

## Acceptance criteria status
- 3 / 4 MET (AC-01, AC-02, AC-03); AC-04 BLOCKED on merge (see Remaining)

## Tests
- Written: 4 / 4 (T-01..T-04; T-01/T-02/T-03 are demonstrated per the TESTING.md §2 config-feature exception — deliberate fail + pass, not classical red/green unit tests)
- Passing: 3 (T-01, T-02, T-03)
- Failing: 0
- Pending: 1 (T-04, blocked on merge)

## Files changed
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `commitlint.config.cjs`, `tests/e2e/smoke.spec.ts`, `src/lib/example.ts`, `src/lib/example.test.ts`, `src/lib/example-component.test.tsx`
- Formatting-only (Prettier baseline applied): `scripts/plan-status.mjs`, `src/app/layout.tsx`

## Decisions
- See DECISIONS.md (FD-01 Vitest/Vite version pins, FD-02 Prettier scope, FD-03 `type: module`)

## Problems encountered
- `vitest@3.2.4` (initial pin) pulled a critical CVE via `@vitest/mocker` — resolved per FD-01
- Unscoped `prettier --check .` reformats ~500 planning docs across every lane — resolved per FD-02
- `npm install` intermittently hit a known npm/arborist bug (`Cannot read properties of null (reading 'edgesOut')`) resolving vitest's peer set; worked around with `--legacy-peer-deps` for that one install, then verified a plain `npm install` from the resulting lockfile succeeds cleanly

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Await PR review/merge. After merge: create `family-dev`, `carer-dev`, `admin-dev` from `main` and confirm T-04/AC-04.

## Ready for PR
- Yes — approved by Dhruv Verma 2026-09-17; PR opened
