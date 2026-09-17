# Acceptance Criteria — F0-02 Tooling baseline: TypeScript, lint, format, test runners

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a clean checkout, when `npm run verify` runs, then lint, typecheck, format check and unit tests all run and the command exits 0. | MET |
| AC-02 | US-01 | error | Given a file with a TypeScript error is introduced, when `npm run verify` runs, then it exits non-zero and names the file. | MET |
| AC-03 | US-01 | happy | Given the app is built, when `npm run test:e2e` runs, then the Playwright smoke test loads `/` and passes. | MET |
| AC-04 | US-01 | happy | Given F0-02 is merged per OQ-01, when `git branch -r` is listed, then `family-dev`, `carer-dev` and `admin-dev` exist and contain the tooling baseline. | BLOCKED (cite: pending PR merge to `main`) |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
