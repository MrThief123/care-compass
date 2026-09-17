# Jira Tickets — Care Compass

One Story per feature, grouped by Epic (phase). Generated from the feature documentation; the feature folder remains the source of truth.

- **Priority** is derived from sprint bucket and requirements (Phase 0 kit and Phase 2 backend = Highest; other sprint work with a MUST requirement = High; STRETCH = Medium; POST-SPRINT = Low). Adjust in sprint planning.
- **Story points** are left for the team to estimate (planning poker, TM-0409).
- **Blocked by** lists open decisions in DECISIONS.md that must be answered first.
- Import the same data with `docs/JIRA_BACKLOG.csv`.

## Epics

| Epic key | Epic | Stories |
|---|---|---|
| CC-E0 | Phase 0 — Foundation & shared UI kit | 10 |
| CC-E1 | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) | 16 |
| CC-E2 | Phase 2 — Backend & data layer (parallel with Phase 1) | 10 |
| CC-E3 | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) | 34 |
| CC-E4 | Phase 4 — Integration, hardening & release | 8 |

Lanes: **S** Shared kit · **B** Backend · **F** Family · **C** Carer · **A** Admin · **I** Integration. Sprint buckets: SPRINT (2-week plan), STRETCH, POST-SPRINT.

---

# CC-E0 · Phase 0 — Foundation & shared UI kit

## [F0-01] Validate planning pack against repository, Figma and sources

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D1 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | — |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-20 (Repository and infrastructure reality) |
| Branch | `feature/shared-plan-validation` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-plan-validation/` |
| Requirements | REQ-N9 |

**Summary:** Validate the planning documents against the real repo, Figma and source documents before any code is written


**User story**
> As a developer, I want a validated plan, so that I do not build features on wrong assumptions.

**Description**
Docs-only feature. Claude Code inspects the actual repository, the Figma file and any newly supplied sources, reconciles them with this planning pack, records answers to open decisions and moves features from NOT STARTED to PLANNED or BLOCKED.

**In scope**
- Inspect repository: package manager + lockfile, Next.js version, App Router vs Pages Router, TypeScript config, Tailwind version, existing lint/test config, existing `supabase/` directory, CI workflows, branches that already exist.
- Inspect Figma via MCP: list pages; confirm whether pages 02–06 (screens, states) are now reachable; record node IDs for each screen in `docs/design/FIGMA_INDEX.md`.
- Check `docs/sources/` for newly added source documents listed as missing in DECISIONS.md OQ-19 and record what was added.
- Update ARCHITECTURE.md labels (CONFIRMED / PROPOSED / UNKNOWN) using repository facts.
- Record answers the human gives to open decisions (OQ-xx) in DECISIONS.md as PD-xxx entries.
- Re-derive each feature's status: PLANNED when docs are complete and no BLOCKING decision remains; otherwise BLOCKED with the blocking OQ IDs.
- Write `docs/VALIDATION_REPORT.md` summarising every check, discrepancy and resulting documentation change.
- Declare the planning freeze in DECISIONS.md once the human approves the report.

**Out of scope**
- Installing dependencies or changing any non-documentation file
- Creating dashboard development branches (done in F0-02 after validation)
- Answering open decisions on the human's behalf

**Acceptance criteria**
- [ ] **AC-01** (happy) Given the planning pack is in the repository, when F0-01 completes, then docs/VALIDATION_REPORT.md exists and lists the result of every scope check.
- [ ] **AC-02** (happy) Given a discrepancy is found between the plan and the repository, when the report is written, then the discrepancy cites the file path or command output that proves it.
- [ ] **AC-03** (permission) Given an open decision has no human answer, when statuses are re-derived, then every feature listing that decision as BLOCKING is marked BLOCKED.
- [ ] **AC-04** (edge) Given F0-01 is complete, when `git diff --stat` is run against the starting commit, then only files under docs/ or root *.md planning files have changed.

**Testing notes**
- AC-01: review test
- AC-02: review test
- AC-03: review test
- AC-04: review test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-02] Tooling baseline: TypeScript, lint, format, test runners

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D1 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-01 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-tooling-baseline` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-tooling-baseline/` |
| Requirements | REQ-N9 |

**Summary:** Establish strict TypeScript, ESLint, Prettier, Vitest, Testing Library and Playwright with one `verify` script


**User story**
> As a developer, I want a single command that checks code quality, so that I know my change is safe before committing.

**Description**
Configures the engineering toolchain every later feature relies on, and creates the dashboard development branches from the validated baseline.

**In scope**
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*` → `src/*`.
- ESLint (Next.js config + TypeScript rules + import ordering); Prettier with a single shared config; `eslint-config-prettier`.
- Vitest with jsdom environment, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event; one example unit test and one example component test.
- Playwright configured for Chromium with a smoke test that loads `/` against `next dev`/`next start`.
- commitlint with Conventional Commits config (local hook optional, CI enforcement in F0-03).
- package.json scripts: `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `verify` (= lint + typecheck + format:check + test).
- Create `family-dev`, `carer-dev`, `admin-dev` from `main` after this feature merges (Day 1–2) so all three dashboard lanes can start as soon as the UI kit lands.

**Out of scope**
- CI workflow (F0-03)
- Supabase tooling (F0-04)
- Any application UI

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a clean checkout, when `npm run verify` runs, then lint, typecheck, format check and unit tests all run and the command exits 0.
- [ ] **AC-02** (error) Given a file with a TypeScript error is introduced, when `npm run verify` runs, then it exits non-zero and names the file.
- [ ] **AC-03** (happy) Given the app is built, when `npm run test:e2e` runs, then the Playwright smoke test loads `/` and passes.
- [ ] **AC-04** (happy) Given F0-02 is merged per OQ-01, when `git branch -r` is listed, then `family-dev`, `carer-dev` and `admin-dev` exist and contain the tooling baseline.

**Testing notes**
- AC-01: ci test
- AC-02: ci test
- AC-03: e2e test
- AC-04: review test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-05] Design tokens, typography and base styles

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D1 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-02 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-design-tokens` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-design-tokens/` |
| Requirements | REQ-N2, REQ-N3 |

**Summary:** Map Figma colour, type, spacing and radius tokens into Tailwind; IBM Plex Sans; focus ring; shadcn/ui initialisation


**User story**
> As a user with low vision, I want text that meets contrast standards, so that I can read the app comfortably.

**Description**
Implements the Care Compass visual foundation exactly as defined in Figma '01 · Foundations' and the UI Spec §5, including contrast rules.

**In scope**
- Colour tokens (exact hex from Figma variables): bg/canvas #E9F8FA, bg/surface #FEFEFE, bg/inset #E9F8FA, bg/brand #0C9BA9, bg/brand-deep #07727D, bg/brand-light #49B7BF, bg/brand-pale #C6EAEF, bg/muted #8DB8C8, bg/accent #E69A81, bg/alert #FDF1EC, bg/alert-badge #F7C4B4, bg/alert-strong #B5543A, text/primary #1F282D, text/secondary #696E6A, text/muted #8DB8C8, text/brand #07727D, text/alert #B5543A, text/alert-strong #8A3A24, text/on-dark #FEFEFE, border/subtle #E9F8FA, border/default #D7F2F4, border/brand #07727D, border/alert #E8A98F.
- Type ramp utilities from Figma text styles: Title/Page 20/26 500, Title/Section 16/22 500, Title/Card 15/20 500, Metric/Large 22/28 500, Metric/Medium 18/24 500, Body/Emphasis 14/20 500, Body/Default 14/20 400, Body/Small 13/18 400, Body/Secondary 12/16 400, Label/Caps 11/14 400 uppercase 0.06em.
- IBM Plex Sans via `next/font`; `tabular-nums` utility applied to times, currency, percentages and counts.
- Spacing scale space/1–9 = 4, 8, 12, 16, 20, 24, 32, 40, 48 px.
- Radius tokens: pill 6, control 8, card 10, inset 8, full 9999 (numeric values from UI Spec §5.3 because Figma radius variables did not expose values — confirm in F0-01).
- Rail gradient style: vertical #07727D → #0C9BA9.
- Global visible focus ring on all interactive elements; body text min 13px.
- shadcn/ui initialised with its CSS variables mapped to the tokens above.
- Contrast test over an approved foreground/background pair list.

**Out of scope**
- Composite components (F0-14)
- App shell (F0-15)
- Dark mode (not in sources)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given the token file, when the token test compares values with the Figma fixture, then every colour token hex matches exactly.
- [ ] **AC-02** (validation) Given the approved text/background pairs list, when contrast ratios are computed, then every body-text pair is at least 4.5:1.
- [ ] **AC-03** (validation) Given the pairs list, when it is checked, then it contains no pair of text/on-dark on bg/brand (#0C9BA9).
- [ ] **AC-04** (happy) Given any Button rendered, when it receives keyboard focus, then a visible focus ring style is applied.

**Testing notes**
- AC-01: unit test
- AC-02: unit test
- AC-03: unit test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-03] Continuous integration pipeline

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D2 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-02 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-ci-pipeline` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-ci-pipeline/` |
| Requirements | REQ-N4, REQ-N9 |

**Summary:** GitHub Actions: lint, typecheck, unit tests, build, dependency audit and commit-message check on every PR


**User story**
> As a reviewer, I want PR checks that run automatically, so that I only review changes that already pass quality gates.

**Description**
Automates the quality gates agreed in the Testing Decision and team meetings so no PR can merge with failing checks.

**In scope**
- Workflow `.github/workflows/ci.yml` triggered on pull requests targeting `main`, `family-dev`, `carer-dev`, `admin-dev` and on pushes to those branches.
- Jobs: install (cached) → lint → typecheck → format check → unit/component tests → `next build`.
- Dependency audit job: `npm audit --audit-level=high` (PROPOSED interpretation of 'X-ray', OQ-23) plus Dependabot config for weekly updates.
- Commit message job: commitlint over PR commits.
- Database test job placeholder that runs `supabase test db` when `supabase/tests` exists (activated by F0-06).
- E2E job running Playwright on PRs targeting dashboard dev branches and main (can be marked required later).
- Document required branch-protection settings in docs/DEVELOPMENT_WORKFLOW.md (applied by a human in GitHub settings).

**Out of scope**
- Continuous deployment / hosting (blocked by OQ-17; handled in INT-08)
- Secrets for real environments

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a PR targeting `family-dev`, when it is opened, then lint, typecheck, format, unit test, build, audit and commitlint jobs run.
- [ ] **AC-02** (error) Given a PR introduces a lint error, when CI runs, then the lint job fails and the overall check is red.
- [ ] **AC-03** (validation) Given a PR contains a commit message `update`, when CI runs, then the commitlint job fails.
- [ ] **AC-04** (edge) Given `supabase/tests` exists, when CI runs, then the database test job executes `supabase test db` and fails the check on test failure.

**Testing notes**
- AC-01: ci test
- AC-02: ci test
- AC-03: ci test
- AC-04: ci test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-14] Core UI primitives and state components

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D2 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-05 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-ui-primitives` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-ui-primitives/` |
| Requirements | REQ-N1, REQ-N2, REQ-N3, REQ-17, REQ-19 |

**Summary:** Avatar, Button, Status pill, Count badge, Progress bar, Card shell, Checkbox, Segmented control, Search field, File tile, empty/loading/error states


**User story**
> As a carer or family member, I want status that is readable without relying on colour, so that I can tell Done from Overdue at a glance.

**Description**
Builds the reusable components that appear across all three dashboards in the Figma screens and the '06 · States' sheet.

**In scope**
- Icon library `lucide-react` (shadcn default) with an `Icon` wrapper (sizes 14/16/20) covering rail and card icons: home, info, calendar, dollar, sliders, patient/person, clipboard-check, bell, search, file, plus, check, alert-triangle, chevrons, x.
- Avatar (sm 28 / md 32 / lg 46; initial on brand-pale ground).
- Button (primary brand-deep fill / secondary outline / ghost link; md / lg; disabled).
- Status pill: planned (outline, 'Planned'), done (brand-pale fill, check icon, 'Done · Aisha R.'), overdue (alert outline, warning icon, 'Overdue'); never colour alone.
- Count badge (neutral / alert), Progress bar (normal brand / alert-strong).
- Card shell (neutral / alert tone with border/alert and bg/alert).
- Checkbox (checked label struck through and muted, as in Tasks panels).
- Segmented control D / W / M (default W).
- Search field with clear button and states: empty, typing, loading, no-results ('No matches for "Zoe".').
- File tile: filled (file icon + filename) and add ('+ Add file', dashed border).
- EmptyState (icon, title, body — e.g. 'All caught up / There are no overdue tasks right now.'), ErrorState ('Something went wrong / We couldn't load this page. Please try again.' + Retry), Skeletons (list rows with avatar; card grid).
- Component tests including axe accessibility assertions.

**Out of scope**
- Rail and header (F0-15)
- Calendar grids (FAM-04)
- Date picker grid (FAM-06)
- Confirmation modal (FAM-13)
- Slot chips (ADM-07)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a done occurrence completed by Aisha Rahman, when the Status pill renders, then its text reads 'Done · Aisha R.' and includes a check icon.
- [ ] **AC-02** (happy) Given an overdue occurrence, when the Status pill renders, then it shows a warning icon and the text 'Overdue'.
- [ ] **AC-03** (happy) Given a Search field with query 'Zoe' and no results, when rendered in no-results state, then the text 'No matches for "Zoe".' is shown.
- [ ] **AC-04** (error) Given ErrorState with an onRetry handler, when Retry is clicked, then the handler is called once.
- [ ] **AC-05** (happy) Given each primitive, when checked with axe, then no violations are reported.
- [ ] **AC-06** (happy) Given a Segmented control with no value prop, when rendered, then 'W' is selected.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test
- AC-05: component test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [UI-00] Domain types, data-access contracts and design fixtures

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D2 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-02 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-domain-contracts-fixtures` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-domain-contracts-fixtures/` |
| Requirements | REQ-N9, REQ-19 |

**Summary:** TypeScript domain types, query/action function signatures with a mock implementation, formatters, and fixtures copied from the designs


**User story**
> As a developer, I want one typed contract and realistic sample data, so that I can build screens now and connect real data later without rewriting them.

**Description**
Defines the data contract every screen uses. Screens call the same query functions before and after wiring; in Phase 1 they return design fixtures, in Phase 3 the Supabase implementation replaces them.

**In scope**
- `src/types/domain.ts`: Organisation, Profile (role family|carer|admin), Client, ClientInfoSection, CareEvent, Occurrence {key, eventId, clientId, title, description, start, durationMinutes, status: 'planned'|'done'|'overdue', actor?, assignee?, completedAt?}, Shift, BudgetBucketSummary {kind, label, total, used, remaining, percentUsed, state}, FundEntry, DocumentRef, CarerNotification {source: 'admin'|'family', message, createdAt}, StaffMember.
- `src/server/<domain>/queries.ts` and `actions.ts` exported function signatures for every screen (e.g. `getTodayOccurrences(clientId)`, `getBudgetSummary(clientId)`, `getTaskLog(clientId, {q, status, page})`, `setOccurrenceDone(key)`), each delegating to a data source.
- `src/server/data-source.ts`: selects `mock` or `supabase` implementation via `DATA_SOURCE` env (default `mock` until Phase 3). Mock implementations live in `src/mocks/` and read fixtures.
- `src/mocks/fixtures.ts`: design content at reference date Monday 30 November 2026 (Banksia Home Care; Margaret, Robert, Elsie, Frank, Doris, Harold, Jean; Helen, Michael, Susan, Karen, Tom; Priya; Aisha Rahman, Daniel K., Sarah Nguyen, Marcus Chen, Fatima Ali; events, statuses, budgets, fund history, documents, notifications).
- `src/mocks/current-user.ts`: mock session with role selectable in development only (`?as=family|carer|admin` or cookie); throws in production builds.
- Formatters in `src/lib/format/`: `displayName` ('Aisha Rahman' → 'Aisha R.'), `ageFromDob`, `formatDuration` (90 → '1 hr 30 min'), `formatShortDate` ('Mon 30 Nov'), `formatLongDate` ('Monday 30 November 2026'), `formatMoney` ('$14,880', '+$6,000').

**Out of scope**
- Supabase implementation of the queries (Phase 2/3)
- Database schema (F0-06 onward)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given `displayName('Aisha Rahman')`, when called, then it returns 'Aisha R.'.
- [ ] **AC-02** (happy) Given `formatDuration(90)` and `formatDuration(60)`, when called, then they return '1 hr 30 min' and '1 hr'.
- [ ] **AC-03** (happy) Given `formatLongDate` for 2026-11-30, when called, then it returns 'Monday 30 November 2026'.
- [ ] **AC-04** (happy) Given DATA_SOURCE=mock, when `getBudgetSummary(<Margaret>)` is called, then NDIS remaining 14880 / total 24000 / 38%, Fixed 2750 / 5000 / 45%, Government 240 / 3000 / 92% are returned.
- [ ] **AC-05** (security) Given NODE_ENV=production, when the mock current-user module is used, then it throws.
- [ ] **AC-06** (validation) Given a file under `src/app` or `src/features` imports from `src/mocks`, when lint runs, then lint fails (restricted import).

**Testing notes**
- AC-01: unit test
- AC-02: unit test
- AC-03: unit test
- AC-04: integration test
- AC-05: unit test
- AC-06: ci test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-15] Role app shell: rail, header and layouts

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D3 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-14, UI-00 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-app-shell` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-app-shell/` |
| Requirements | REQ-02, REQ-12, REQ-N1, REQ-N2 |

**Summary:** 88px gradient rail with role-specific items, 76px header (client or screen subject, date, user, Carer-only bell), role layouts

> **Plan v0.2:** built before authentication so screens can start on Day 4; F0-07 adds real guards.


**User story**
> As a family member, I want the client's name and face at the top of every page, so that I always know whose record I'm looking at.
> As a carer or admin, I want navigation specific to my role, so that I only see what applies to me.

**Description**
Implements the persistent chrome for the Family, Carer and Admin dashboards exactly as shown in the Figma screens.

**In scope**
- Rail (88px, vertical gradient #07727D→#0C9BA9) with role label at top (FAMILY / CARER / ADMIN) and icon+label items; active item is a surface tile with brand text.
- Family items: Home · Info · Calendar · Budget · Settings. Carer: Home · Patients · Calendar · Settings. Admin: Home · Manage · Staff · Clients · Settings.
- Nav items in the top ~43% of the rail; nothing bottom-anchored.
- Header 76px: Family → client avatar (46) + name (Title/Page) + subline '78 years · Preston VIC · Banksia Home Care'; Carer/Admin → screen name. Right side: current date ('Monday 30 November 2026'), divider, [Carer only: bell], user avatar + first name.
- Top-bar placement of sign-out (UI-§5.1 says log-out/help in the top bar; exact control not drawn — PROPOSED user menu on avatar).
- Role layouts in `(family)/family/[clientId]`, `(carer)/carer`, `(admin)/admin`; active item derived from route.
- Bell renders only in the Carer header (panel behaviour in CAR-02).
- Signed-in user comes from the `getCurrentUser()` contract (UI-00): mock session until F0-07 swaps in Supabase Auth; role layouts are unguarded mock routes until F0-07.

**Out of scope**
- Screen content
- Notifications panel behaviour (CAR-02)
- Help/FAQ (OQ-25, parked)
- Rail collapse (not designed)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen viewing Margaret's record, when the Family header renders, then 'Margaret' is the page title with subline '78 years · Preston VIC · Banksia Home Care' and 'Helen' appears separately at the right.
- [ ] **AC-02** (happy) Given the Family rail, when rendered, then items are exactly Home, Info, Calendar, Budget, Settings in that order.
- [ ] **AC-03** (happy) Given the Carer rail, when rendered, then items are exactly Home, Patients, Calendar, Settings.
- [ ] **AC-04** (happy) Given the Admin rail, when rendered, then items are exactly Home, Manage, Staff, Clients, Settings.
- [ ] **AC-05** (permission) Given the Family or Admin header, when rendered, then no bell button exists in the DOM; given the Carer header, then a bell button exists.
- [ ] **AC-06** (happy) Given Aisha on /carer/calendar, when the page loads, then the Calendar rail item is marked active (aria-current='page').

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test
- AC-05: component test
- AC-06: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [UI-01] Calendar kit: week/day/month grids, event blocks, date picker

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D3 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-14, UI-00 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-calendar-kit` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-calendar-kit/` |
| Requirements | REQ-16, REQ-25, REQ-23 |

**Summary:** Reusable calendar components used by Family Calendar, Family Home, Carer Calendar, event form and Admin assign shift


**User story**
> As a family member or carer, I want calendars that behave like normal calendars, so that I can read schedules without learning anything new.

**Description**
Builds every calendar-like component once so the three dashboards compose them in parallel.

**In scope**
- Pure helpers `src/lib/dates/`: `weekRange(date)` (Monday start), `monthGrid(date)` (6×7 with out-of-month days), `positionBlocks(occurrences, {startHour: 7, rowPx: 44})`.
- `DayTimeline` (hour gutter 07:00–18:00, blocks with #0C9BA9 left stripe, title, assignee, duration, status pill — Family Home 'Today').
- `WeekGrid` (MON–SUN headers with day number, today column highlighted, hour gutter, blocks showing time + title; `labelFormat` prop for carer 'Margaret — Morning m…' truncation).
- `MonthGrid` (cell states default/today/selected/has-events/out-of-month).
- `CalendarHeader` (range label '30 Nov – 6 Dec 2026', prev/next, D/W/M segmented control default W).
- `DatePickerGrid` ('November 2026' with chevrons, MON–SUN, dots for days with items, selected filled circle, out-of-month muted).
- Component tests for each state; axe checks.

**Out of scope**
- Data fetching
- Screen composition (Phase 1 screens)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given 2 Dec 2026, when `weekRange` runs, then it returns Mon 30 Nov – Sun 6 Dec 2026.
- [ ] **AC-02** (happy) Given events at 09:00 (60 min) and 11:30 (90 min), when `positionBlocks` runs from 07:00 with 44px rows, then tops are 88px and 198px and heights 44px and 66px.
- [ ] **AC-03** (happy) Given the fixture week of 30 Nov, when `WeekGrid` renders, then MON 30 is highlighted and '09:30 Weekly weigh-in' appears under THU 3.
- [ ] **AC-04** (happy) Given `DatePickerGrid` for November 2026 with items on 24, 26, 27 and selected 30, when rendered, then those days show dots and 30 is filled.
- [ ] **AC-05** (happy) Given `CalendarHeader` without a view prop, when rendered, then W is selected and the label reads '30 Nov – 6 Dec 2026'.
- [ ] **AC-06** (happy) Given each calendar component, when checked with axe, then there are no violations.

**Testing notes**
- AC-01: unit test
- AC-02: unit test
- AC-03: component test
- AC-04: component test
- AC-05: component test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [UI-02] Forms kit: fields, settings cards, side panels, chips, modal, event form

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D3–D4 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-14, UI-00, UI-01 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-forms-kit` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-forms-kit/` |
| Requirements | REQ-N1, REQ-N2 |

**Summary:** Form fields with errors, settings/profile cards, reset-password card, side-panel form, chip groups, confirmation modal and the event form layout


**User story**
> As any user, I want forms that are clear and forgiving, so that I can complete tasks without help.

**Description**
Builds the form patterns used across Settings, Staff, Clients, Manage and the event form.

**In scope**
- `Field` wrappers: text, email, tel, select, textarea, date — label, hint, inline error, 44px height, focus ring.
- `SettingsActionCard` (title, description, outline action button — 'Change organisation', 'Reset username / password').
- `DetailsFormCard` (card title + two-column field grid — Family info, My info, Organisation info; save affordance slot per OQ-35).
- `SidePanelForm` (panel title, stacked fields, full-width primary button at bottom — Add / edit staff, Add client).
- `ChipGroup` single-select (Status chips Planned/Done/Overdue; time slots 07:00–11:00, 11:00–15:00, 15:00–19:00, Custom revealing two time inputs).
- `InlineAlert` (alert tone with warning icon — overlap warning).
- `ConfirmationModal` (neutral/destructive; title with warning icon, body, Cancel + confirm; close X; focus trap; Escape closes).
- `EventForm` layout: Date field + Recurring select + Status chips + Description + Documents slot on the left; 'Pick a date' `DatePickerGrid` card + Save event + Cancel on the right.
- Zod-based client validation helper shared with future server actions.

**Out of scope**
- Persistence
- Uploads (F0-13/FAM-08)

**Acceptance criteria**
- [ ] **AC-01** (validation) Given a required Date field left empty, when the form is submitted, then 'Date' shows an inline error and onSubmit is not called.
- [ ] **AC-02** (happy) Given the destructive ConfirmationModal is open, when Escape is pressed, then onCancel is called and focus returns to the trigger.
- [ ] **AC-03** (happy) Given time slot ChipGroup, when 'Custom' is selected, then start and end time inputs appear.
- [ ] **AC-04** (validation) Given Custom start 12:00 and end 10:00, when validated, then an end-time error is shown.
- [ ] **AC-05** (happy) Given EventForm with fixture 'Physiotherapy', when rendered, then Date shows 'Monday 30 November 2026', Recurring 'Weekly', Planned chip selected, and a 'Pick a date' calendar.
- [ ] **AC-06** (happy) Given each form component, when checked with axe, then there are no violations.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test
- AC-05: component test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [UI-03] Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E0 — Phase 0 — Foundation & shared UI kit |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D3 |
| Lane | S — Shared kit |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-14, UI-00 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-lists-cards-kit` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-0` `shared` |
| Docs | `docs/development/shared/shared-lists-cards-kit/` |
| Requirements | REQ-17, REQ-19, REQ-27, REQ-10 |

**Summary:** Data table, selectable rows, activity/log/notification rows, person card, stat card, budget bucket card, alert list card, client info view


**User story**
> As a family member, I want cards and lists that make problems obvious, so that I can see what needs attention.

**Description**
Builds the list and card patterns shown across all dashboards.

**In scope**
- `DataTable` (uppercase label header, 50px rows, optional chevron link column) — Task log, Budget History, Staff list, Client list.
- `ActivityRow` (title, short date, status pill, chevron) — Overdue card, Recent activity, Log panel.
- `AlertListCard` (alert tone, warning icon title, count badge, rows, optional caption 'across all clients').
- `SelectableListRow` (avatar + name; selected solid #07727D with white text and check; hover tint) — Admin Manage.
- `PersonCard` (avatar initial, name, '78 years · Preston VIC') — Patients grid.
- `NotificationRow` (source chip Admin neutral / Family brand + message).
- `StatCard` (label + Metric/Large number).
- `BudgetBucketCard` (label caps, remaining metric, 'of $total · N% used', progress bar; states normal/warning/alert/depleted; alert shows warning icon and alert tone).
- `TaskChecklist` (checkbox rows, checked struck through and muted).
- `ClientInfoView` (client summary, section cards Description / Habits / Medical history with optional 'Edit', Documentation file tiles with optional Add file) with `canEdit` prop.

**Out of scope**
- Data fetching
- Screen composition

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a Government bucket 3000 total / 2760 used in alert state, when BudgetBucketCard renders, then it shows '$240', 'of $3,000 · 92% used', a warning icon and the alert tone.
- [ ] **AC-02** (happy) Given AlertListCard with 3 overdue rows, when rendered, then the badge shows '3' and each row has an 'Overdue' pill.
- [ ] **AC-03** (happy) Given SelectableListRow selected, when rendered, then it has aria-selected='true' and shows a check icon.
- [ ] **AC-04** (permission) Given ClientInfoView with canEdit=false, when rendered, then no 'Edit' links and no 'Add file' tile exist.
- [ ] **AC-05** (happy) Given NotificationRow with source 'family', when rendered, then the chip text is 'Family'.
- [ ] **AC-06** (happy) Given each component, when checked with axe, then there are no violations.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test
- AC-05: component test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

---

# CC-E1 · Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin)

## [FAM-UI-01] Family Home screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-01, UI-03 |
| Blocked by | — |
| Branch | `feature/family-ui-home` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-home/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Family Home: Today timeline, Enter event, Overdue card, Recent activity, Budget strip — on fixtures


**User story**
> As a family user, I want the Family · Home screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/home` inside the family layout.
- Today panel via `DayTimeline` with caption 'Mon 30 Nov · day view'.
- Right column (340px): 'Enter event' primary button linking to `/family/[clientId]/events/new`; `AlertListCard` Overdue; Recent activity card with 'View all' → `/family/[clientId]/tasks` and chevrons → task detail.
- Budget strip: 'Budget', aggregate line, 'View breakdown' → `/family/[clientId]/budget`, three `BudgetBucketCard`s.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Family Home renders, then the Today panel shows Morning medication (Done · Aisha R.), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned).
- [ ] **AC-02** (happy) Given fixtures, when rendered, then the Overdue card badge is '3' and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov).
- [ ] **AC-03** (happy) Given fixtures, when rendered, then the budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state.
- [ ] **AC-04** (happy) Given Recent activity, when 'View all' is clicked, then navigation targets `/family/<id>/tasks`.
- [ ] **AC-05** (empty) Given no overdue fixtures, when rendered, then 'All caught up' is shown in the Overdue card.
- [ ] **AC-06** (error) Given the contract query rejects, when rendered, then 'Something went wrong' with Retry is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test
- AC-05: component test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-UI-02] Family Calendar screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4–D5 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-01, UI-03 |
| Blocked by | — |
| Branch | `feature/family-ui-calendar` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-calendar/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Family Calendar: header range, D/W/M, week grid, Tasks checklist for selected day, Log panel — on fixtures


**User story**
> As a family user, I want the Family · Calendar screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Calendar screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/calendar` inside the family layout.
- `CalendarHeader` + `WeekGrid`/`DayTimeline`/`MonthGrid` switched by D/W/M (URL param).
- Tasks panel: 'Tasks', selected date subtitle, `TaskChecklist` (local toggle).
- Log panel: 'Log', 'View all', three `ActivityRow`s.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given no view param, when the calendar renders, then W is selected and '30 Nov – 6 Dec 2026' is shown.
- [ ] **AC-02** (happy) Given fixtures, when the week renders, then Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4.
- [ ] **AC-03** (happy) Given a user selects TUE 1, when the Tasks panel updates, then its subtitle reads 'Tuesday 1 December'.
- [ ] **AC-04** (happy) Given Physiotherapy unticked, when ticked, then its label is struck through (local state).
- [ ] **AC-05** (happy) Given the week view, when M is pressed, then a December 2026 month grid is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test
- AC-05: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-UI-03] Family Add / Edit event screens (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D5 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-02, UI-01, UI-03 |
| Blocked by | — |
| Branch | `feature/family-ui-event-form` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-event-form/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Add event and Edit event screens using EventForm with Pick a date and document tiles — on fixtures


**User story**
> As a family user, I want the Family · Edit event (and Add event) screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Edit event (and Add event) screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/events/[eventId]/edit` inside the family layout.
- Edit route prefilled from fixture; header title 'Edit event'.
- Add route `/family/[clientId]/events/new` with empty form; header title 'Add event' (PROPOSED — not designed).
- Documents: fixture file tiles ('Physio referral.pdf', 'Exercise plan.pdf') + '+ Add file' tile (no upload).
- Save event validates and returns to the previous screen without persisting; Cancel returns without changes.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given the Physiotherapy fixture, when Edit event renders, then Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description text are shown.
- [ ] **AC-02** (validation) Given the Add event form with no date, when Save event is pressed, then a Date error is shown.
- [ ] **AC-03** (happy) Given Edit event, when rendered, then document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile are shown.
- [ ] **AC-04** (happy) Given Family Home, when 'Enter event' is clicked, then the Add event screen opens.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-UI-04] Family Info screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D5 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-03 |
| Blocked by | — |
| Branch | `feature/family-ui-info` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-info/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Client info: summary, Description, Habits, Medical history with Edit, Documentation tiles — on fixtures


**User story**
> As a family user, I want the Family · Info screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Info screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/info` inside the family layout.
- `ClientInfoView` with canEdit=true.
- Edit toggles an inline textarea with Save/Cancel (local state; PROPOSED interaction).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order with the design text.
- [ ] **AC-02** (happy) Given Habits, when Edit is clicked, then a textarea with the current text and Save/Cancel appears.
- [ ] **AC-03** (happy) Given Documentation, when rendered, then tiles 'Care plan.pdf', 'Medication schedule.pdf' and 'Add file' are shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-UI-05] Family Budget screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-03 |
| Blocked by | — |
| Branch | `feature/family-ui-budget` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-budget/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Funds by source with Update button, bucket cards and History table — on fixtures


**User story**
> As a family user, I want the Family · Budget screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Budget screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/budget` inside the family layout.
- 'Funds by source' card with 'Update' primary button (no action — flow undesigned, OQ-05).
- Three `BudgetBucketCard`s.
- History `DataTable`: DATE · DESCRIPTION · AMOUNT.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Budget renders, then NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown.
- [ ] **AC-02** (happy) Given fixtures, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'.
- [ ] **AC-03** (empty) Given no fund entries, when History renders, then an empty state is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-UI-06] Family Settings screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-02 |
| Blocked by | — |
| Branch | `feature/family-ui-settings` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-settings/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Change organisation card with confirmation modal, Family info card, Reset username/password card — on fixtures


**User story**
> As a family user, I want the Family · Settings screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/settings` inside the family layout.
- 'Change organisation' `SettingsActionCard` ('Currently registered with Banksia Home Care.'); 'Change' opens the destructive `ConfirmationModal` with the D36 wording (organisation picker undesigned — OQ-06).
- Family info `DetailsFormCard`: Name, Phone, Email, Address.
- Reset `SettingsActionCard` with 'Reset'.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Settings renders, then Name 'Helen', Phone '0412 345 678', Email 'helen@example.com', Address '12 Wattle St, Preston VIC 3072' are shown.
- [ ] **AC-02** (happy) Given 'Change' is clicked, when the modal opens, then its title is 'Change organisation?' and the body states Banksia Home Care will lose access immediately.
- [ ] **AC-03** (happy) Given the modal, when Cancel is clicked, then it closes and nothing else happens.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-UI-07] Family Task log and Task detail screens (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6–D7 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-03, UI-02 |
| Blocked by | — |
| Branch | `feature/family-ui-task-log-detail` → PR to `family-dev` |
| Labels | `care-compass` `phase-1` `family` |
| Docs | `docs/development/family-dev/family-ui-task-log-detail/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Task log with search, status filter and rows; Task detail with status, description, documents — on fixtures


**User story**
> As a family user, I want the Family · Task log and Task detail screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Family · Task log and Task detail screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/family/[clientId]/tasks` inside the family layout.
- Task log: title, search field, 'Status' select (All statuses/Planned/Done/Overdue), `DataTable` DATE · TASK · NURSE · STATUS with chevrons.
- Task detail `/family/[clientId]/tasks/[occurrenceKey]`: 'Back to Task log', title, 'Monday 30 November 2026 · Assigned to Aisha R.', Status card with 'Completed at 09:14', Description card with Edit link to edit event, Documents card.
- Search and filter act on fixtures client-side (server search comes with wiring, D32).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Task log renders, then 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha R. · Done · Aisha R.'.
- [ ] **AC-02** (happy) Given status filter Overdue, when applied, then only Weekly weigh-in and Medication review remain, each with nurse '—'.
- [ ] **AC-03** (empty) Given search 'Zoe', when applied, then 'No matches for "Zoe".' is shown.
- [ ] **AC-04** (happy) Given the Morning medication detail, when rendered, then 'Done · Aisha R.' and 'Completed at 09:14' are shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-UI-01] Carer Home screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-03 |
| Blocked by | — |
| Branch | `feature/carer-ui-home` → PR to `carer-dev` |
| Labels | `care-compass` `phase-1` `carer` |
| Docs | `docs/development/carer-dev/carer-ui-home/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Carer Home: Today's calendar, Tasks checklist, Notifications, header bell — on fixtures


**User story**
> As a carer user, I want the Carer · Home screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Carer · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/carer/home` inside the carer layout.
- 'Today's calendar' card: rows '09:00 · Margaret — Morning medication · pill'.
- 'Tasks' card: `TaskChecklist` (local toggle).
- 'Notifications' card: `NotificationRow`s (Admin/Family).
- Header 'Home' with bell.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Carer Home renders, then Today's calendar shows 09:00, 11:30 and 15:00 rows for Margaret with Done/Planned/Planned pills.
- [ ] **AC-02** (happy) Given fixtures, when rendered, then Notifications include 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' with an 'Admin' chip.
- [ ] **AC-03** (happy) Given the Carer header, when rendered, then a bell button is present.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-UI-02] Carer Patients and patient info screens (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4–D5 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-03 |
| Blocked by | — |
| Branch | `feature/carer-ui-patients-info` → PR to `carer-dev` |
| Labels | `care-compass` `phase-1` `carer` |
| Docs | `docs/development/carer-dev/carer-ui-patients-info/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Patients grid with search and empty state; patient info page using ClientInfoView — on fixtures


**User story**
> As a carer user, I want the Carer · Patients (and patient info) screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Carer · Patients (and patient info) screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/carer/patients` inside the carer layout.
- Search field 'Search patients' (client-side on fixtures).
- `PersonCard` grid, 4 columns.
- Patient info `/carer/patients/[clientId]` with `ClientInfoView` (canEdit from fixture flag `onShift`; no organisation or payment controls — D10). No carer patient-info frame exists; reuse the Family Info layout (PROPOSED).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Patients renders, then 7 cards appear including 'Margaret' '78 years · Preston VIC' and 'Jean' '88 years · Fairfield VIC'.
- [ ] **AC-02** (empty) Given no patients, when rendered, then 'No patients assigned yet' is shown.
- [ ] **AC-03** (happy) Given a card for Margaret, when clicked, then the patient info page for Margaret opens.
- [ ] **AC-04** (permission) Given fixture onShift=false, when patient info renders, then no Edit links exist.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-UI-03] Carer Calendar screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D5–D6 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-01, UI-03 |
| Blocked by | — |
| Branch | `feature/carer-ui-calendar` → PR to `carer-dev` |
| Labels | `care-compass` `phase-1` `carer` |
| Docs | `docs/development/carer-dev/carer-ui-calendar/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Carer Calendar: 'Shifts' week grid and 'Tasks for the selected shift' checklist — on fixtures


**User story**
> As a carer user, I want the Carer · Calendar screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Carer · Calendar screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/carer/calendar` inside the carer layout.
- Title 'Calendar', section 'Shifts', D/W/M.
- `WeekGrid` with carer label format '<Client> — <title>' truncated.
- 'Tasks for the selected shift' with subtitle and `TaskChecklist` (fixture sub-steps per design; semantics pending OQ-33).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when the week renders, then MON 30 shows blocks '09:00 Margaret — Morning m…', '11:30 Margaret — Physiother…', '15:00 Margaret — Afternoon c…'.
- [ ] **AC-02** (happy) Given the 09:00 block is selected, when the panel renders, then the subtitle reads '09:00 · Margaret — Morning medication' with three checklist items.
- [ ] **AC-03** (happy) Given no view param, when rendered, then W is selected.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-UI-04] Carer Settings screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-02 |
| Blocked by | — |
| Branch | `feature/carer-ui-settings` → PR to `carer-dev` |
| Labels | `care-compass` `phase-1` `carer` |
| Docs | `docs/development/carer-dev/carer-ui-settings/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Carer Settings: My info (Name, Phone, Email, Role) and Reset card — on fixtures


**User story**
> As a carer user, I want the Carer · Settings screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Carer · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/carer/settings` inside the carer layout.
- 'My info' `DetailsFormCard`: Name, Phone, Email, Role (read-only PROPOSED).
- Reset `SettingsActionCard`.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Settings renders, then 'Aisha Rahman', '0423 987 654', 'aisha.r@banksiahomecare.com.au', 'Registered Nurse' are shown.
- [ ] **AC-02** (happy) Given the Reset card, when rendered, then it reads "We'll email you a secure link to reset your credentials." with a 'Reset' button.

**Testing notes**
- AC-01: component test
- AC-02: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-UI-01] Admin Home screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-03 |
| Blocked by | — |
| Branch | `feature/admin-ui-home` → PR to `admin-dev` |
| Labels | `care-compass` `phase-1` `admin` |
| Docs | `docs/development/admin-dev/admin-ui-home/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Admin Home: Clients and Staff stat cards, Overdue events across all clients — on fixtures


**User story**
> As a admin user, I want the Admin · Home screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Admin · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/admin/home` inside the admin layout.
- `StatCard`s 'Clients 42' and 'Staff 17'.
- `AlertListCard` 'Overdue events' with caption 'across all clients', rows Client · Event · Nurse · Overdue pill (chevron without navigation, OQ-37).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Admin Home renders, then 'Clients' shows 42 and 'Staff' shows 17.
- [ ] **AC-02** (happy) Given fixtures, when rendered, then overdue rows include 'Robert · Medication review · Daniel K.'.
- [ ] **AC-03** (empty) Given no overdue fixtures, when rendered, then 'All caught up' is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-UI-02] Admin Manage screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4–D5 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-01, UI-02, UI-03 |
| Blocked by | — |
| Branch | `feature/admin-ui-manage` → PR to `admin-dev` |
| Labels | `care-compass` `phase-1` `admin` |
| Docs | `docs/development/admin-dev/admin-ui-manage/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Admin Manage: Staff and Clients selection columns with search, Assign shift panel with date, slots, warning — on fixtures


**User story**
> As a admin user, I want the Admin · Manage screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Admin · Manage screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/admin/manage` inside the admin layout.
- Staff column (290px) and Clients column (290px) with search and `SelectableListRow`s.
- Assign shift panel: summary 'Aisha Rahman → Margaret' + Clear; Date `DatePickerGrid` with dots; Time slot `ChipGroup` incl. Custom; `InlineAlert` overlap warning computed from fixture shifts; Cancel + Assign shift (local only).
- No Repeat control (D31).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha Rahman and Margaret selected, when rendered, then both rows are selected and the summary reads 'Aisha Rahman → Margaret'.
- [ ] **AC-02** (happy) Given Clear is clicked, when rendered, then no rows are selected.
- [ ] **AC-03** (happy) Given fixture shift 11:30–13:00 and slot 11:00–15:00 selected, when rendered, then the warning mentions 11:30–13:00 and Assign shift remains enabled.
- [ ] **AC-04** (happy) Given the panel, when rendered, then no Repeat control exists.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-UI-03] Admin Staff screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D5–D6 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-02, UI-03 |
| Blocked by | — |
| Branch | `feature/admin-ui-staff` → PR to `admin-dev` |
| Labels | `care-compass` `phase-1` `admin` |
| Docs | `docs/development/admin-dev/admin-ui-staff/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Admin Staff: Staff list with Add staff and Add/edit staff side panel — on fixtures


**User story**
> As a admin user, I want the Admin · Staff screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Admin · Staff screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/admin/staff` inside the admin layout.
- Staff list `DataTable` NAME · ROLE · EDIT with '+ Add staff'.
- Add / edit staff `SidePanelForm`: Name, Phone, Email, Role select; Save (local only). Edit prefills.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Staff renders, then rows include 'Sarah Nguyen · Enrolled Nurse' and 'Marcus Chen · Support Worker'.
- [ ] **AC-02** (happy) Given Edit on Aisha Rahman, when clicked, then the panel shows her Name, Phone, Email and Role 'Registered Nurse'.
- [ ] **AC-03** (validation) Given '+ Add staff' with empty Email, when Save is pressed, then an Email error is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-UI-04] Admin Clients screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-02, UI-03 |
| Blocked by | — |
| Branch | `feature/admin-ui-clients` → PR to `admin-dev` |
| Labels | `care-compass` `phase-1` `admin` |
| Docs | `docs/development/admin-dev/admin-ui-clients/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Admin Clients: Client list with Remove links and Add client side panel — on fixtures


**User story**
> As a admin user, I want the Admin · Clients screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Admin · Clients screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/admin/clients` inside the admin layout.
- Client list `DataTable` NAME · FAMILY CONTACT · REMOVE with '+ Add client'; Remove links styled alert (no action — OQ-06/07).
- Add client `SidePanelForm`: Client name, Family contact name, Family contact email, Notes; 'Add client' (local only).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Clients renders, then rows include 'Margaret · Helen' and 'Doris · Tom' with 'Remove' links.
- [ ] **AC-02** (validation) Given Add client with empty Client name, when submitted, then an error is shown.
- [ ] **AC-03** (permission) Given the Clients screen, when rendered, then no edit control for client information exists (D28).

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-UI-05] Admin Settings screen (UI)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E1 — Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-15, UI-02 |
| Blocked by | — |
| Branch | `feature/admin-ui-settings` → PR to `admin-dev` |
| Labels | `care-compass` `phase-1` `admin` |
| Docs | `docs/development/admin-dev/admin-ui-settings/` |
| Requirements | REQ-02, REQ-N1, REQ-N2, REQ-N3 |

**Summary:** Admin Settings: Organisation info (name, ABN, phone, address) and Reset card — on fixtures


**User story**
> As a admin user, I want the Admin · Settings screen to look and behave as designed, so that the team and client can review it before data is connected.

**Description**
Builds the Admin · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

**In scope**
- Route `/admin/settings` inside the admin layout.
- 'Organisation info' `DetailsFormCard`: Organisation name, ABN, Phone, Address.
- Reset `SettingsActionCard`.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

**Out of scope**
- Real data, permissions and persistence (Phase 3 wiring features)
- Undesigned flows (listed in DECISIONS.md OQ-19)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given fixtures, when Settings renders, then 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072' are shown.
- [ ] **AC-02** (happy) Given the Admin header, when rendered, then no bell button exists.

**Testing notes**
- AC-01: component test
- AC-02: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

---

# CC-E2 · Phase 2 — Backend & data layer (parallel with Phase 1)

## [F0-04] Environment configuration and Supabase integration

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D2 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-02 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-supabase-environment` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-supabase-environment/` |
| Requirements | REQ-03, REQ-N4 |

**Summary:** Validated env config, local Supabase stack, and session-forwarding Supabase clients via @supabase/ssr


**User story**
> As a developer, I want one approved way to talk to Supabase, so that access control is always enforced by RLS.

**Description**
Sets up environment variable validation, Supabase CLI local development, and the only approved ways to create Supabase clients (browser, server, middleware, and an isolated service-role client for jobs).

**In scope**
- `supabase init` config committed; README section for `supabase start`, `supabase db reset`, `supabase test db`.
- `src/lib/env.ts`: Zod schema for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public) and `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional in dev); fail fast with the missing variable name.
- `.env.example` with every variable and comments; `.env*.local` git-ignored.
- `src/lib/supabase/browser.ts`, `server.ts` (cookies-based `createServerClient`), `middleware.ts` (session refresh helper) and root `middleware.ts` (named `proxy.ts` in Next.js 16 — follow `node_modules/next/dist/docs/`).
- `src/server/jobs/supabase-admin.ts` service-role client guarded by `import 'server-only'`.
- ESLint `no-restricted-imports` rule: the service-role module may only be imported from `src/server/jobs/**`.
- Generated database types script `npm run db:types` → `src/lib/supabase/database.types.ts`.

**Out of scope**
- Schema and RLS policies (F0-06 onward)
- Authentication UI (F0-07)
- Hosted environments (OQ-17)

**Acceptance criteria**
- [ ] **AC-01** (validation) Given `NEXT_PUBLIC_SUPABASE_URL` is missing, when `env.ts` is loaded, then it throws an error naming `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] **AC-02** (permission) Given a file outside `src/server/jobs/` imports the service-role client, when lint runs, then lint fails with the restricted-import message.
- [ ] **AC-03** (happy) Given a signed-in user session cookie, when the server client queries a table, then the query runs with that user's JWT (auth.uid() equals the user id).
- [ ] **AC-04** (edge) Given a production build, when the client bundle output is searched for the service-role key variable name, then no match is found.

**Testing notes**
- AC-01: unit test
- AC-02: ci test
- AC-03: integration test
- AC-04: ci test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-09] Recurrence engine (pure TypeScript)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D2–D3 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-02 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-12 (Recurrence options and plan horizon) |
| Branch | `feature/shared-recurrence-engine` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-recurrence-engine/` |
| Requirements | REQ-13, REQ-14, REQ-15 |

**Summary:** Expand stored recurrence rules into occurrences for any date range, with overrides, in Australia/Melbourne time


**User story**
> As a family member, I want recurring care to keep appearing year after year, so that I never have to re-enter the schedule.
> As a family member, I want to cancel or move one occurrence, so that one-off changes don't disturb the routine.

**Description**
A pure, heavily unit-tested module that turns a recurrence rule plus per-occurrence overrides into concrete occurrences on demand, supporting a lifetime (perpetual) schedule without pre-generating dates.

**In scope**
- Types: `RecurrenceRule { frequency: 'none'|'daily'|'weekly'|'monthly'|'yearly'; interval: number; anchor: LocalDateTime; until?: LocalDate }` (final option list per OQ-12).
- `expandOccurrences(rule, range, overrides)` → ordered occurrences within [range.start, range.end).
- Override types: cancelled occurrence; moved/modified occurrence (new start, duration).
- Occurrence identity: `originalStart` ISO string (stable key).
- Timezone handling in Australia/Melbourne including DST transitions (OQ-32).
- Month-end rule (e.g. anchor on 31st) and 29 February yearly rule — PROPOSED: clamp to last valid day; record in feature DECISIONS.md for confirmation.
- Performance guard: expanding 500 rules over a 6-week range completes within 100 ms in unit tests (PROPOSED budget).

**Out of scope**
- Database storage of rules (F0-11)
- UI for choosing recurrence (FAM-06)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a weekly rule anchored Monday 30 Nov 2026 09:00, when expanded for 30 Nov–13 Dec 2026, then exactly two occurrences are returned: 30 Nov 09:00 and 7 Dec 09:00.
- [ ] **AC-02** (happy) Given a yearly rule anchored 30 Nov 2026, when expanded for the year 2066, then one occurrence on 30 Nov 2066 is returned.
- [ ] **AC-03** (edge) Given a monthly rule anchored 31 Jan 2027, when expanded for February 2027, then one occurrence on 28 Feb 2027 is returned (PROPOSED clamp rule).
- [ ] **AC-04** (edge) Given a daily 09:00 rule, when expanded across the April 2027 DST change in Australia/Melbourne, then every occurrence is at 09:00 local time.
- [ ] **AC-05** (happy) Given a weekly rule and a cancellation override for 7 Dec 2026, when expanded for 30 Nov–20 Dec, then 30 Nov and 14 Dec are returned and 7 Dec is not.
- [ ] **AC-06** (happy) Given a modification override moving 7 Dec 09:00 to 8 Dec 10:00, when expanded, then the occurrence appears on 8 Dec 10:00 with originalStart 7 Dec 09:00.
- [ ] **AC-07** (validation) Given a rule with interval 0, when validated, then validation fails with an interval error.
- [ ] **AC-08** (edge) Given 500 weekly rules, when expanded over a 6-week range, then expansion completes in under 100 ms.

**Testing notes**
- AC-01: unit test
- AC-02: unit test
- AC-03: unit test
- AC-04: unit test
- AC-05: unit test
- AC-06: unit test
- AC-07: unit test
- AC-08: unit test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-06] Identity, organisation and client access schema with RLS

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D3–D4 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-04 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-07 (Client record creation and family linking), OQ-09 (Carer access model), OQ-16 (Family role granularity) |
| Branch | `feature/shared-tenancy-schema-rls` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-tenancy-schema-rls/` |
| Requirements | REQ-03, REQ-04, REQ-05, REQ-06, REQ-N6 |

**Summary:** Postgres tables for organisations, profiles, clients, family links and carer assignments, with tested RLS helper functions


**User story**
> As a family member, I want to see only my own family member's record, so that their private information stays private.
> As an admin, I want to see the clients my organisation currently serves, so that I can manage their care.
> As a carer, I want to see only clients I am assigned to, so that I cannot browse other people's records.

**Description**
Creates the core access model: which organisation a client currently belongs to, which family members hold authority, which carers are assigned, and database-enforced visibility for each role.

**In scope**
- Enums: `app_role` (family, carer, admin).
- Tables: `organisations`, `profiles` (1:1 auth.users; role, organisation_id nullable for family, first_name, last_name, phone, job_title, is_active), `clients` (current organisation_id, name, date_of_birth, suburb, avatar_path), `client_family_members` (client_id, profile_id, relationship_label), `carer_client_assignments` (carer profile, client, organisation, started_at, ended_at).
- SQL helper functions (SECURITY DEFINER, stable, search_path fixed): `current_profile()`, `is_family_of(client_id)`, `is_admin_of_client(client_id)`, `is_assigned_carer(client_id)`.
- RLS enabled on every table with policies: family reads own linked clients; admin reads clients whose current organisation is theirs; carer reads clients with an active assignment; nobody reads other organisations' profiles except display names needed on shared records (PROPOSED view).
- Inactive profiles (is_active = false) match no policy.
- pgTAP tests in `supabase/tests/` covering every role × table × allowed/denied case.
- `client_info_sections` table (client_id, key description|habits|medical_history, body, updated_by, updated_at) with RLS: family read/write, assigned carer read (write per OQ-09), admin none. Moved here from FAM-09 in plan v0.2 so Family and Carer wiring can run in parallel.

**Out of scope**
- Shifts (F0-10)
- Events (F0-11)
- Budget (F0-12)
- Organisation transfer function (FAM-13)
- Sign-in UI (F0-07)
- Account invitation flows (OQ-08)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen is linked to Margaret, when Helen selects from `clients`, then only Margaret's row is returned.
- [ ] **AC-02** (permission) Given Helen is not linked to Robert, when Helen selects Robert's row by id, then zero rows are returned.
- [ ] **AC-03** (happy) Given Priya is admin of Banksia Home Care, when she selects from `clients`, then exactly the clients whose organisation_id is Banksia are returned.
- [ ] **AC-04** (permission) Given a client belongs to another organisation, when Priya selects it, then zero rows are returned.
- [ ] **AC-05** (happy) Given Aisha has an active assignment to Margaret, when Aisha selects from `clients`, then Margaret is returned.
- [ ] **AC-06** (permission) Given Aisha belongs to Banksia but has no assignment to Robert, when Aisha selects Robert, then zero rows are returned.
- [ ] **AC-07** (edge) Given Aisha's assignment to Margaret has ended_at in the past, when Aisha selects Margaret, then zero rows are returned.
- [ ] **AC-08** (permission) Given Aisha's profile is_active is false, when she selects from `clients`, then zero rows are returned.

**Testing notes**
- AC-01: db test
- AC-02: db test
- AC-03: db test
- AC-04: db test
- AC-05: db test
- AC-06: db test
- AC-07: db test
- AC-08: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-08] Append-only audit log capture

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-audit-log-capture` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-audit-log-capture/` |
| Requirements | REQ-N7, REQ-N6 |

**Summary:** Database triggers record who changed what and when into an immutable audit log


**User story**
> As the client's family, I want every change to care records recorded permanently, so that I can trust the history.

**Description**
Creates the append-only audit table and generic trigger, attaches it to existing tables and defines the pattern later schema features must follow.

**In scope**
- `audit_log` table: id, occurred_at, actor_id, actor_role, table_name, record_id, action (INSERT/UPDATE/DELETE), before jsonb, after jsonb, client_id (nullable, for scoping).
- Generic trigger function `audit_row_change()` using `auth.uid()`.
- Attach to tables from F0-06; document the one-line attach pattern in ARCHITECTURE.md for later tables.
- RLS: no UPDATE or DELETE policy for any role; INSERT only via trigger; SELECT policy none by default (viewer is parked PL-06).

**Out of scope**
- Audit log viewer UI (PL-06, FR-10.2)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen updates Margaret's client row, when the update commits, then one audit_log row exists with action UPDATE, actor_id = Helen, and before/after values.
- [ ] **AC-02** (permission) Given any authenticated user, when they attempt UPDATE or DELETE on audit_log, then the statement is rejected.
- [ ] **AC-03** (edge) Given a change executed with the service role, when it commits, then the audit row has actor_role 'system'.

**Testing notes**
- AC-01: db test
- AC-02: db test
- AC-03: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-10] Shifts schema, active-shift function and conflict query

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D4–D5 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-09 (Carer access model) |
| Branch | `feature/shared-shifts-schema` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-shifts-schema/` |
| Requirements | REQ-05, REQ-23, REQ-25, REQ-26 |

**Summary:** Tables and RLS for carer shifts on clients, a DB function for 'carer is on active shift', and overlap detection as a warning


**User story**
> As a carer, I want edit rights only while I am on shift, so that records reflect who was actually working.
> As an admin, I want to be warned, not blocked, about overlapping shifts, so that I can still roster when needed.

**Description**
Stores non-recurring shifts assigning a carer to a client for a time window, exposes whether a carer is currently on shift for a client, and detects overlapping shifts without blocking them.

**In scope**
- `shifts` table: id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at, cancelled_at null.
- Constraints: ends_at > starts_at; carer's organisation = client's current organisation at insert (trigger).
- Function `carer_on_active_shift(client_id)` → boolean for auth.uid() at now().
- Function `overlapping_shifts(carer_id, starts_at, ends_at)` → rows (used for soft warning).
- Behaviour of carer_client_assignments on shift insert per OQ-09 answer.
- RLS: admin of the client's organisation can insert/update/cancel; carer can read own shifts; family can read shifts for linked clients (carer display name only).
- pgTAP tests.

**Out of scope**
- Assign-shift UI (ADM-07)
- Shift edit/extend UI (ADM-09)
- Recurring shifts (explicitly excluded, D31)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha has a shift for Margaret from 07:00 to 11:00 today, when `carer_on_active_shift(Margaret)` runs as Aisha at 09:00, then it returns true.
- [ ] **AC-02** (edge) Given the same shift, when the function runs at 11:00 exactly, then it returns false.
- [ ] **AC-03** (permission) Given the shift is cancelled, when the function runs at 09:00, then it returns false.
- [ ] **AC-04** (happy) Given Aisha has a shift 11:30–13:00, when `overlapping_shifts` is called for 12:00–15:00, then that shift is returned.
- [ ] **AC-05** (happy) Given an overlap exists, when Priya inserts the overlapping shift, then the insert succeeds.
- [ ] **AC-06** (permission) Given Aisha is a carer, when she inserts a shift, then the insert is rejected by RLS.
- [ ] **AC-07** (permission) Given Helen is Margaret's family, when she selects shifts, then she sees Margaret's shifts only.

**Testing notes**
- AC-01: db test
- AC-02: db test
- AC-03: db test
- AC-04: db test
- AC-05: db test
- AC-06: db test
- AC-07: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-07] Sign-in, sign-out, password reset and role-based routing

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D5 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-15, UI-02 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-08 (Account provisioning, sign-in method and MFA) |
| Branch | `feature/shared-authentication` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-authentication/` |
| Requirements | REQ-01, REQ-02, REQ-09 |

**Summary:** Email/password sign-in, sign-out, reset-password email flow, and redirect of each role to its own dashboard

> **Plan v0.2:** sign-in page uses UI-02 form components; role layouts from F0-15 already exist — add server-side guards to them.


**User story**
> As a family member, I want to sign in with my email and password, so that I can reach my family member's schedule simply.
> As any user, I want to land on my own dashboard only, so that I never see screens meant for another role.
> As any user, I want to reset my password by email, so that I can recover access without IT help.

**Description**
Implements authentication with Supabase Auth and routes Family, Carer and Admin users to their separate dashboards, blocking cross-role access server-side.

**In scope**
- `/sign-in` page: email + password, submit, error message on failure, link 'Forgot password?' (layout built from existing primitives and tokens — no bespoke visual design exists, OQ-19).
- Password reset: request page sending Supabase reset email; `/reset-password` page to set a new password from the emailed link.
- Reusable `requestPasswordReset()` server action used later by the Settings 'Reset' buttons (FAM-12, CAR-09, ADM-10).
- Sign-out action (placed in the top bar by F0-15).
- Post-sign-in redirect by role: family → `/family/[clientId]/home` (first linked client), carer → `/carer/home`, admin → `/admin/home`.
- Route-group guards: `(family)`, `(carer)`, `(admin)` layouts verify role server-side; wrong role → redirect to own home.
- Inactive profile → signed out with 'Your access has been withdrawn' message.
- MFA for admin per OQ-08 answer (not implemented until answered).
- Replace the mock `getCurrentUser()` data source with the Supabase session; keep the contract signature unchanged.

**Out of scope**
- Account creation/invitations (ADM-02, ADM-04 per OQ-08)
- Client switcher for multi-client family (OQ-30, parked)
- Organisation SSO (ADR-03 deferred)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen has an active family account linked to Margaret, when she signs in with correct credentials, then she lands on `/family/<Margaret id>/home`.
- [ ] **AC-02** (error) Given incorrect credentials, when sign-in is submitted, then a generic error is shown and no session cookie is set.
- [ ] **AC-03** (happy) Given Aisha (carer) signs in, when sign-in succeeds, then she lands on `/carer/home`.
- [ ] **AC-04** (permission) Given Aisha is signed in, when she requests `/admin/home`, then the server redirects her to `/carer/home`.
- [ ] **AC-05** (permission) Given no session, when `/family/<id>/home` is requested, then the response redirects to `/sign-in`.
- [ ] **AC-06** (permission) Given Aisha's profile is deactivated, when she makes her next request, then she is signed out and sees the withdrawn-access message.
- [ ] **AC-07** (happy) Given a registered email, when a reset is requested, then Supabase sends a reset email and the page confirms 'We'll email you a secure link'.
- [ ] **AC-08** (edge) Given an unregistered email, when a reset is requested, then the same confirmation is shown (no enumeration).

**Testing notes**
- AC-01: e2e test
- AC-02: integration test
- AC-03: e2e test
- AC-04: integration test
- AC-05: integration test
- AC-06: integration test
- AC-07: integration test
- AC-08: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-11] Care events, occurrence overrides and append-only completions

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D5–D6 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-09, F0-10, F0-08 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-10 (Status behaviour and undo), OQ-22 (Event fields), OQ-29 (Which nurse is shown on an event), OQ-09 (Carer access model), OQ-33 (Carer calendar and task semantics) |
| Branch | `feature/shared-care-events-schema` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-care-events-schema/` |
| Requirements | REQ-13, REQ-14, REQ-15, REQ-17, REQ-18, REQ-19, REQ-N6 |

**Summary:** Schema, RLS and server query layer for recurring/one-off events, per-occurrence overrides, completions and derived Planned/Done/Overdue status


**User story**
> As a family member, I want to see what care is due and its status, so that I know whether care is happening.
> As a carer or family member, I want to mark an occurrence done with my name recorded, so that there is an honest record of who did it.

**Description**
Stores care events (the Care Need Items as designed: 'events'), their occurrence overrides and an append-only completion history; provides a server query that returns occurrences with status and actor for a date range.

**In scope**
- `care_events`: id, client_id, title, description, starts_at (anchor), duration_minutes, recurrence (jsonb validated by F0-09 schema), recurrence_until null, is_active, created_by, created_at, updated_at (final fields per OQ-22).
- `care_event_overrides`: event_id, original_start, kind ('cancelled'|'modified'), new_starts_at, new_duration_minutes, created_by.
- `care_event_completions` (append-only): id, event_id, original_start, action ('done'|'undone' per OQ-10), actor_id, actor_display_name snapshot, organisation_id snapshot, occurred_at.
- Postgres function `set_occurrence_done(event_id, original_start)` — authorises (family of client, or carer on active shift per OQ-09) and inserts completion.
- TypeScript `deriveStatus(occurrence, latestCompletion, now)` → 'planned'|'done'|'overdue' with actor.
- Server query `getOccurrences(clientId, range)` combining events + F0-09 expansion + overrides + latest completion + assigned carer (per OQ-29).
- RLS: family read/write events of linked clients; assigned carer read; carer write per OQ-09; admin read (for Admin Home overdue) — writes by admin not in design.
- Attach audit trigger (F0-08).

**Out of scope**
- UI screens (FAM/CAR/ADM features)
- Event notes/comments (OQ-34, parked)
- Shift checklist sub-tasks (OQ-33)
- Expense linkage (CAR-08)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a weekly 09:00 'Morning medication' event for Margaret, when `getOccurrences` runs for 30 Nov–6 Dec 2026, then it returns the weekly occurrences in that range with status 'planned' for future ones.
- [ ] **AC-02** (happy) Given an occurrence whose due time has passed and has no done completion, when `deriveStatus` runs, then status is 'overdue'.
- [ ] **AC-03** (happy) Given an occurrence with a latest completion action 'done' by Aisha Rahman, when `deriveStatus` runs, then status is 'done' with actor label 'Aisha R.'.
- [ ] **AC-04** (happy) Given Helen is Margaret's family, when she calls `set_occurrence_done` for an occurrence, then a completion row with actor_id Helen is inserted.
- [ ] **AC-05** (permission) Given Aisha is assigned to Margaret but not on an active shift, when she calls `set_occurrence_done`, then it is rejected (per OQ-09 default).
- [ ] **AC-06** (permission) Given any user, when they try to UPDATE or DELETE a completion row, then the statement is rejected.
- [ ] **AC-07** (permission) Given Robert's family member, when they select Margaret's events, then zero rows are returned.
- [ ] **AC-08** (edge) Given an event is deactivated, when occurrences are requested for next month, then none are returned, and past completions still appear in history queries.

**Testing notes**
- AC-01: integration test
- AC-02: unit test
- AC-03: unit test
- AC-04: db test
- AC-05: db test
- AC-06: db test
- AC-07: db test
- AC-08: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-12] Budget buckets, fund top-ups, spending and summary calculation

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-08 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-03 (Budget threshold percentages), OQ-04 (Funding model: buckets, categories and periods), OQ-05 (Who can add funds and record spending; Budget History contents) |
| Branch | `feature/shared-budget-schema` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-budget-schema/` |
| Requirements | REQ-27, REQ-28, REQ-29, REQ-N12 |

**Summary:** Schema, RLS and exact-decimal calculations for budget buckets, top-up history, expenses and threshold state


**User story**
> As a family member, I want accurate remaining amounts per funding bucket, so that I know how much is left.

**Description**
Stores each client's funding buckets, fund top-up history and spending; calculates total, used, remaining, percent used and threshold state atomically in Postgres.

**In scope**
- `budget_buckets`: id, client_id, kind (per OQ-04; design shows NDIS, Fixed, Government), label, period_start, period_end.
- `budget_fund_entries` (top-ups, append-only): id, bucket_id, amount numeric(12,2) > 0, description, entry_date, recorded_by.
- `budget_expenses`: id, bucket_id, client_id, amount numeric(12,2) > 0, description, spent_on, event_id null, receipt_document_id null, recorded_by.
- View/function `budget_bucket_summary(client_id)` → total (sum of fund entries in period), used, remaining (may be negative), percent_used, threshold_state ('normal'|'warning'|'alert'|'depleted' using thresholds per OQ-03).
- Postgres functions `add_funds(bucket_id, amount, description, entry_date)` and `record_expense(...)` performing validated, atomic writes.
- RLS per OQ-05 (default PROPOSED: family manages funds; carer/admin read summaries; expense recording rights decided in OQ-05).
- TypeScript money formatting helper (AUD, no cents when whole, tabular) — display only; arithmetic stays in SQL.

**Out of scope**
- Budget UI (FAM-03, FAM-10, FAM-11)
- Threshold emails (INT-01)
- Funding-source restrictions and inter-bucket transfer rules (out of scope per CM-0309, parked PL-10)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given NDIS total $24,000 and expenses $9,120, when the summary runs, then remaining is 14880.00 and percent_used is 38.
- [ ] **AC-02** (happy) Given Government total $3,000 and expenses $2,760, when the summary runs, then percent_used is 92 and threshold_state is 'alert' (under 70/90/100 thresholds; recalculated once OQ-03 is answered).
- [ ] **AC-03** (edge) Given expenses exceed the total, when the summary runs, then remaining is negative and threshold_state is 'depleted'.
- [ ] **AC-04** (validation) Given `record_expense` is called with amount 0 or -5, when executed, then it raises a validation error and nothing is inserted.
- [ ] **AC-05** (permission) Given a user not linked to Margaret, when they select Margaret's buckets, then zero rows are returned.
- [ ] **AC-06** (validation) Given the decimal string '12.345', when parsed by the money schema, then validation fails (max 2 decimal places).

**Testing notes**
- AC-01: db test
- AC-02: db test
- AC-03: db test
- AC-04: db test
- AC-05: db test
- AC-06: unit test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-13] Client document storage

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D6–D7 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-11 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-26 (File upload constraints) |
| Branch | `feature/shared-document-storage` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-document-storage/` |
| Requirements | REQ-22, REQ-N5, REQ-N6 |

**Summary:** Private Supabase Storage bucket, documents table, storage policies, validated upload and signed download


**User story**
> As a family member, I want to upload a care plan and open it later, so that important documents are kept with the record.

**Description**
Stores uploaded files (care plans, reports, photos) for a client, optionally attached to an event, retained in perpetuity with access mirroring client access.

**In scope**
- Private storage bucket `client-documents`; object path `clients/{client_id}/{document_id}/{filename}`.
- `documents` table: id, client_id, event_id null, storage_path, filename, mime_type, size_bytes, uploaded_by, uploaded_at, detached_at null.
- Storage RLS mirroring `documents` row access.
- Server action `uploadDocument(clientId, file, eventId?)` validating type and size (limits per OQ-26).
- Server function `getDocumentUrl(documentId)` returning a short-lived signed URL (PROPOSED 60 s).
- No hard delete: `detachDocument` sets detached_at (perpetual retention, CIS3).

**Out of scope**
- File tile UI (FAM-08, FAM-09)
- Email ingestion of documents (CIS3 mentions; parked)
- Virus scanning (not in sources; flag in INT-05)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen is Margaret's family, when she uploads 'Care plan.pdf' within the allowed size, then a documents row exists and the object is stored under Margaret's path.
- [ ] **AC-02** (happy) Given an existing document, when Helen requests its URL, then a signed URL is returned that expires.
- [ ] **AC-03** (validation) Given a file type not in the allowed list, when uploaded, then it is rejected with a plain-language message and nothing is stored.
- [ ] **AC-04** (permission) Given Robert's family member, when they request Margaret's document object, then access is denied.
- [ ] **AC-05** (edge) Given a document is detached, when documents for the event are listed, then it is excluded but the row and object still exist.

**Testing notes**
- AC-01: integration test
- AC-02: integration test
- AC-03: integration test
- AC-04: db test
- AC-05: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [F0-16] Development seed data from the design content

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E2 — Phase 2 — Backend & data layer (parallel with Phase 1) |
| Component | Shared |
| Priority | Highest |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D7 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, F0-12, F0-13, F0-10 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-dev-seed-data` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-2` `shared` |
| Docs | `docs/development/shared/shared-dev-seed-data/` |
| Requirements | REQ-N9 |

**Summary:** Deterministic local seed matching Figma content (Banksia Home Care, Margaret, Helen, Aisha R., Priya, budgets, events)


**User story**
> As a developer, I want data identical to the designs, so that I can compare screens with Figma directly.

**Description**
Seeds the local database with the people, events, shifts, budgets and documents shown in the designs so each dashboard can be built and tested independently.

**In scope**
- Organisation Banksia Home Care (ABN 54 123 456 789, 03 9555 0102, 220 High St, Preston VIC 3072) and a second organisation for negative tests.
- Admin Priya; carers Aisha Rahman (Registered Nurse, 0423 987 654), Daniel K. (Registered Nurse), Sarah Nguyen (Enrolled Nurse), Marcus Chen (Support Worker), Fatima Ali (Support Worker).
- Clients Margaret (78, Preston VIC; family Helen, 0412 345 678, helen@example.com, 12 Wattle St, Preston VIC 3072), Robert (82, Reservoir; Michael), Elsie (90, Thornbury; Susan), Frank (76, Northcote; Karen), Doris (85, Preston; Tom), Harold (79, Coburg), Jean (88, Fairfield).
- Margaret's info sections (Description, Habits, Medical history) with the design text; documents Care plan.pdf, Medication schedule.pdf, Physio referral.pdf, Exercise plan.pdf, Medication chart.pdf (placeholder PDFs).
- Events around reference date Mon 30 Nov 2026: Morning medication 09:00 1 hr (daily per calendar), Physiotherapy 11:30 1 hr 30 min (Mon, Fri), Afternoon check-in 15:00 1 hr, Wound dressing check 10:00, Weekly weigh-in 09:30, Medication review 14:00, Evening medication; completions/overdue states matching Family Home, Task log and Admin Home.
- Budgets: NDIS $24,000 / $9,120 used; Fixed $5,000 / $2,250; Government $3,000 / $2,760; fund history 3 Nov 2026 +$6,000 'NDIS quarterly plan top-up', 15 Oct 2026 +$1,000 'Fixed funding top-up', 1 Oct 2026 +$750 'Government subsidy payment'.
- Shifts for Aisha (including 11:30–13:00 with Margaret used by the conflict warning) and Daniel K.
- Test users with known local-only passwords; seed guarded so it never runs outside local/test.

**Out of scope**
- Production data
- Client-supplied Care Need Items (import later when received)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given `supabase db reset`, when the budget summary for Margaret is queried, then NDIS remaining 14880, Fixed 2750, Government 240 are returned.
- [ ] **AC-02** (happy) Given the seed, when signing in as Helen, Aisha and Priya with seed credentials, then each succeeds and lands on their role home.
- [ ] **AC-03** (security) Given NODE_ENV=production, when the seed script runs, then it exits non-zero without writing.

**Testing notes**
- AC-01: integration test
- AC-02: integration test
- AC-03: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

---

# CC-E3 · Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin)

## [FAM-01] Family Home — Today day-view timeline

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, F0-16, FAM-UI-01 |
| Blocked by | OQ-29 (Which nurse is shown on an event) |
| Branch | `feature/family-home-today` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-home-today/` |
| Requirements | REQ-16, REQ-17, REQ-19, REQ-26 |

**Summary:** Day-view timeline 07:00–18:00 showing today's events with carer, duration and status pill

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to see today's care on a timeline, so that I know what's happening and what's done.

**Description**
The left 'Today' panel on the Family landing screen: an hour-gutter timeline listing today's occurrences for the client.

**In scope**
- Route `/family/[clientId]/home` page shell with left Today panel region (right column and budget strip are FAM-02/FAM-03).
- Card title 'Today' and right-aligned caption 'Mon 30 Nov · day view'.
- Hour gutter 07:00–18:00, 44px rows; past hours shown in text/muted per design.
- Event blocks positioned by start time and sized by duration with #0C9BA9 left stripe, title (Body/Emphasis), carer name (e.g. 'Aisha R.'), duration ('1 hr', '1 hr 30 min'), status pill at right.
- Empty state when no events today (EmptyState primitive; copy PROPOSED 'Nothing scheduled today').
- Loading skeleton and ErrorState with Retry.

**Out of scope**
- Clicking an event block (behaviour not designed; no navigation in this feature)
- Enter event button (FAM-06)
- Overdue and Recent activity cards (FAM-02)
- Budget strip (FAM-03)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Morning medication 09:00 1 hr done by Aisha Rahman, when the Today panel renders, then a block at 09:00 shows 'Morning medication', 'Aisha R.', '1 hr' and pill 'Done · Aisha R.'.
- [ ] **AC-02** (happy) Given Physiotherapy 11:30 lasting 90 minutes and not yet done, when rendered, then its block spans 11:30–13:00, shows '1 hr 30 min' and pill 'Planned'.
- [ ] **AC-03** (happy) Given events at 09:00 (60 min) and 11:30 (90 min), when `positionBlocks` runs with 44px rows from 07:00, then tops are 88px and 198px and heights 44px and 66px.
- [ ] **AC-04** (empty) Given no occurrences today, when rendered, then the empty state is shown instead of blocks.
- [ ] **AC-05** (permission) Given Helen requests `/family/<Robert id>/home`, when the server renders, then she is redirected and Robert's data is not fetched.
- [ ] **AC-06** (error) Given the occurrence query fails, when rendered, then ErrorState with Retry is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: unit test
- AC-04: component test
- AC-05: integration test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-02] Family Home — Overdue card and Recent activity

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, FAM-UI-01 |
| Blocked by | — |
| Branch | `feature/family-home-overdue-activity` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-home-overdue-activity/` |
| Requirements | REQ-17, REQ-19, REQ-21 |

**Summary:** Right-column Overdue card with count badge and Recent activity list of the last 5 items with 'View all'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to see overdue care straight away, so that I can follow up quickly.

**Description**
Shows overdue occurrences and the most recent five activity items for the client on the Family landing screen.

**In scope**
- Overdue card (alert tone): warning icon + 'Overdue' title, alert count badge with total, rows with title, date ('Fri 27 Nov'), Overdue pill, chevron.
- Recent activity card: title, 'View all' link, 5 most recent items (title, date, status pill, chevron).
- When no overdue items: EmptyState 'All caught up / There are no overdue tasks right now.' inside the card (from States sheet).
- Chevrons and 'View all' render as links to routes owned by FAM-15 and FAM-14; until those merge, links are omitted (controls absent, not dead links).

**Out of scope**
- Task log (FAM-14)
- Task detail (FAM-15)
- Enter event button (FAM-06)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given 3 overdue occurrences, when the Overdue card renders, then the badge shows '3' and three rows each show an 'Overdue' pill with warning icon.
- [ ] **AC-02** (empty) Given no overdue occurrences, when the card renders, then 'All caught up' and 'There are no overdue tasks right now.' are shown.
- [ ] **AC-03** (happy) Given the seed data, when Recent activity is queried, then exactly 5 items are returned ordered Mon 30 Nov, Sun 29 Nov, Sun 29 Nov, Sat 28 Nov, Sat 28 Nov.
- [ ] **AC-04** (happy) Given FAM-14 is available, when 'View all' is clicked, then the user navigates to `/family/<clientId>/tasks`.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: integration test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-03] Family Home — Budget strip

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-12, FAM-UI-01 |
| Blocked by | OQ-03 (Budget threshold percentages), OQ-04 (Funding model: buckets, categories and periods) |
| Branch | `feature/family-home-budget-strip` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-home-budget-strip/` |
| Requirements | REQ-27, REQ-28 |

**Summary:** Budget strip with aggregate remaining line and three individual bucket cards with threshold states

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to see each funding bucket separately, so that I notice when one is running low.

**Description**
Bottom strip on Family Home showing '$17,870 remaining of $32,000 · 44% used' and one card per funding bucket.

**In scope**
- Card: title 'Budget', aggregate line '$X remaining of $Y · Z% used', 'View breakdown' link (to Budget, FAM-10; omitted until merged).
- One bucket card per bucket: Label/Caps bucket name, Metric/Large remaining, 'of $total · N% used', progress bar.
- Alert state (≥ alert threshold): alert border and ground, warning icon top-right, remaining and bar in alert colours.
- Empty state when no buckets (OQ-24 copy PROPOSED 'No funding set up yet').

**Out of scope**
- Budget screen (FAM-10)
- Update funds (FAM-11)
- Threshold emails (INT-01)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed budgets, when the strip renders, then the aggregate line reads '$17,870 remaining of $32,000 · 44% used'.
- [ ] **AC-02** (happy) Given Government at 92% used, when its card renders, then it uses the alert tone, shows a warning icon and '$240' 'of $3,000 · 92% used'.
- [ ] **AC-03** (happy) Given NDIS at 38%, when its card renders, then it uses the normal tone and shows '$14,880' 'of $24,000 · 38% used'.
- [ ] **AC-04** (empty) Given no buckets exist, when the strip renders, then the no-funding empty state is shown.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-04] Family Calendar — day, week and month views

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8–D9 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, FAM-UI-02 |
| Blocked by | — |
| Branch | `feature/family-calendar-views` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-calendar-views/` |
| Requirements | REQ-14, REQ-16 |

**Summary:** Calendar with D/W/M segmented control (default week), Monday-first week grid, today highlight and navigation

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want a normal-looking calendar that opens on this week, so that I don't have to learn anything new.

**Description**
The Family Calendar grid: week view with hour gutter and event blocks, plus day and month views following normal calendar conventions.

**In scope**
- Route `/family/[clientId]/calendar` with URL params `view` (day|week|month) and `date`.
- Header range label ('30 Nov – 6 Dec 2026') and prev/next navigation (not drawn — PROPOSED chevrons; confirm).
- Segmented control D / W / M, default W.
- Week view: columns MON–SUN with day number, today column highlighted (brand-pale), hour gutter 07:00–18:00, event blocks with time and title and left stripe.
- Day view: single column with the same block style.
- Month view: calendar cells (default, today, selected, has-events, out-of-month).
- Selecting a day sets `date` (consumed by FAM-05 Tasks panel).

**Out of scope**
- Tasks and Log panels (FAM-05)
- Opening/editing an event from a block (FAM-07)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given no view param, when the calendar renders on Mon 30 Nov 2026, then W is selected and columns MON 30 to SUN 6 are shown with 30 highlighted.
- [ ] **AC-02** (happy) Given date 2 Dec 2026, when `weekRange` runs, then it returns Mon 30 Nov 2026 to Sun 6 Dec 2026.
- [ ] **AC-03** (happy) Given the week of 30 Nov with seed data, when rendered, then '09:30 Weekly weigh-in' appears in the THU 3 column.
- [ ] **AC-04** (happy) Given the week view, when M is selected, then a month grid for December 2026 is shown with out-of-month days styled muted.
- [ ] **AC-05** (edge) Given a weekly event anchored 2026, when the week of 5 Jan 2060 is viewed, then its occurrence is displayed.
- [ ] **AC-06** (validation) Given `date=not-a-date`, when the page renders, then the current week is shown.

**Testing notes**
- AC-01: component test
- AC-02: unit test
- AC-03: component test
- AC-04: e2e test
- AC-05: integration test
- AC-06: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-05] Family Calendar — Tasks panel and Log panel

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, FAM-UI-02 |
| Blocked by | OQ-10 (Status behaviour and undo) |
| Branch | `feature/family-calendar-tasks-log` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-calendar-tasks-log/` |
| Requirements | REQ-18, REQ-19, REQ-21 |

**Summary:** Tasks checklist for the selected day (tick to mark Done) and Log panel with recent items and 'View all'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to tick off a task, so that the record shows it was done and by whom.

**Description**
Panels beneath the Family calendar: tick off the selected day's tasks and see a short activity log.

**In scope**
- Tasks panel: title 'Tasks', selected date subtitle ('Monday 30 November'), checkbox per occurrence; checked items struck through and muted.
- Ticking calls `set_occurrence_done` and optimistically updates, reverting with an inline error on failure.
- Unticking behaviour per OQ-10 (not implemented until answered).
- Log panel: title 'Log', 'View all' link (to FAM-14), last 3 items (PROPOSED count from design) with status pills and chevrons (to FAM-15 once merged).

**Out of scope**
- Task log page (FAM-14)
- Task detail (FAM-15)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Physiotherapy on Mon 30 Nov is Planned, when Helen ticks it, then it shows struck through and the completion is recorded with actor Helen.
- [ ] **AC-02** (error) Given the save fails, when Helen ticks a task, then the checkbox returns to unticked and an error message is shown.
- [ ] **AC-03** (happy) Given the selected date is Monday 30 November, when the Tasks panel renders, then its subtitle reads 'Monday 30 November' and lists that day's occurrences.
- [ ] **AC-04** (happy) Given seed data, when the Log panel renders, then it lists Morning medication (Done · Aisha R.), Evening medication (Done · Aisha R.) and Weekly weigh-in (Overdue).

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-06] Family — Add event (Enter event)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-09, F0-11, FAM-UI-03 |
| Blocked by | OQ-22 (Event fields), OQ-12 (Recurrence options and plan horizon), OQ-10 (Status behaviour and undo) |
| Branch | `feature/family-add-event` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-add-event/` |
| Requirements | REQ-13, REQ-14, REQ-18 |

**Summary:** Enter event form: date with picker, recurring option, description, documents; entry from Home 'Enter event'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to enter a new care event, so that it appears on the schedule and repeats as needed.

**Description**
Creates a one-off or recurring event for the client using the event form shown in the Edit event design.

**In scope**
- 'Enter event' primary button in the Home right column linking to `/family/[clientId]/events/new`.
- Form fields per design: Date (input with calendar icon), Recurring (select), Description (textarea), Documents (file tiles — upload handled by FAM-08, rendered as disabled-absent until merged).
- Additional fields required by data model pending OQ-22 (title, start time, duration).
- 'Pick a date' side panel month grid with dots on days that already have events; selected day filled.
- Save event (primary) and Cancel (secondary) buttons; Cancel returns to previous page.
- Status chips excluded from Add (new events are Planned) — PROPOSED, subject to OQ-10.
- Zod validation shared with server action; plain-language field errors.

**Out of scope**
- Editing existing events (FAM-07)
- Document upload (FAM-08)
- Calendar entry point (not designed)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen on Home, when she clicks 'Enter event', completes required fields with Recurring 'Weekly' and saves, then the event appears on the calendar every week from the chosen date.
- [ ] **AC-02** (validation) Given the Date field is empty, when Save event is pressed, then an error is shown on Date and nothing is submitted.
- [ ] **AC-03** (happy) Given the Pick a date panel for November 2026, when rendered with seed data, then days 24, 26, 27 show event dots and the selected day is filled.
- [ ] **AC-04** (permission) Given a carer or unrelated user calls the create-event action for Margaret, when executed, then it is rejected.
- [ ] **AC-05** (happy) Given Cancel is clicked, when the form has unsaved input, then no event is created.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test
- AC-04: integration test
- AC-05: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-07] Family — Edit event

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | FAM-06 |
| Blocked by | OQ-10 (Status behaviour and undo), OQ-11 (Editing recurring events: scope), OQ-22 (Event fields) |
| Branch | `feature/family-edit-event` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-edit-event/` |
| Requirements | REQ-14, REQ-15, REQ-17 |

**Summary:** Edit an existing event or occurrence: date, recurring, status, description, documents

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to change a care event, so that the schedule matches current needs.

**Description**
The 'Edit event' screen, prefilled, reached from Task detail 'Edit' or a calendar event block.

**In scope**
- Route `/family/[clientId]/events/[eventId]/edit?occurrence=<originalStart>`; header title 'Edit event'.
- Prefilled EventForm; Status chips Planned / Done / Overdue per OQ-10 resolution.
- Edit scope (this occurrence / this and future / entire series) per OQ-11 — not built until answered.
- Save writes event update or occurrence override; history (completions) untouched.
- Entry points: clicking an event block in FAM-04 and 'Edit' in Task detail (FAM-15).

**Out of scope**
- Deleting events (not designed; use deactivate per FR-1.2 later)
- Carer editing (CAR-07)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Physiotherapy weekly with description text, when Helen changes the description and saves, then the new description shows on Task detail.
- [ ] **AC-02** (happy) Given an event with past completions, when its recurrence changes from weekly to fortnightly, then past completions are unchanged in the task log.
- [ ] **AC-03** (validation) Given the edit form, when Date is cleared and saved, then a Date error is shown.
- [ ] **AC-04** (permission) Given Robert's family member, when they open Margaret's event edit URL, then they are redirected without data.

**Testing notes**
- AC-01: e2e test
- AC-02: integration test
- AC-03: component test
- AC-04: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-08] Family — Event documents (file tiles)

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-13, FAM-UI-03 |
| Blocked by | OQ-26 (File upload constraints) |
| Branch | `feature/family-event-documents` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-event-documents/` |
| Requirements | REQ-22 |

**Summary:** Attach, list and open documents on an event using file tiles and '+ Add file'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to attach a referral letter to physiotherapy, so that carers can find it with the event.

**Description**
Adds working document tiles to the event form and Task detail, backed by document storage.

**In scope**
- File tiles showing file icon + filename; clicking opens a signed URL in a new tab.
- '+ Add file' tile opening the file picker; upload progress; error on invalid type/size.
- Documents attached on save of Add/Edit event; listed read-only on Task detail (FAM-15 displays via shared component).

**Out of scope**
- Client-level documentation (FAM-09)
- Removing/detaching documents (not designed)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given the Edit event form, when Helen adds 'Physio referral.pdf' and saves, then a tile 'Physio referral.pdf' appears on the event.
- [ ] **AC-02** (validation) Given a disallowed file type, when selected, then an inline error is shown and no tile is added.
- [ ] **AC-03** (happy) Given an existing tile, when clicked, then the document opens via a signed URL.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-09] Family — Client info

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-13, FAM-UI-04 |
| Blocked by | OQ-26 (File upload constraints) |
| Branch | `feature/family-client-info` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-client-info/` |
| Requirements | REQ-10, REQ-22 |

**Summary:** Client info page: summary header, Description, Habits, Medical history sections with Edit, and Documentation tiles

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to keep my family member's description, habits and medical history current, so that carers know how to care for them.

**Description**
The Family 'Info' screen showing and editing the client's key information and client-level documents.

**In scope**
- Route `/family/[clientId]/info`; in-page summary (avatar, name, '78 years · Preston VIC · Banksia Home Care').
- Section cards Description, Habits, Medical history each with 'Edit' link toggling an inline textarea with Save/Cancel (edit interaction not drawn — PROPOSED inline).
- Documentation card with file tiles and '+ Add file' (client-level documents, event_id null).
- Shared `ClientInfoView` component parameterised for reuse by CAR-04.
- Use the `client_info_sections` table created by F0-06.

**Out of scope**
- Additional client fields requested by client (DOB entry, contacts, behaviours of concern, expandable headings) — OQ-38
- Admin editing (forbidden, D28)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Margaret's Habits section, when Helen clicks Edit, changes the text and saves, then the new text is displayed.
- [ ] **AC-02** (happy) Given seed data, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order.
- [ ] **AC-03** (validation) Given the edit textarea exceeds the maximum length, when saved, then an error is shown and the text is not saved.
- [ ] **AC-04** (permission) Given Priya (admin), when she updates client_info_sections for Margaret, then the update is rejected.
- [ ] **AC-05** (happy) Given the Documentation card, when Helen adds 'Care plan.pdf', then a tile with that name appears.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test
- AC-04: db test
- AC-05: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-10] Family — Budget overview and history

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-12, FAM-UI-05 |
| Blocked by | OQ-04 (Funding model: buckets, categories and periods), OQ-05 (Who can add funds and record spending; Budget History contents) |
| Branch | `feature/family-budget-overview` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-budget-overview/` |
| Requirements | REQ-27, REQ-28, REQ-29 |

**Summary:** 'Funds by source' bucket cards and a History table of fund entries

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-05**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to see funds by source and their history, so that I understand the financial position.

**Description**
The Family Budget screen: per-bucket remaining/total/percent and a dated history of top-ups.

**In scope**
- Route `/family/[clientId]/budget`.
- Card 'Funds by source' with bucket cards (reuse BudgetBucketCard) — 'Update' button slot reserved for FAM-11.
- History table: Date · Description · Amount (e.g. '3 Nov 2026 · NDIS quarterly plan top-up · +$6,000'), newest first.
- Wire Home 'View breakdown' link to this route.

**Out of scope**
- Update funds flow (FAM-11)
- Expense entries in history (OQ-05)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed data, when Budget renders, then three bucket cards NDIS, Fixed, Government appear with remaining $14,880, $2,750, $240.
- [ ] **AC-02** (happy) Given seed fund entries, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'.
- [ ] **AC-03** (empty) Given no fund entries, when History renders, then the empty state is shown.
- [ ] **AC-04** (happy) Given Home, when 'View breakdown' is clicked, then the Budget page opens.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: component test
- AC-04: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-11] Family — Update funds

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | FAM-10 |
| Blocked by | OQ-05 (Who can add funds and record spending; Budget History contents), OQ-04 (Funding model: buckets, categories and periods), OQ-19 (Figma access and remaining design gaps) |
| Branch | `feature/family-budget-update-funds` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-budget-update-funds/` |
| Requirements | REQ-29 |

**Summary:** 'Update' action on Funds by source to add funds to a bucket (flow not yet designed)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-05**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As the person responsible for funds, I want to record new funding, so that the remaining budget is correct.

**Description**
Lets the authorised person record a fund top-up against a bucket, producing a History entry and updated totals.

**In scope**
- 'Update' primary button on Funds by source.
- Update form (modal or panel — design required): bucket, amount, date, description; calls `add_funds`.
- Success updates cards and History without full reload.

**Out of scope**
- Editing/removing past entries
- Inter-bucket transfers (parked PL-10)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given NDIS remaining $14,880, when $1,000 is added to NDIS, then the NDIS card shows $15,880 and History's first row shows '+$1,000'.
- [ ] **AC-02** (validation) Given amount '-50', when submitted, then a validation error is shown and nothing is saved.
- [ ] **AC-03** (permission) Given a user without fund-edit rights (per OQ-05), when they call the action, then it is rejected.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-12] Family — Settings: family info and password reset

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-07, FAM-UI-06 |
| Blocked by | OQ-35 (Settings forms save behaviour) |
| Branch | `feature/family-settings-profile` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-settings-profile/` |
| Requirements | REQ-01 |

**Summary:** Settings page with Family info (Name, Phone, Email, Address) and 'Reset username / password'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-06**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to update my phone number, so that the care team can reach me.

**Description**
The Family Settings screen apart from Change organisation: personal contact details and requesting a reset link.

**In scope**
- Route `/family/[clientId]/settings`; page title 'Settings'.
- Family info card: Name, Phone, Email, Address inputs bound to the signed-in profile; save mechanism per OQ-35.
- Reset username / password card: description 'We'll email you a secure link to reset your credentials.' and 'Reset' button calling `requestPasswordReset()` from F0-07 with confirmation message.
- Layout slot for Change organisation card (FAM-13).

**Out of scope**
- Change organisation (FAM-13)
- Changing login email (Supabase email change flow not designed)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen's phone '0412 345 678', when she changes it and saves (per OQ-35), then the new number is shown after reload.
- [ ] **AC-02** (validation) Given an invalid email 'helen@', when saved, then an email error is shown.
- [ ] **AC-03** (happy) Given Helen clicks Reset, when the action runs, then a reset email is requested for her address and a confirmation message is shown.
- [ ] **AC-04** (permission) Given Helen, when she updates another profile's row, then RLS rejects it.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: integration test
- AC-04: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-13] Family — Change organisation

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D11 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-10, FAM-UI-06 |
| Blocked by | OQ-06 (Organisation change model), OQ-15 (Incoming organisation's visibility of history) |
| Branch | `feature/family-change-organisation` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-change-organisation/` |
| Requirements | REQ-04, REQ-N6 |

**Summary:** 'Change' → choose a registered organisation → destructive confirmation → atomic transfer retaining history

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-06**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to move my mother's care to another organisation, so that she keeps all her records while the old provider loses access.

**Description**
Lets the family move the client to another organisation: history retained, nurse assignments and future shifts cleared, old organisation loses access immediately.

**In scope**
- Change organisation card: 'Currently registered with Banksia Home Care.' and 'Change' button.
- Organisation picker listing organisations registered with Care Compass (UI not designed — OQ-06).
- Confirmation modal (destructive tone): title 'Change organisation?', body 'Switching Margaret's care to a new organisation keeps her routines, events, budget, documents and history. Assigned nurses and all future shifts will be cleared, and Banksia Home Care will lose access immediately. This can't be undone from your side.', buttons Cancel / Change organisation, close X.
- Postgres function `transfer_client_organisation(client_id, new_org_id)`: verify family authority; update clients.organisation_id; end active carer assignments; cancel shifts starting after now(); audit; single transaction.

**Out of scope**
- Organisation registration (PL-18)
- Notifying organisations by email (not specified)
- Incoming organisation's view of old history (OQ-15 decides RLS)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Margaret at Banksia with 3 future shifts and 1 active assignment, when Helen transfers her to a second organisation, then clients.organisation_id changes, future shifts are cancelled and the assignment is ended.
- [ ] **AC-02** (happy) Given the transfer completed, when Priya (Banksia admin) selects Margaret, then zero rows are returned.
- [ ] **AC-03** (happy) Given the transfer completed, when Margaret's events, budget entries, documents and completions are counted, then counts equal the pre-transfer counts.
- [ ] **AC-04** (happy) Given Change organisation is confirmed from the picker, when the modal opens, then it shows the destructive title 'Change organisation?' and the retained/cleared wording.
- [ ] **AC-05** (happy) Given the modal is open, when Cancel is pressed, then no transfer action is called.
- [ ] **AC-06** (permission) Given Aisha (carer), when she calls `transfer_client_organisation`, then it raises a permission error.

**Testing notes**
- AC-01: db test
- AC-02: db test
- AC-03: db test
- AC-04: component test
- AC-05: component test
- AC-06: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-14] Family — Task log

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D11 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, FAM-UI-07 |
| Blocked by | OQ-29 (Which nurse is shown on an event) |
| Branch | `feature/family-task-log` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-task-log/` |
| Requirements | REQ-21 |

**Summary:** Full task list with server-side search, status filter and rows Date · Task · Nurse · Status linking to detail

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-07**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to search and filter all tasks, so that I can check what happened on any day.

**Description**
Drill-down page (no rail item) listing every task occurrence up to today with search and filtering.

**In scope**
- Route `/family/[clientId]/tasks`; title 'Task log'; no rail item, Home/Calendar rail stays unselected (PROPOSED: Home active).
- Search field 'Search tasks' (server query by title, debounced) with loading and no-results states.
- Status select 'All statuses' / Planned / Done / Overdue.
- Table: DATE ('Mon 30 Nov'), TASK, NURSE ('Aisha R.' or '—'), STATUS pill, chevron; rows clickable to FAM-15.
- Range: occurrences up to end of today, newest first (PROPOSED per design, OQ-31).
- Pagination/incremental loading (PROPOSED 25 rows + load more).
- Wire 'View all' on Home Recent activity and Calendar Log.

**Out of scope**
- Admin/Carer task logs (Q14, parked PL-20)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed data, when the task log is loaded with no filters, then the first rows are Mon 30 Nov Morning medication (Done · Aisha R.), Physiotherapy (Planned), Afternoon check-in (Planned).
- [ ] **AC-02** (happy) Given status filter Overdue, when applied, then only Weekly weigh-in (Sun 29 Nov) and Medication review (Sat 28 Nov) are listed, each with nurse '—'.
- [ ] **AC-03** (empty) Given search 'Zoe', when results are empty, then 'No matches for "Zoe".' is displayed.
- [ ] **AC-04** (happy) Given a row, when clicked, then the Task detail for that occurrence opens.
- [ ] **AC-05** (edge) Given weekly recurring events extending forever, when the log loads, then no occurrence after today is returned.

**Testing notes**
- AC-01: integration test
- AC-02: integration test
- AC-03: component test
- AC-04: e2e test
- AC-05: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [FAM-15] Family — Task detail

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D11 |
| Lane | F — Family |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, F0-13, FAM-UI-07 |
| Blocked by | OQ-29 (Which nurse is shown on an event), OQ-10 (Status behaviour and undo) |
| Branch | `feature/family-task-detail` → PR to `family-dev` |
| Labels | `care-compass` `phase-3` `family` |
| Docs | `docs/development/family-dev/family-task-detail/` |
| Requirements | REQ-19, REQ-21, REQ-22 |

**Summary:** Single task view: title, date, assignee, status with actor and completion time, description with Edit, documents

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-07**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a family member, I want to open a task and see its full record, so that I know who completed it and when.

**Description**
Drill-down detail for one occurrence reached from the Task log, Overdue card, Recent activity and Log panel.

**In scope**
- Route `/family/[clientId]/tasks/[occurrenceKey]`.
- '< Back to Task log' link; title (Title/Page); subline 'Monday 30 November 2026 · Assigned to Aisha R.'.
- Status card: pill ('Done · Aisha R.') and 'Completed at 09:14' when done; planned/overdue shows pill only.
- Description card with 'Edit' link → FAM-07 edit route.
- Documents card with file tiles (read-only here).
- Wire chevrons from Overdue card, Recent activity, Log panel and task log rows.

**Out of scope**
- Undo Done (OQ-10)
- Comments/notes (OQ-34)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Morning medication on 30 Nov done by Aisha Rahman at 09:14, when Task detail renders, then it shows 'Done · Aisha R.' and 'Completed at 09:14'.
- [ ] **AC-02** (happy) Given the task, when rendered, then the subline reads 'Monday 30 November 2026 · Assigned to Aisha R.'.
- [ ] **AC-03** (happy) Given the Overdue card on Home, when the chevron on 'Wound dressing check' is clicked, then its Task detail opens.
- [ ] **AC-04** (validation) Given an occurrence key for Robert's event under Margaret's route, when requested, then a not-found page is returned.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: e2e test
- AC-04: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-01] Carer Home — Today's calendar and Tasks

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-10, F0-11, CAR-UI-01 |
| Blocked by | OQ-33 (Carer calendar and task semantics), OQ-09 (Carer access model) |
| Branch | `feature/carer-home-today` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-home-today/` |
| Requirements | REQ-05, REQ-17, REQ-25 |

**Summary:** Carer landing: 'Today's calendar' rows (time, client — event, status) and 'Tasks' checklist

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to see today's care for my clients, so that I know what to do on this shift.

**Description**
The Carer Home screen's top cards listing today's occurrences across the carer's assigned clients.

**In scope**
- Route `/carer/home`; header 'Home' with bell (bell behaviour CAR-02).
- 'Today's calendar' card: rows '09:00 · Margaret — Morning medication · status pill'.
- 'Tasks' card: checkbox list of the same occurrences (completion behaviour in CAR-06; here read-only checked state).
- Empty state 'Nothing scheduled today' (PROPOSED), skeleton and error states.

**Out of scope**
- Notifications card (CAR-02)
- Ticking tasks (CAR-06)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed data for Aisha on 30 Nov, when Home renders, then Today's calendar shows '09:00 Margaret — Morning medication' with 'Done · Aisha R.', '11:30 Margaret — Physiotherapy' Planned and '15:00 Margaret — Afternoon check-in' Planned.
- [ ] **AC-02** (permission) Given Aisha is not assigned to Robert, when her today query runs, then no Robert occurrences are returned.
- [ ] **AC-03** (empty) Given no occurrences, when Home renders, then the empty state is shown.

**Testing notes**
- AC-01: component test
- AC-02: integration test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-02] Carer — Notifications card and bell

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-10, F0-13, CAR-UI-01 |
| Blocked by | OQ-14 (Carer notifications scope) |
| Branch | `feature/carer-notifications` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-notifications/` |
| Requirements | REQ-32 |

**Summary:** In-app notifications (source chip Admin/Family + message) on Carer Home and a header bell

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to be told when I'm given a new shift, so that I don't miss it.

**Description**
Records and displays notifications for carers such as new shift assignments and family document updates.

**In scope**
- `carer_notifications` table (recipient, source 'admin'|'family', kind, message, client_id, created_at, read_at) with RLS recipient-only.
- DB triggers: shift inserted → notify carer (source admin); client document added by family → notify carers assigned to that client (source family).
- Notifications card on Carer Home: rows with source chip and message, newest first.
- Bell in header: behaviour per OQ-14 (e.g. unread indicator + scroll/panel).

**Out of scope**
- 'Added a note' notifications (notes feature not designed, OQ-34)
- Email or push notifications
- Budget notifications (email only, D23)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Priya assigns Aisha a shift on Tue 1 Dec 09:00–11:00 for Margaret, when the insert commits, then a notification for Aisha with source 'admin' and message 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' exists.
- [ ] **AC-02** (happy) Given Helen uploads a client document for Margaret, when it commits, then each carer assigned to Margaret receives a 'family' notification.
- [ ] **AC-03** (permission) Given Daniel, when he selects notifications, then Aisha's notifications are not returned.
- [ ] **AC-04** (happy) Given three notifications, when the card renders, then each row shows its source chip and message newest first.

**Testing notes**
- AC-01: db test
- AC-02: db test
- AC-03: db test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-03] Carer — Patients

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-10, CAR-UI-02 |
| Blocked by | OQ-09 (Carer access model) |
| Branch | `feature/carer-patients` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-patients/` |
| Requirements | REQ-05 |

**Summary:** Searchable grid of assigned patients (avatar, name, age, suburb); opens client info

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to see and search my patients, so that I can open the right person's information.

**Description**
The Carer Patients screen listing clients the carer is currently assigned to.

**In scope**
- Route `/carer/patients`; search field 'Search patients' (server-side, D32).
- Person cards grid (4 columns at 1440): avatar initial, name, '78 years · Preston VIC'.
- Card click → `/carer/patients/[clientId]` (CAR-04).
- Empty state 'No patients assigned yet / New patients will appear here once they're assigned to you.'; card-grid skeleton; error state.

**Out of scope**
- Client info page (CAR-04)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha is assigned to Margaret, Robert, Elsie, Frank, Doris, Harold and Jean, when Patients loads, then 7 cards are shown including 'Margaret' '78 years · Preston VIC'.
- [ ] **AC-02** (happy) Given search 'Eld', when submitted, then only Elsie is shown.
- [ ] **AC-03** (empty) Given no assignments, when Patients renders, then 'No patients assigned yet' is shown.
- [ ] **AC-04** (permission) Given a client in the same organisation without assignment, when Patients loads, then that client is absent.

**Testing notes**
- AC-01: integration test
- AC-02: integration test
- AC-03: component test
- AC-04: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-04] Carer — Client info

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-10, F0-13, CAR-UI-02 |
| Blocked by | OQ-09 (Carer access model) |
| Branch | `feature/carer-client-info` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-client-info/` |
| Requirements | REQ-05, REQ-10 |

**Summary:** Carer view of client info (same view as Family minus organisation/payment controls); edits only during active shift

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to read my patient's information and update it on shift, so that care notes stay accurate.

**Description**
Reuses the Family Info view for a patient opened from Patients, with edit controls present only when the carer is on an active shift for that client.

**In scope**
- Route `/carer/patients/[clientId]` using `ClientInfoView` in carer mode.
- Header: 'Patients' screen name (PROPOSED) with in-page client summary.
- Edit links and Add file tile rendered only when `carer_on_active_shift(clientId)` is true.
- No organisation or payment controls (D10).

**Out of scope**
- Carer editing outside shift
- Budget views for carers

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha is assigned but not on shift, when Margaret's info renders, then no Edit links or Add file tile exist.
- [ ] **AC-02** (happy) Given Aisha is on an active shift for Margaret, when she edits Habits and saves, then the change is shown.
- [ ] **AC-03** (permission) Given Aisha is not on shift, when she updates client_info_sections for Margaret directly, then RLS rejects it.
- [ ] **AC-04** (permission) Given Aisha is not assigned to a client, when she opens that client's info URL, then she is redirected to Patients.

**Testing notes**
- AC-01: component test
- AC-02: e2e test
- AC-03: db test
- AC-04: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-05] Carer — Calendar (shifts) and selected-shift tasks

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9–D10 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-10, F0-11, CAR-UI-03 |
| Blocked by | OQ-33 (Carer calendar and task semantics) |
| Branch | `feature/carer-calendar-shifts` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-calendar-shifts/` |
| Requirements | REQ-25 |

**Summary:** Week/day/month calendar of the carer's shifts with a 'Tasks for the selected shift' panel

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to see my shifts in a calendar, so that I know when and where I'm working.

**Description**
The Carer Calendar screen: calendar blocks labelled '09:00 Margaret — Morning m…' and a task panel for the selected block.

**In scope**
- Route `/carer/calendar`; title 'Calendar', section 'Shifts', D/W/M default W; reuse calendar components from FAM-04.
- Blocks show time and '<Client> — <title>' truncated with ellipsis.
- Selecting a block shows 'Tasks for the selected shift' with subtitle '09:00 · Margaret — Morning medication' and a checklist (content per OQ-33).

**Out of scope**
- Ticking tasks (CAR-06)
- Shift editing (admin only)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed data for Aisha, when week of 30 Nov renders, then MON 30 shows blocks at 09:00, 11:30 and 15:00 labelled with 'Margaret —'.
- [ ] **AC-02** (happy) Given the 09:00 block is selected, when the task panel renders, then its subtitle reads '09:00 · Margaret — Morning medication'.
- [ ] **AC-03** (permission) Given Daniel's shifts exist, when Aisha's calendar loads, then none of Daniel's shifts appear.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-06] Carer — Mark tasks done

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-10, F0-11, CAR-UI-01, CAR-UI-03 |
| Blocked by | OQ-09 (Carer access model), OQ-10 (Status behaviour and undo), OQ-33 (Carer calendar and task semantics) |
| Branch | `feature/carer-complete-task` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-complete-task/` |
| Requirements | REQ-18, REQ-19, REQ-05 |

**Summary:** Tick tasks on Carer Home and the selected-shift panel, recording actor and time, only during an active shift

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to tick off care as I do it, so that the family and my manager can see it's done.

**Description**
Lets carers complete occurrences with their identity recorded, respecting shift-based edit rights.

**In scope**
- Checkboxes on Home Tasks card and Calendar task panel call `set_occurrence_done`.
- Checkboxes rendered interactive only during an active shift for that client; otherwise read-only state display.
- Optimistic update with revert on failure.

**Out of scope**
- Evidence upload on completion (CIS5; not designed — parked)
- Comments (OQ-34)
- Expense on completion (CAR-08)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha on an active shift for Margaret, when she ticks Physiotherapy on Home, then Family Home shows 'Done · Aisha R.' for Physiotherapy.
- [ ] **AC-02** (permission) Given Aisha is not on shift, when Home renders, then task checkboxes are not interactive.
- [ ] **AC-03** (error) Given the server rejects the completion, when ticked, then the checkbox reverts and an error is shown.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-07] Carer — Add and edit events for a patient

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | CAR-04, F0-11, UI-02 |
| Blocked by | OQ-09 (Carer access model), OQ-22 (Event fields), OQ-19 (Figma access and remaining design gaps) |
| Branch | `feature/carer-manage-events` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-manage-events/` |
| Requirements | REQ-18 |

**Summary:** Carer creates/edits a patient's event during an active shift (entry point not designed)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to add a care event for my patient during my shift, so that new needs get scheduled.

**Description**
Implements sequence Use Case 2: carer opens a rostered patient's calendar and adds a task with date, description and documentation.

**In scope**
- Entry point from carer patient view (design required).
- Reuse EventForm.
- Server action authorises active-shift carers only.

**Out of scope**
- Cost/expense capture (CAR-08)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha on shift for Margaret, when she adds an event and saves, then it appears on Margaret's family calendar.
- [ ] **AC-02** (permission) Given Aisha off shift, when she calls the create-event action, then it is rejected.

**Testing notes**
- AC-01: e2e test
- AC-02: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-08] Carer — Record an expense

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-12, F0-13 |
| Blocked by | OQ-19 (Figma access and remaining design gaps), OQ-04 (Funding model: buckets, categories and periods), OQ-05 (Who can add funds and record spending; Budget History contents) |
| Branch | `feature/carer-record-expense` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-record-expense/` |
| Requirements | REQ-28, REQ-30 |

**Summary:** Record a purchase (amount, bucket, description, receipt) that auto-deducts from the budget (not designed)

> **Plan v0.2 — post-sprint.** No design exists; needs design and decisions OQ-04/OQ-05/OQ-19 before UI or wiring.


**User story**
> As a carer, I want to record what I spent, so that the client's budget stays accurate.

**Description**
Lets carers record care-related spending, optionally linked to an event, with receipt upload.

**In scope**
- Expense form (design required).
- Call `record_expense`.
- Receipt upload via F0-13.

**Out of scope**
- Purchase verification (out of scope CM-0409)
- Blocking overspend (never, CIS5)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Government remaining $240, when Aisha records a $40 expense, then remaining becomes $200.
- [ ] **AC-02** (edge) Given remaining $240, when a $300 expense is recorded, then it saves and state is 'depleted'.

**Testing notes**
- AC-01: integration test
- AC-02: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [CAR-09] Carer — Settings

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | C — Carer |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-07, CAR-UI-04 |
| Blocked by | OQ-35 (Settings forms save behaviour) |
| Branch | `feature/carer-settings` → PR to `carer-dev` |
| Labels | `care-compass` `phase-3` `carer` |
| Docs | `docs/development/carer-dev/carer-settings/` |
| Requirements | REQ-01 |

**Summary:** My info (Name, Phone, Email, Role) and 'Reset username / password'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As a carer, I want to update my phone number and reset my password, so that my details are right and I can get back in.

**Description**
Carer Settings screen for own details and password reset.

**In scope**
- Route `/carer/settings`; 'My info' card (Name, Phone, Email, Role); Reset card reusing shared component.
- Role displayed read-only (PROPOSED — job title set by admin in ADM-02).

**Out of scope**
- Changing login email

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha's profile, when Settings renders, then Name 'Aisha Rahman', Phone '0423 987 654', Email 'aisha.r@banksiahomecare.com.au', Role 'Registered Nurse' are shown.
- [ ] **AC-02** (permission) Given Aisha, when she updates her own job_title, then RLS/column privileges reject it.
- [ ] **AC-03** (happy) Given Reset clicked, when the action runs, then a reset email is requested.

**Testing notes**
- AC-01: component test
- AC-02: db test
- AC-03: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-01] Admin Home — counts and overdue events

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-11, ADM-UI-01 |
| Blocked by | OQ-29 (Which nurse is shown on an event) |
| Branch | `feature/admin-home` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-home/` |
| Requirements | REQ-34 |

**Summary:** Stat cards (Clients, Staff) and 'Overdue events across all clients' list

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to see overdue events across all my clients, so that I can follow up with staff.

**Description**
Admin landing screen showing organisation totals and every overdue event across the organisation's clients.

**In scope**
- Route `/admin/home`; header 'Home'.
- Stat cards: 'Clients 42', 'Staff 17' (counts for admin's organisation).
- Overdue events card (alert tone), caption 'across all clients': rows Client · Event · Nurse · Overdue pill · chevron.
- Empty state 'All caught up'.
- Chevron behaviour per OQ-37 (not linked until answered).

**Out of scope**
- Admin task detail/log (PL-20)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed data, when Admin Home loads for Priya, then Clients shows the organisation's client count and Staff the active carer count.
- [ ] **AC-02** (happy) Given overdue items, when rendered, then a row shows 'Margaret', 'Wound dressing check', 'Aisha R.' and an Overdue pill.
- [ ] **AC-03** (permission) Given another organisation's overdue events, when Priya's home loads, then they are not included.
- [ ] **AC-04** (empty) Given no overdue events, when rendered, then 'All caught up' is shown.

**Testing notes**
- AC-01: integration test
- AC-02: component test
- AC-03: integration test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-02] Admin — Staff list and add/edit staff

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D8–D9 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, F0-07, ADM-UI-03 |
| Blocked by | OQ-08 (Account provisioning, sign-in method and MFA), OQ-13 (Staff names and job titles) |
| Branch | `feature/admin-staff` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-staff/` |
| Requirements | REQ-06, REQ-08 |

**Summary:** Staff list (Name · Role · Edit) with '+ Add staff' and an Add/edit panel (Name, Phone, Email, Role)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to add a nurse to my organisation, so that they can be assigned to clients.

**Description**
Admin manages the organisation's carer accounts and job titles.

**In scope**
- Route `/admin/staff`; Staff list card with '+ Add staff'; columns NAME, ROLE, EDIT.
- Add / edit staff panel: Name, Phone, Email, Role (select: Registered Nurse, Enrolled Nurse, Support Worker per design; source per OQ-13); Save.
- Create account per OQ-08 (e.g. invite email) with role 'carer' in admin's organisation.
- Edit updates profile fields.

**Out of scope**
- Deactivate/remove staff (ADM-03)
- Creating additional admins (not designed)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Priya completes Name, Phone, Email and Role 'Enrolled Nurse' and saves, then the new staff member appears in the list with role 'Enrolled Nurse'.
- [ ] **AC-02** (validation) Given Email is empty, when Save is pressed, then an Email error is shown.
- [ ] **AC-03** (happy) Given Aisha's row, when Edit is clicked, then the panel shows her Name, Phone, Email and Role.
- [ ] **AC-04** (permission) Given Priya, when she updates a profile in another organisation, then RLS rejects it.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: e2e test
- AC-04: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-03] Admin — Deactivate staff

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | ADM-02 |
| Blocked by | OQ-36 (Staff deactivation), OQ-19 (Figma access and remaining design gaps) |
| Branch | `feature/admin-staff-deactivate` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-staff-deactivate/` |
| Requirements | REQ-06, REQ-N6 |

**Summary:** Withdraw a staff member's access without deleting their recorded work (not designed)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to deactivate a staff member who has left, so that they can no longer see client information.

**Description**
Deactivates a carer account so they can no longer access organisation information while their completions remain attributed.

**In scope**
- Deactivate action and confirmation (design required).
- Sets is_active false; ends assignments; cancels future shifts (PROPOSED).

**Out of scope**
- Hard delete

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Marcus is deactivated, when he queries clients, then zero rows are returned.
- [ ] **AC-02** (happy) Given Marcus completed tasks previously, when the family task log loads, then those tasks still show 'Done · Marcus C.'.

**Testing notes**
- AC-01: db test
- AC-02: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-04] Admin — Clients list and add client

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | Medium |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, ADM-UI-04 |
| Blocked by | OQ-07 (Client record creation and family linking), OQ-08 (Account provisioning, sign-in method and MFA) |
| Branch | `feature/admin-clients` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-clients/` |
| Requirements | REQ-07 |

**Summary:** Client list (Name · Family contact · Remove) and Add client panel (Client name, Family contact name, Family contact email, Notes)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to add a new client with their family contact, so that their care can start.

**Description**
Admin views the organisation's clients and adds a client with a family contact; admin cannot edit client information (D28).

**In scope**
- Route `/admin/clients`; Client list with '+ Add client'; columns NAME, FAMILY CONTACT, REMOVE (Remove handled by ADM-05; link absent until then).
- Add client panel: Client name, Family contact name, Family contact email, Notes; 'Add client' button.
- On add: create client in admin's organisation and family contact link/invite per OQ-07/OQ-08.
- No edit of client info (D28).

**Out of scope**
- Remove client (ADM-05)
- Editing client information (forbidden D28)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Priya enters Client name 'Harold', Family contact 'Grace', email 'grace@example.com' and clicks Add client, then Harold appears in the list with family contact 'Grace'.
- [ ] **AC-02** (validation) Given Client name is empty, when Add client is pressed, then an error is shown.
- [ ] **AC-03** (happy) Given seed data, when the list renders, then rows include 'Margaret' with family contact 'Helen'.
- [ ] **AC-04** (permission) Given Priya, when she calls the client-info update action, then it is rejected (D28).

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test
- AC-04: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-05] Admin — Remove client

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | ADM-04 |
| Blocked by | OQ-06 (Organisation change model), OQ-07 (Client record creation and family linking), OQ-19 (Figma access and remaining design gaps) |
| Branch | `feature/admin-client-remove` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-client-remove/` |
| Requirements | REQ-04, REQ-N6 |

**Summary:** 'Remove' a client from the organisation without losing the client's records (semantics undecided)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to remove a client my organisation no longer serves, so that my staff lose access but the family keeps everything.

**Description**
Implements the Remove link on the Admin client list.

**In scope**
- Remove action with confirmation (design required).
- PROPOSED: set clients.organisation_id null, end assignments, cancel future shifts — never delete data.

**Out of scope**
- Deleting client data

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Priya removes Doris, when Banksia carers query Doris, then zero rows are returned.
- [ ] **AC-02** (happy) Given Doris removed, when Tom (family) queries Doris's events, then all events are returned.

**Testing notes**
- AC-01: db test
- AC-02: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-06] Admin — Manage: staff and client selection

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D9 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-06, ADM-UI-02 |
| Blocked by | — |
| Branch | `feature/admin-manage-selection` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-manage-selection/` |
| Requirements | REQ-23 |

**Summary:** Manage screen Staff and Clients columns with search, solid selection with check and 'A → B' summary with Clear

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to choose a staff member and client, so that I can assign a shift.

**Description**
The left two columns and selection summary of the Admin Manage screen.

**In scope**
- Route `/admin/manage`; Staff column (290px) 'Search staff'; Clients column (290px) 'Search clients'.
- Selectable list rows: avatar + name; selected = solid #07727D with white text and check; hover = tint.
- Assign shift panel header with summary 'Aisha Rahman → Margaret' and 'Clear' (panel body is ADM-07).
- Selection state in URL (`staff`, `client`).

**Out of scope**
- Date/time assignment (ADM-07)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha Rahman and Margaret are selected, when rendered, then both rows are solid-filled with checks and the summary reads 'Aisha Rahman → Margaret'.
- [ ] **AC-02** (happy) Given a selection, when Clear is clicked, then both selections are removed.
- [ ] **AC-03** (happy) Given search 'Sar' in Staff, when submitted, then only Sarah Nguyen is listed.
- [ ] **AC-04** (permission) Given another organisation's staff, when the Staff column loads, then they are absent.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: integration test
- AC-04: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-07] Admin — Assign shift

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-10, ADM-06 |
| Blocked by | OQ-09 (Carer access model) |
| Branch | `feature/admin-assign-shift` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-assign-shift/` |
| Requirements | REQ-23 |

**Summary:** Date picker with existing-shift dots, time slot chips (07:00–11:00, 11:00–15:00, 15:00–19:00, Custom), soft overlap warning, Assign shift

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to assign Aisha to Margaret for a morning slot, so that Margaret has a carer rostered.

**Description**
Assign panel body on Manage: creates a shift for the selected carer and client.

**In scope**
- Date: month grid (MON–SUN), prev/next, dots where the selected carer already has shifts, selected date filled.
- Time slot chips; 'Custom' reveals start/end time inputs (not drawn — PROPOSED two time inputs).
- Soft conflict inline alert: 'Aisha already has a shift with Margaret from 11:30–13:00 that overlaps this time. You can still assign it.' generated from `overlapping_shifts`.
- Cancel (clears date/slot) and 'Assign shift' (creates shift; success message PROPOSED).
- No Repeat control (D31).

**Out of scope**
- Editing/extending shifts (ADM-09)
- Recurring shifts (excluded)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha and Margaret selected, date 1 Dec 2026 and slot 07:00–11:00, when Assign shift is clicked, then a shift 07:00–11:00 on 1 Dec exists and a dot appears on 1 Dec.
- [ ] **AC-02** (happy) Given an overlapping existing shift 11:30–13:00 and selected slot 11:00–15:00, when the slot is chosen, then the warning names 11:30–13:00 and Assign shift remains available.
- [ ] **AC-03** (validation) Given Custom with end 10:00 before start 12:00, when Assign is pressed, then a time error is shown.
- [ ] **AC-04** (happy) Given the panel, when rendered, then no Repeat control exists.

**Testing notes**
- AC-01: e2e test
- AC-02: component test
- AC-03: component test
- AC-04: component test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-08] Admin — Manage carer-client assignments

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | ADM-07 |
| Blocked by | OQ-09 (Carer access model), OQ-19 (Figma access and remaining design gaps) |
| Branch | `feature/admin-carer-assignments` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-carer-assignments/` |
| Requirements | REQ-05, REQ-06 |

**Summary:** Remove or reassign carers from clients (not designed)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to remove a carer from a client, so that they no longer access that client.

**Description**
Lets admins end a carer's access to a client independently of shifts.

**In scope**
- Assignment list and remove/reassign actions (design required).

**Out of scope**
- —

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha's assignment to Elsie is ended, when Aisha queries Elsie, then zero rows are returned.

**Testing notes**
- AC-01: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-09] Admin — Edit, extend or cancel a shift

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | ADM-07 |
| Blocked by | OQ-27 (Shift edit, extend and cancel workflow), OQ-19 (Figma access and remaining design gaps) |
| Branch | `feature/admin-edit-shift` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-edit-shift/` |
| Requirements | REQ-24 |

**Summary:** Change shift times, extend a shift by extra hours, or cancel it (not designed)

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to extend Aisha's shift by two hours, so that she can keep recording care while she stays.

**Description**
Supports the client's need to extend a shift when a manager asks a carer to stay longer.

**In scope**
- Edit/extend/cancel UI (design required) using F0-10 table.

**Out of scope**
- Recurring shifts

**Acceptance criteria**
- [ ] **AC-01** (happy) Given a 07:00–11:00 shift extended to 13:00, when `carer_on_active_shift` runs at 12:00 as Aisha, then it returns true.

**Testing notes**
- AC-01: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [ADM-10] Admin — Settings

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E3 — Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D10 |
| Lane | A — Admin |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-07, ADM-UI-05 |
| Blocked by | OQ-35 (Settings forms save behaviour) |
| Branch | `feature/admin-settings` → PR to `admin-dev` |
| Labels | `care-compass` `phase-3` `admin` |
| Docs | `docs/development/admin-dev/admin-settings/` |
| Requirements | REQ-06 |

**Summary:** Organisation info (name, ABN, phone, address) and 'Reset username / password'

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-05**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.


**User story**
> As an admin, I want to keep my organisation's details correct, so that families and staff see the right information.

**Description**
Admin Settings screen for organisation details and password reset.

**In scope**
- Route `/admin/settings`; Organisation info card: Organisation name, ABN, Phone, Address; Reset card reused.

**Out of scope**
- Organisation registration/deletion (PL-18)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given seed data, when Settings renders, then 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072' are shown.
- [ ] **AC-02** (validation) Given ABN '123', when saved, then an ABN error is shown.
- [ ] **AC-03** (permission) Given Priya, when she updates another organisation, then RLS rejects it.

**Testing notes**
- AC-01: component test
- AC-02: component test
- AC-03: db test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

---

# CC-E4 · Phase 4 — Integration, hardening & release

## [INT-01] Automatic budget threshold emails

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Shared |
| Priority | Medium |
| Story points | _to estimate_ |
| Sprint | STRETCH · planned D11–D12 |
| Lane | B — Backend |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | F0-12, FAM-10 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-03 (Budget threshold percentages), OQ-17 (Hosting, email, scheduler, environments and availability), OQ-28 (Budget email recipients and budget period) |
| Branch | `feature/shared-budget-threshold-emails` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-4` `shared` |
| Docs | `docs/development/shared/shared-budget-threshold-emails/` |
| Requirements | REQ-31 |

**Summary:** Scheduled server job emails recipients once per threshold per bucket per period when spending crosses thresholds


**User story**
> As a family member, I want an email when a budget reaches a warning level, so that I can act before money runs out.

**Description**
Sends plain-language warning emails without operator input when a bucket reaches each configured threshold.

**In scope**
- `budget_threshold_notifications` (bucket_id, threshold, period_start, sent_at) unique(bucket_id, threshold, period_start).
- Job `src/server/jobs/budget-thresholds.ts` using the service-role client; invoked by scheduler (OQ-17) via protected Route Handler `/api/jobs/budget-thresholds` with secret header.
- Email template: 'The Schedule of Care Program for <CLIENT NAME> has reached <N>% of its allocation for the present period. Log in and refer to plan.' (CIS5 wording; program name configurable).
- Recipients per OQ-28; exclude users from organisations no longer serving the client and inactive profiles.
- Email provider adapter interface with a test double.

**Out of scope**
- In-app budget notifications (excluded D23)
- Appointment reminder emails (parked)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Government bucket crosses the top warning threshold, when the job runs, then one email per eligible recipient is sent with the client's name and percentage.
- [ ] **AC-02** (edge) Given the email for that threshold was already sent this period, when the job runs again, then no email is sent.
- [ ] **AC-03** (permission) Given a previous organisation's admin, when the job runs after transfer, then they receive no email.
- [ ] **AC-04** (security) Given a request to the job endpoint without the secret, when received, then it returns 401 and does nothing.
- [ ] **AC-05** (error) Given the email provider errors, when the job runs, then the threshold is not recorded as sent.

**Testing notes**
- AC-01: integration test
- AC-02: integration test
- AC-03: integration test
- AC-04: integration test
- AC-05: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-02] End-to-end: organisation transfer journey

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Family |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D12 |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | FAM-13, ADM-04, CAR-03 |
| Blocked by | OQ-06 (Organisation change model), OQ-15 (Incoming organisation's visibility of history) |
| Branch | `feature/family-organisation-transfer-e2e` → PR to `family-dev` |
| Labels | `care-compass` `phase-4` `family` |
| Docs | `docs/development/family-dev/family-organisation-transfer-e2e/` |
| Requirements | REQ-04, REQ-N6 |

**Summary:** E2E + regression tests for Sequence Use Case 1 across Family, Admin and Carer


**User story**
> As a family member, I want confidence that changing provider is safe, so that I can do it without fear of data loss.

**Description**
Verifies the full transfer: family changes organisation, old admin and carers lose access, new admin sees the client, history retained.

**In scope**
- Playwright multi-user test using seed data.
- Fix-forward only for defects inside scope; other defects logged as new features.

**Out of scope**
- New functionality

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Helen transfers Margaret to a second organisation, when Priya reloads Clients, then Margaret is absent, and when Aisha reloads Patients, Margaret is absent.
- [ ] **AC-02** (happy) Given the transfer, when Helen opens the Task log, then all previous completions still show.
- [ ] **AC-03** (happy) Given the second organisation's admin, when they open Clients, then Margaret is listed.

**Testing notes**
- AC-01: e2e test
- AC-02: e2e test
- AC-03: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-03] End-to-end: carer care delivery journey

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Carer |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D12 |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | CAR-06, FAM-01 |
| Blocked by | OQ-33 (Carer calendar and task semantics) |
| Branch | `feature/carer-care-delivery-e2e` → PR to `carer-dev` |
| Labels | `care-compass` `phase-4` `carer` |
| Docs | `docs/development/carer-dev/carer-care-delivery-e2e/` |
| Requirements | REQ-18, REQ-19 |

**Summary:** E2E for Sequence Use Case 2 and completion visibility to family


**User story**
> As a carer, I want my completed care to appear for the family, so that everyone shares one record.

**Description**
Carer signs in, opens a rostered patient, completes and (when CAR-07/08 exist) adds a task with cost and documentation; family sees results.

**In scope**
- Playwright journey; include CAR-07/CAR-08 steps only if those features are merged.

**Out of scope**
- New functionality

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Aisha on shift completes Afternoon check-in, when Helen loads Home, then the block shows 'Done · Aisha R.'.
- [ ] **AC-02** (permission) Given Aisha's shift has ended, when she tries to tick a task, then it cannot be completed.

**Testing notes**
- AC-01: e2e test
- AC-02: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-04] End-to-end: admin rostering journey

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Admin |
| Priority | High |
| Story points | _to estimate_ |
| Sprint | SPRINT · planned D12 |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | ADM-07, CAR-02, CAR-05, FAM-01 |
| Blocked by | OQ-09 (Carer access model), OQ-33 (Carer calendar and task semantics) |
| Branch | `feature/admin-assign-shift-e2e` → PR to `admin-dev` |
| Labels | `care-compass` `phase-4` `admin` |
| Docs | `docs/development/admin-dev/admin-assign-shift-e2e/` |
| Requirements | REQ-23, REQ-25, REQ-26, REQ-32 |

**Summary:** E2E for Sequence Use Case 3: admin assigns shift → carer notified and sees shift → family sees carer on day


**User story**
> As an admin, I want a new shift to reach the carer and family, so that everyone knows who is caring when.

**Description**
Verifies rostering across Admin, Carer and Family dashboards.

**In scope**
- Playwright journey across three contexts.

**Out of scope**
- New functionality

**Acceptance criteria**
- [ ] **AC-01** (happy) Given Priya assigns Aisha to Margaret on Tue 1 Dec 09:00–11:00, when Aisha opens Home, then a notification 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' is listed.
- [ ] **AC-02** (happy) Given that shift, when Aisha opens Calendar week of 30 Nov, then a Tuesday block for Margaret is shown.

**Testing notes**
- AC-01: e2e test
- AC-02: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-05] Access-control regression matrix

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Shared |
| Priority | Medium |
| Story points | _to estimate_ |
| Sprint | STRETCH · planned D12–D13 |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | FAM-15, CAR-06, ADM-07 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-access-control-regression` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-4` `shared` |
| Docs | `docs/development/shared/shared-access-control-regression/` |
| Requirements | REQ-03, REQ-N4, REQ-N5 |

**Summary:** Consolidated role × table × action permission matrix tests and UI 'controls absent' checks


**User story**
> As the client (Peter), I want assurance data is only visible to authorised people, so that the person with special needs is protected.

**Description**
A single, maintained suite proving every role can do exactly what it should across all tables and routes.

**In scope**
- docs/security/PERMISSION_MATRIX.md generated from tests.
- pgTAP matrix covering all client-scoped tables.
- Route access tests for every dashboard route per role.
- OWASP checks: input validation, no service-role in client bundle, signed URLs expiry.

**Out of scope**
- Penetration testing by third party

**Acceptance criteria**
- [ ] **AC-01** (security) Given all tables in schema public, when the catalog is queried, then every table has row level security enabled.
- [ ] **AC-02** (permission) Given each role, when every dashboard route of other roles is requested, then all are redirected.

**Testing notes**
- AC-01: db test
- AC-02: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-06] Accessibility verification across dashboards

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Shared |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | FAM-15, CAR-09, ADM-10 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-accessibility-verification` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-4` `shared` |
| Docs | `docs/development/shared/shared-accessibility-verification/` |
| Requirements | REQ-N1, REQ-N2 |

**Summary:** Automated axe checks on every screen, keyboard journey checks, 44px targets and contrast audit; defects raised as features


**User story**
> As a 75-year-old family member, I want an app I can read and operate, so that I can check on my relative independently.

**Description**
Verifies WCAG 2.1 AA across Family, Carer and Admin screens.

**In scope**
- @axe-core/playwright on each route.
- Keyboard-only traversal of primary journeys.
- docs/ACCESSIBILITY_REPORT.md; each defect becomes a dashboard bug feature.

**Out of scope**
- Fixing defects inside this feature (raised separately)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given every dashboard route with seed data, when axe runs, then no serious or critical violations are reported.
- [ ] **AC-02** (happy) Given keyboard only, when Helen marks a task done from the calendar, then every step is reachable with visible focus.

**Testing notes**
- AC-01: e2e test
- AC-02: e2e test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-07] Scale and performance verification

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Shared |
| Priority | Low |
| Story points | _to estimate_ |
| Sprint | POST-SPRINT · planned — |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | FAM-14, ADM-01 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work) |
| Branch | `feature/shared-calendar-scale-performance` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-4` `shared` |
| Docs | `docs/development/shared/shared-calendar-scale-performance/` |
| Requirements | REQ-N8 |

**Summary:** Load large datasets (hundreds of items per client, 42+ clients) and verify calendar, home and task-log response budgets and indexes


**User story**
> As a family member, I want fast pages even after decades of records, so that the app stays usable for life.

**Description**
Checks the app remains responsive with unlimited care items over long periods.

**In scope**
- Scale seed script (e.g. 500 recurring events per client, 50 clients).
- Measure server render times locally; PROPOSED budget p95 < 1 s for Home, Calendar week, Task log first page.
- EXPLAIN ANALYZE key queries; add indexes via migration.

**Out of scope**
- Production load testing (needs hosting, OQ-17)

**Acceptance criteria**
- [ ] **AC-01** (happy) Given the scale seed, when the Calendar week query runs 20 times, then p95 duration is under the agreed budget.

**Testing notes**
- AC-01: integration test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).

## [INT-08] Release readiness and client handover

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | CC-E4 — Phase 4 — Integration, hardening & release |
| Component | Shared |
| Priority | Medium |
| Story points | _to estimate_ |
| Sprint | STRETCH · planned D13 |
| Lane | I — Integration |
| Assignee | _unassigned_ |
| Status | To Do (NOT STARTED) |
| Depends on | INT-02, INT-03, INT-04 |
| Blocked by | OQ-01 (Branch parent and naming for shared (foundation and cross-cutting) work), OQ-17 (Hosting, email, scheduler, environments and availability) |
| Branch | `feature/shared-release-readiness-handover` → PR to `main (per OQ-01)` |
| Labels | `care-compass` `phase-4` `shared` |
| Docs | `docs/development/shared/shared-release-readiness-handover/` |
| Requirements | REQ-N9, REQ-N11 |

**Summary:** Deployment runbook, environment and backup plan, plain-English user guide, glossary and handover pack


**User story**
> As the client, I want clear instructions in plain English, so that I can run and hand on the system without IT help.

**Description**
Prepares the application and documentation for release to main and handover to a non-technical client.

**In scope**
- docs/handover/USER_GUIDE.md per role with screenshots.
- docs/handover/GLOSSARY.md.
- docs/handover/DEPLOYMENT_RUNBOOK.md incl. environments, secrets, backups, restore test.
- docs/handover/COSTS.md (running costs; CIS3 asked about fees).
- Release checklist for dev → main promotion.

**Out of scope**
- Operating the production system

**Acceptance criteria**
- [ ] **AC-01** (happy) Given the handover pack, when reviewed by a non-technical reader, then every technical term used appears in the glossary.
- [ ] **AC-02** (happy) Given the runbook, when a team member follows it on a clean environment, then the app deploys and a backup restore succeeds.

**Testing notes**
- AC-01: review test
- AC-02: review test

**Definition of Done:** tests written first and passing · all ACs met · permission tests for every role touched · `npm run verify` green · docs (PROGRESS, SESSION_STATE, DECISIONS) updated · PR opened to the correct dev branch (CLAUDE.md §8).
