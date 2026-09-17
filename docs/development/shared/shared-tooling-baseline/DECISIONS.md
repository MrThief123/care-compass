# Decisions — F0-02 Tooling baseline: TypeScript, lint, format, test runners

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |

## Feature decisions log

### FD-01 — Vitest/Vite version pins chosen to avoid a known CVE
- Date: 2026-09-17
- Context: PRD proposes Vitest (PD-014); no exact version was pinned. Vitest 3.2.4 (the version first installed) pulls in a vulnerable `@vitest/mocker` (critical: arbitrary file read via the Vitest UI server, GHSA-82fw-gwwq-j7x9) and a moderate path-traversal advisory affecting `<=4.1.10`.
- Decision: pinned `vitest@4.1.11`, `vite@8.3.0` (peer range `^6 || ^7 || ^8`), `@vitejs/plugin-react@6.1.1` (requires `vite@^8`) as an exact, mutually-compatible, non-vulnerable set. `npm audit` is clean.
- Reason: PRD §Security requires pinned versions with no known-vulnerable ranges.
- Alternatives: stay on Vitest 3.2.4 (rejected — critical CVE); jump to Vitest 5 (rejected — requires `@types/node ^22`, a wider bump than this feature's scope).
- Consequences: none for other features; Vitest config/API surface used here (`defineConfig`, `test.environment`, `test.setupFiles`) is stable across 3→4.
- Human confirmation required: no (implementation detail within PRD scope).

### FD-02 — Prettier scoped to code, not to hand-authored planning docs
- Date: 2026-09-17
- Context: running `prettier --check .` unscoped reformats ~500 Markdown files across every lane's `docs/development/**`, `DECISIONS.md`, `PRD.md`, etc. — controlled documents under CLAUDE.md §9.
- Decision: `.prettierignore` excludes `*.md` and `docs/`. Prettier (and `npm run verify`'s `format:check`) covers source/config files (`.ts`, `.tsx`, `.mjs`, `.cjs`, `.json`, `.css`) only.
- Reason: reformatting other lanes' controlled planning docs is out of this feature's scope (§6) and would create merge conflicts across every concurrently-running lane.
- Alternatives: format everything (rejected — scope/blast radius); ignore only `docs/` but keep root `*.md` (rejected — root docs like `PRD.md`/`DECISIONS.md` are equally controlled).
- Consequences: Markdown files are not Prettier-enforced; if a future feature wants Markdown formatting enforced, that's a controlled change to this decision, not a silent expansion.
- Human confirmation required: no.

### FD-03 — `"type": "module"` added to package.json
- Date: 2026-09-17
- Context: without it, `vitest.config.ts` (ESM `export default`) loaded as CommonJS produces a Vite config-loader deprecation warning.
- Decision: set `"type": "module"` in `package.json`. All existing root configs (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`) already use ESM `export default` syntax; `commitlint.config.cjs` keeps its explicit `.cjs` extension so it stays CommonJS regardless.
- Reason: matches the codebase's existing ESM style; removes the warning cleanly instead of suppressing it.
- Consequences: none identified — no plain `.js` CommonJS files exist at the time of this change.
- Human confirmation required: no.

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
