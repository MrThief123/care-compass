# TESTING — Care Compass

Version 0.2 · 17 September 2026 · Status: DRAFT (tools PROPOSED; principles CONFIRMED)

Sources: Testing Decision (CI with lint, dependency checks, unit tests, build), team meeting 28/8 (unit tests for recurrence and budget logic, integration tests for access policies for every role, e2e for primary journeys, test plan mapping every Must requirement), team meeting 4/9 (write access-policy tests before the interface exists; negative tests), user constitution (tests-first mandatory).

---

## 1. Principles
1. **Tests first, always.** No production code for a feature before its failing tests exist and have been run.
2. **Acceptance criteria are the specification.** Every AC maps to ≥1 test; every test cites its AC.
3. **Security is tested at the database.** RLS is the authorisation boundary, so it has its own test layer with negative cases for every role.
4. **Test behaviour, not implementation.** Query by role/label text; avoid snapshot-only tests.
5. **Deterministic.** Fixed clock (reference date Monday 30 November 2026, Australia/Melbourne), seeded data, no network except local Supabase.
6. **Tests are protected.** They change only for the reasons in §6.

---

## 2. Mandatory tests-first workflow (Claude Code)
```
Read feature PRD, AC, TEST_PLAN
↓
Write tests for the ACs in this session's scope (fill "Written first? ☑" in TEST_PLAN.md)
↓
Run them → confirm they FAIL for the expected reason (missing module/behaviour, not typos or broken setup)
↓
Record the failing command + summary in feature PROGRESS.md; commit `test(<scope>): …`
↓
Implement minimum production code
↓
Run tests → fix implementation until green
↓
Refactor → re-run
↓
Run relevant full suites (§5) → record results in PROGRESS.md and TEST_PLAN.md Result column
```
Exceptions: pure configuration features (e.g. F0-02, F0-03) prove their checks by demonstrating a deliberate failure and a pass (recorded in PROGRESS.md) instead of classical red/green.

---

## 2.1 Minimum tests by feature type (plan v0.2)
| Feature type | Tests-first minimum | Layer |
|---|---|---|
| Kit component (F0-14, UI-01..03) | One component test per state/variant named in the ACs, plus axe | component |
| Contracts and fixtures (UI-00) | Unit tests for formatters; type-level test that mock and contract signatures match; lint test that `src/mocks` is not importable from `src/app`/`src/features` | unit / ci |
| Screen on fixtures (`*-UI-*`) | Component test per AC: renders design content from fixtures, empty and error state, key interaction; axe on the page component. Playwright only where an AC says e2e | component |
| Pure logic (F0-09 recurrence, money, dates) | Unit tests including every edge case in the ACs (DST, month ends, Melbourne time) | unit |
| Backend schema/functions (F0-06, F0-08, F0-10..F0-13) | pgTAP **allow and deny** cases for every role touching each table/function | db |
| Auth (F0-07) | Integration tests for sign-in/out, session, role redirect; e2e for sign-in | integration / e2e |
| Wiring (FAM-xx, CAR-xx, ADM-xx) | Integration tests for each query/action against local Supabase, including one RLS negative case; update the screen's component tests to the real contract shape; keep them passing with `DATA_SOURCE=mock` | integration / component |
| Integration (INT-xx) | Playwright cross-role journeys against seed data | e2e |

## 2.2 Parallel test runs
- Lanes S, F, C and A run unit and component tests only until Phase 3; they don't need Docker.
- Only lane B runs `supabase db reset`. In Phase 3, wiring lanes run `npm run test:integration` against the shared local stack with per-file unique fixtures and never reset it. If isolation is needed, use a separate Supabase project directory with different ports.
- Test titles start `[<FEATURE-ID>][AC-xx]` so results can be traced across branches.

## 3. Test layers

| Layer | Tool (PROPOSED) | Location | Use for | Do not use for |
|---|---|---|---|---|
| **Unit** | Vitest | `src/**/*.test.ts` | Pure logic: recurrence expansion, status derivation, date ranges, block positioning, money parsing/formatting, Zod schemas | Anything needing DB or DOM |
| **Component** | Vitest + @testing-library/react + user-event + axe | `src/**/*.test.tsx` | Rendering states (happy, empty, loading, error), role-specific absence of controls, interactions, accessibility | Real data fetching |
| **Integration / API** | Vitest against local Supabase (seeded) | `tests/integration/*.test.ts` | Server queries and actions end-to-end through RLS as a signed-in test user; route redirects; job handlers with email test double | Visual layout |
| **Database** | pgTAP via `supabase test db` | `supabase/tests/*.test.sql` | RLS allow/deny per role, SQL functions (`set_occurrence_done`, `transfer_client_organisation`, budget summary), constraints, append-only guarantees | UI |
| **End-to-end** | Playwright (Chromium) | `tests/e2e/*.spec.ts` | Primary user journeys per role and cross-role journeys (Sequence UC1–UC3), auth flows, axe page scans | Exhaustive edge cases (push down a layer) |
| **Regression** | All of the above in CI | — | Every PR and dev-branch push | — |

### 3.1 Choosing a layer
Push each test to the **lowest layer that can prove the AC**. An AC about "rows returned only for Helen" → db test. An AC about "Overdue pill shows icon and text" → component. An AC about "Helen ticks Physiotherapy and it shows Done" → e2e.

---

## 4. Specific testing areas

### 4.1 Authentication and authorisation
- pgTAP helper sets `request.jwt.claims` / role to impersonate seed users (Helen family, Aisha carer, Daniel carer, Priya admin, second-org admin, deactivated carer).
- For **every** client-scoped table: select/insert/update/delete allowed and denied cases per role, including cross-organisation and unassigned-carer negatives.
- Active-shift write rules tested at boundaries (start, inside, exactly at end, cancelled shift).
- Route-group redirects tested in integration tests per role.
- INT-05 consolidates a catalog check that every public table has RLS enabled.

### 4.2 Validation
- Zod schemas unit-tested with valid, boundary and invalid inputs (e.g. money `12.345`, negative amounts, empty dates, recurrence interval 0).
- Server actions integration-tested to confirm server-side rejection even when the UI would prevent input.

### 4.3 Error states
- Component tests render ErrorState with Retry for failed loads; action failures revert optimistic UI.
- Integration tests assert typed error codes (`VALIDATION`, `UNAUTHORISED`, `NOT_FOUND`).

### 4.4 Data and time
- Recurrence: DST transitions (April/October in Australia/Melbourne), month-end, leap day, far-future ranges (2060+), overrides.
- Money: exact decimals, negative remaining, rounding of percent.
- Append-only: attempts to update/delete completions, fund entries, audit rows must fail.
- Transfer: row counts before/after for retained data.

### 4.5 Accessibility
- Component tests: axe with no violations.
- E2E: axe scan per route (INT-06), keyboard-only journeys.
- Token contrast unit tests (F0-05).

### 4.6 Visual fidelity
- Not automated pixel diffs (PROPOSED). UI features attach screenshots next to the Figma frame in the PR.

### 4.7 Performance
- Recurrence expansion micro-benchmark in unit tests (F0-09); scale checks in INT-07.

---

## 5. Commands (PROPOSED; F0-02 finalises)
| Command | Runs |
|---|---|
| `npm run test` | Vitest unit + component |
| `npm run test:integration` | Vitest integration (requires `supabase start` + `supabase db reset`) |
| `supabase test db` | pgTAP |
| `npm run test:e2e` | Playwright |
| `npm run verify` | lint + typecheck + format check + unit/component |

**Relevant suite** before READY FOR PR: `npm run verify` always; `supabase test db` if schema touched; `npm run test:integration` for wiring and backend features; Playwright only for features with e2e ACs and before checkpoints D10 and D12.

---

## 6. Changing existing tests
Allowed only for:
1. Incorrect interpretation of the requirement (cite AC and source)
2. Invalid test assumption
3. Test infrastructure defect
4. Recorded requirement change (CHG-xxx or answered OQ)
5. Genuine implementation-independent bug in the test

Procedure: record in feature DECISIONS.md (test ID, before, after, reason); note in commit body; if expected behaviour changes or an assertion is removed, add **HUMAN REVIEW: test expectation changed** to PROGRESS.md and the PR. Never `.skip`, `.only`, `test.fixme` or delete tests to get green.

---

## 7. Traceability
- Feature `TEST_PLAN.md` maps T-xx → AC-xx; `ACCEPTANCE_CRITERIA.md` status column shows MET only when the mapped tests pass.
- Test titles begin with the IDs: `it('[FAM-01][AC-02] renders 90-minute block spanning 11:30–13:00', …)` so coverage can be grepped: `grep -rn "\[FAM-01\]\[AC-" src tests supabase`.
- PRD §5 maps REQ → features; features map to stories → ACs → tests.

---

## 8. Test data
- `src/mocks/fixtures.ts` (UI-00) holds the design content for Phase 1 screens; `supabase/seed.sql` (F0-16) mirrors the same content so screens look identical after wiring; fixed UUIDs exported for tests from `tests/fixtures/ids.ts` (PROPOSED).
- Tests that mutate data run in transactions (pgTAP) or reset via `supabase db reset` per integration run (PROPOSED: per file with unique fixtures to allow parallelism).
- No real client data ever.

---

## 9. CI
Every PR to `main` or a dev branch: lint, typecheck, format, unit/component, build, dependency audit, commitlint; db and integration jobs once Supabase exists (F0-06); e2e on checkpoint PRs (dev branch → `main`) and nightly on `main` once INT-02 exists. A red check blocks merge.

---

## 10. Definition of tested (per feature)
- All ACs MET with passing tests at the correct layer
- Tests-first evidence recorded (failing run before implementation)
- Permission negatives present for every role touching the data
- Empty, error and loading states covered where the PRD lists them
- Relevant full suite green; results with date in PROGRESS.md
