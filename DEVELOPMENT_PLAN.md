# DEVELOPMENT PLAN — Care Compass

Version 0.2 · 17 September 2026 · Status: DRAFT (controlled after planning freeze) · Supersedes v0.1 dashboard-by-dashboard phases
Totals: **82 active features** (83 listed; CAR-08 retired) · **364 acceptance criteria** across 5 phases (UI-04 and its 10 criteria added by CHG-004, 2026-09-19; UI-05 and its 13 criteria added under CHG-009, 2026-09-24; F0-17 and its 8 criteria added by CHG-010, 2026-09-24; CHG-020, 2026-09-25: FAM-UI-08 (6 criteria) and ADM-11 (5) added, FAM-UI-05 +5 criteria, CAR-08 and its 2 criteria retired; CHG-021, 2026-09-25: FAM-UI-05 +4 criteria; CHG-022, 2026-09-25: FAM-UI-05 +5 criteria; the Jira import `docs/JIRA_BACKLOG.csv` predates all five). Jira import: `docs/JIRA_BACKLOG.csv`.

---

## 1. Strategy (plan v0.2 — UI-first, parallel lanes)

1. **Validate quickly (F0-01, Day 1).** Reconcile the pack with the repository, Figma and sources.
2. **Build a shared UI kit and data contract first (Days 1–4).** Tokens, primitives, icons, TypeScript domain types, contract functions with a mock data source, design fixtures, app shell, and calendar/forms/lists kits. The whole team then builds on the same components and data shapes.
3. **Build every screen on fixtures, three dashboards in parallel (Days 4–7).** Screens need no database and are not blocked by open decisions. By the end of Day 7 the prototype is clickable end to end.
4. **Build the backend in parallel (Days 2–7).** Supabase, schema, row-level security, auth, recurrence, events, shifts, budget, documents and seed data run in their own lane instead of waiting for the UI.
5. **Wire data, three dashboards in parallel (Days 8–11).** Each wiring feature switches its screen from the mock data source to Supabase through the same contract functions, and adds actions, permissions and persistence.
6. **Integrate and harden (Days 11–13).** Cross-role journeys, fixes, release candidate; stretch: budget emails, access matrix, handover pack.
7. **Continuous integration of shared work.** Shared PRs merge to `main` continuously; `main` syncs into dashboard dev branches daily; dashboard dev branches merge to `main` at checkpoints D7, D10 and D12 (see `docs/DEVELOPMENT_WORKFLOW.md` §3 and §9).
8. **Open decisions stay open until the human closes them.** Features listing a blocking decision stay blocked; the lane moves to other ready work.

Day-by-day lanes, staffing and decision timing: **`docs/SPRINT_PLAN.md`**.

### 1.1 Why not one phase per dashboard
The v0.1 plan built Family, then Carer, then Admin, and released each phase to `main` before the next could reuse its components. With a shared kit and contracts built first, the dashboards share nothing except the kit and the backend, so they can run at the same time.

### 1.2 Lanes
| Lane | Scope | Branch target |
|---|---|---|
| S — Shared kit | Phase 0 | `main` (per OQ-01) |
| B — Backend | Phase 2, INT-01 | `main` (per OQ-01) |
| F — Family | FAM-UI-*, FAM-* | `family-dev` |
| C — Carer | CAR-UI-*, CAR-* | `carer-dev` |
| A — Admin | ADM-UI-*, ADM-* | `admin-dev` |
| I — Integration | INT-02…08 | dashboard dev branch of the journey owner, or `main` for shared |

### 1.3 Sprint buckets
- **SPRINT** — planned inside the two weeks.
- **STRETCH** — only if the sprint is on track (INT-01, INT-05, INT-08).
- **POST-SPRINT** — needs design or decisions first (FAM-11, CAR-07, CAR-08, ADM-03, ADM-05, ADM-08, ADM-09, INT-06, INT-07).

---

## 2. Phases

### Phase 0 — Foundation & shared UI kit (Lane S, D1–D4)
- **Objective:** Tooling, CI, tokens, primitives, data contracts + fixtures, app shell and component kits that every screen composes.
- **Dependencies:** OQ-01, OQ-20 answered; validation report approved.
- **Definition of done:** kit merged to `main` and synced into all dev branches; the `/family`, `/carer` and `/admin` shells render with the mock user; component tests + axe green.
- **Output:** `src/components/{ui,shared}`, `src/types`, `src/mocks`, `src/server` contracts (mock source), role layouts.

### Phase 1 — Screens on fixtures (Lanes F, C, A in parallel, D4–D7)
- **Objective:** All 17 designed screens built exactly as designed, backed by fixtures.
- **Dependencies:** Phase 0 kit features they compose.
- **Definition of done:** every `*-UI-*` feature merged to its dev branch; checkpoint merge to `main` on D7; side-by-side screenshots match designs.
- **Output:** clickable prototype for all three roles.

### Phase 2 — Backend & data layer (Lane B, D2–D7, parallel)
- **Objective:** Supabase schema with RLS, auth, recurrence engine, events/completions, shifts, budget, documents, audit, seed data matching fixtures.
- **Dependencies:** OQ-01 and the blocking decisions listed per feature.
- **Definition of done:** merged to `main`; pgTAP and unit suites green; seed produces the same figures as the fixtures.
- **Output:** a Supabase data source that implements the contracts.

### Phase 3 — Data wiring & behaviour (Lanes F, C, A in parallel, D8–D11)
- **Objective:** Replace fixtures with real data; add actions, permissions and persistence.
- **Dependencies:** the feature's screen (Phase 1) and backend features (Phase 2).
- **Definition of done:** in-sprint wiring features merged to dev branches; checkpoint merges on D10 and D12.
- **Output:** working application on local Supabase.

### Phase 4 — Integration, hardening & release (Lane I, D11–D13)
- **Objective:** Cross-role journeys (Sequence Use Cases 1–3), fixes, release candidate; stretch work if time.
- **Definition of done:** INT-02/03/04 green; release candidate merged to `main` with human approval.

---

## 3. Feature status model

| Status | Meaning | Set by |
|---|---|---|
| NOT STARTED | Identified and documented; not yet validated or unblocked | Planning |
| PLANNED | Docs validated (post F0-01); dependencies known; no blocking decision open | F0-01 / Claude Code |
| IN PROGRESS | Feature branch exists; tests or implementation underway | START FEATURE |
| BLOCKED | Cannot proceed; must state reason `DECISION OQ-xx`, `DEPENDENCY <ID>`, `DESIGN`, or `TECHNICAL` and the previous status | Claude Code |
| IMPLEMENTED | All in-scope ACs have passing tests on the feature branch | Claude Code |
| READY FOR PR | Feature-level Definition of Done met (CLAUDE.md §8) | Claude Code |
| PR OPEN | PR to the dev branch open | Claude Code |
| MERGED TO DEV | Human merged the PR | Human / Claude Code updates docs |
| IN DEVELOPMENT TESTING | Dashboard regression/e2e running on dev branch | Claude Code |
| READY FOR PRODUCTION | Dev-branch testing passed; awaiting release | Human |
| COMPLETE | Released to `main` | Human / Claude Code updates docs |

### 3.1 Progress calculations
- **Phase completion %** = COMPLETE features in phase ÷ total features in phase × 100.
- **Phase dev-integration %** = features at MERGED TO DEV or later ÷ total × 100.
- **Dashboard completion %** = same, per stream.
- **AC coverage %** (feature) = MET ACs ÷ total ACs.
- Blocked features count in the denominator; report the blocked count alongside every percentage.

---

## 4. Backlog (ordered)
Branch names follow `feature/<slug>`; shared branches depend on OQ-01. Statuses are initial; live status comes from each feature `PROGRESS.md` via `node scripts/plan-status.mjs`.

### Phase 0 — Foundation & shared UI kit

| Order | ID | Feature | Lane | Days | Sprint | Depends on | Blocking decisions | Branch | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | F0-01 | Validate planning pack against repository, Figma and sources | S | D1 | SPRINT | — | OQ-01, OQ-20 | `feature/shared-plan-validation` | NOT STARTED |
| 2 | F0-02 | Tooling baseline: TypeScript, lint, format, test runners | S | D1 | SPRINT | F0-01 | OQ-01 | `feature/shared-tooling-baseline` | NOT STARTED |
| 3 | F0-05 | Design tokens, typography and base styles | S | D1 | SPRINT | F0-02 | OQ-01 | `feature/shared-design-tokens` | NOT STARTED |
| 4 | F0-03 | Continuous integration pipeline | S | D2 | SPRINT | F0-02 | OQ-01 | `feature/shared-ci-pipeline` | NOT STARTED |
| 5 | F0-14 | Core UI primitives and state components | S | D2 | SPRINT | F0-05 | OQ-01 | `feature/shared-ui-primitives` | NOT STARTED |
| 6 | UI-00 | Domain types, data-access contracts and design fixtures | S | D2 | SPRINT | F0-02 | OQ-01 | `feature/shared-domain-contracts-fixtures` | NOT STARTED |
| 7 | F0-15 | Role app shell: rail, header and layouts | S | D3 | SPRINT | F0-14, UI-00 | OQ-01 | `feature/shared-app-shell` | NOT STARTED |
| 8 | UI-01 | Calendar kit: week/day/month grids, event blocks, date picker | S | D3 | SPRINT | F0-14, UI-00 | OQ-01 | `feature/shared-calendar-kit` | NOT STARTED |
| 9 | UI-02 | Forms kit: fields, settings cards, side panels, chips, modal, event form | S | D3–D4 | SPRINT | F0-14, UI-00, UI-01 | OQ-01 | `feature/shared-forms-kit` | NOT STARTED |
| 10 | UI-03 | Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view | S | D3 | SPRINT | F0-14, UI-00 | OQ-01 | `feature/shared-lists-cards-kit` | NOT STARTED |
| 11 | UI-04 | Screen data contracts and fixtures: full-history Task log, single occurrence, event documents | S | D6 | SPRINT | UI-00 | OQ-01 | `feature/shared-screen-contracts-fixtures` | NOT STARTED |
| 12 | UI-05 | Plain events in the shared kit and contracts (CHG-009) | S | D8 | SPRINT | UI-00, UI-01, UI-02, UI-03, UI-04 | — | `feature/shared-plain-events` | NOT STARTED |

### Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin)

| Order | ID | Feature | Lane | Days | Sprint | Depends on | Blocking decisions | Branch | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | FAM-UI-01 | Family Home screen (UI) | F | D4 | SPRINT | F0-15, UI-01, UI-03 | — | `feature/family-ui-home` | NOT STARTED |
| 2 | FAM-UI-02 | Family Calendar screen (UI) | F | D4–D5 | SPRINT | F0-15, UI-01, UI-03 | — | `feature/family-ui-calendar` | NOT STARTED |
| 3 | FAM-UI-03 | Family Add / Edit event screens (UI) | F | D5 | SPRINT | F0-15, UI-02, UI-01, UI-03 | — | `feature/family-ui-event-form` | NOT STARTED |
| 4 | FAM-UI-04 | Family Info screen (UI) | F | D5 | SPRINT | F0-15, UI-03 | — | `feature/family-ui-info` | NOT STARTED |
| 5 | FAM-UI-05 | Family Budget screen (UI) | F | D6 | SPRINT | F0-15, UI-03 | — | `feature/family-ui-budget` | NOT STARTED |
| 6 | FAM-UI-06 | Family Settings screen (UI) | F | D6 | SPRINT | F0-15, UI-02 | — | `feature/family-ui-settings` | NOT STARTED |
| 7 | FAM-UI-07 | Family Task log and Task detail screens (UI) | F | D6–D7 | SPRINT | F0-15, UI-03, UI-02 | — | `feature/family-ui-task-log-detail` | NOT STARTED |
| 8 | CAR-UI-01 | Carer Home screen (UI) | C | D4 | SPRINT | F0-15, UI-03 | — | `feature/carer-ui-home` | NOT STARTED |
| 9 | CAR-UI-02 | Carer Patients and patient info screens (UI) | C | D4–D5 | SPRINT | F0-15, UI-03 | — | `feature/carer-ui-patients-info` | NOT STARTED |
| 10 | CAR-UI-03 | Carer Calendar screen (UI) | C | D5–D6 | SPRINT | F0-15, UI-01, UI-03 | — | `feature/carer-ui-calendar` | NOT STARTED |
| 11 | CAR-UI-04 | Carer Settings screen (UI) | C | D6 | SPRINT | F0-15, UI-02 | — | `feature/carer-ui-settings` | NOT STARTED |
| 12 | ADM-UI-01 | Admin Home screen (UI) | A | D4 | SPRINT | F0-15, UI-03 | — | `feature/admin-ui-home` | NOT STARTED |
| 13 | ADM-UI-02 | Admin Manage screen (UI) | A | D4–D5 | SPRINT | F0-15, UI-01, UI-02, UI-03 | — | `feature/admin-ui-manage` | NOT STARTED |
| 14 | ADM-UI-03 | Admin Staff screen (UI) | A | D5–D6 | SPRINT | F0-15, UI-02, UI-03 | — | `feature/admin-ui-staff` | NOT STARTED |
| 15 | ADM-UI-04 | Admin Clients screen (UI) | A | D6 | SPRINT | F0-15, UI-02, UI-03 | — | `feature/admin-ui-clients` | NOT STARTED |
| 16 | ADM-UI-05 | Admin Settings screen (UI) | A | D6 | SPRINT | F0-15, UI-02 | — | `feature/admin-ui-settings` | NOT STARTED |
| 17 | FAM-UI-08 | Family event cost fields (UI) (CHG-020) | F | — | SPRINT | FAM-UI-03, FAM-UI-05 | — | `feature/family-ui-event-cost` | NOT STARTED |

### Phase 2 — Backend & data layer (parallel with Phase 1)

| Order | ID | Feature | Lane | Days | Sprint | Depends on | Blocking decisions | Branch | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | F0-04 | Environment configuration and Supabase integration | B | D2 | SPRINT | F0-02 | OQ-01 | `feature/shared-supabase-environment` | NOT STARTED |
| 2 | F0-09 | Recurrence engine (pure TypeScript) | B | D2–D3 | SPRINT | F0-02 | OQ-01, OQ-12 | `feature/shared-recurrence-engine` | NOT STARTED |
| 3 | F0-06 | Identity, organisation and client access schema with RLS | B | D3–D4 | SPRINT | F0-04 | OQ-01, OQ-07, OQ-09, OQ-16 | `feature/shared-tenancy-schema-rls` | NOT STARTED |
| 4 | F0-08 | Append-only audit log capture | B | D4 | SPRINT | F0-06 | OQ-01 | `feature/shared-audit-log-capture` | NOT STARTED |
| 5 | F0-10 | Shifts schema, active-shift function and conflict query | B | D4–D5 | SPRINT | F0-06 | OQ-01, OQ-09 | `feature/shared-shifts-schema` | NOT STARTED |
| 6 | F0-07 | Sign-in, sign-out, password reset and role-based routing | B | D5 | SPRINT | F0-06, F0-15, UI-02 | OQ-01, OQ-08 | `feature/shared-authentication` | NOT STARTED |
| 7 | F0-11 | Care events, occurrence overrides and append-only completions | B | D5–D6 | SPRINT | F0-06, F0-09, F0-10, F0-08 | OQ-01, OQ-10, OQ-22, OQ-29, OQ-09, OQ-33 | `feature/shared-care-events-schema` | NOT STARTED |
| 8 | F0-12 | Budget buckets, fund top-ups, spending and summary calculation | B | D6 | SPRINT | F0-06, F0-08 | OQ-01, OQ-03, OQ-04, OQ-05 | `feature/shared-budget-schema` | NOT STARTED |
| 9 | F0-13 | Client document storage | B | D6–D7 | SPRINT | F0-06, F0-11 | OQ-01, OQ-26 | `feature/shared-document-storage` | NOT STARTED |
| 10 | F0-16 | Development seed data from the design content | B | D7 | SPRINT | F0-11, F0-12, F0-13, F0-10 | OQ-01 | `feature/shared-dev-seed-data` | NOT STARTED |
| 11 | F0-17 | Self-serve sign-up for Family and Organisation accounts | B | D8 | SPRINT | F0-06, F0-07 | OQ-01, OQ-07, OQ-08 | `feature/shared-sign-up` | NOT STARTED |

### Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin)

| Order | ID | Feature | Lane | Days | Sprint | Depends on | Blocking decisions | Branch | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | FAM-01 | Family Home — Today day-view timeline | F | D8 | SPRINT | F0-11, F0-16, FAM-UI-01 | OQ-29 | `feature/family-home-today` | NOT STARTED |
| 2 | FAM-02 | Family Home — Overdue card and Recent activity | F | D8 | SPRINT | F0-11, FAM-UI-01 | — | `feature/family-home-overdue-activity` | NOT STARTED |
| 3 | FAM-03 | Family Home — Budget strip | F | D8 | SPRINT | F0-12, FAM-UI-01 | OQ-03, OQ-04 | `feature/family-home-budget-strip` | NOT STARTED |
| 4 | FAM-04 | Family Calendar — day, week and month views | F | D8–D9 | SPRINT | F0-11, FAM-UI-02 | — | `feature/family-calendar-views` | NOT STARTED |
| 5 | FAM-05 | Family Calendar — Tasks panel and Log panel | F | D9 | SPRINT | F0-11, FAM-UI-02 | OQ-10 | `feature/family-calendar-tasks-log` | NOT STARTED |
| 6 | FAM-06 | Family — Add event (Enter event) | F | D9 | SPRINT | F0-09, F0-11, FAM-UI-03 | OQ-22, OQ-12, OQ-10 | `feature/family-add-event` | NOT STARTED |
| 7 | FAM-07 | Family — Edit event | F | D10 | SPRINT | FAM-06 | OQ-10, OQ-11, OQ-22 | `feature/family-edit-event` | NOT STARTED |
| 8 | FAM-08 | Family — Event documents (file tiles) | F | D10 | SPRINT | F0-13, FAM-UI-03 | OQ-26 | `feature/family-event-documents` | NOT STARTED |
| 9 | FAM-09 | Family — Client info | F | D9 | SPRINT | F0-06, F0-13, FAM-UI-04 | OQ-26 | `feature/family-client-info` | NOT STARTED |
| 10 | FAM-10 | Family — Budget overview and history | F | D10 | SPRINT | F0-12, FAM-UI-05 | OQ-04, OQ-05 | `feature/family-budget-overview` | NOT STARTED |
| 11 | FAM-11 | Family — Update funds | F | — | POST-SPRINT | FAM-10 | OQ-05, OQ-04, OQ-19 | `feature/family-budget-update-funds` | NOT STARTED |
| 12 | FAM-12 | Family — Settings: family info and password reset | F | D10 | SPRINT | F0-07, FAM-UI-06 | OQ-35 | `feature/family-settings-profile` | NOT STARTED |
| 13 | FAM-13 | Family — Change organisation | F | D11 | SPRINT | F0-06, F0-10, FAM-UI-06 | OQ-06, OQ-15 | `feature/family-change-organisation` | NOT STARTED |
| 14 | FAM-14 | Family — Task log | F | D11 | SPRINT | F0-11, FAM-UI-07 | OQ-29 | `feature/family-task-log` | NOT STARTED |
| 15 | FAM-15 | Family — Task detail | F | D11 | SPRINT | F0-11, F0-13, FAM-UI-07 | OQ-29, OQ-10 | `feature/family-task-detail` | NOT STARTED |
| 16 | CAR-01 | Carer Home — Today's calendar and Tasks | C | D8 | SPRINT | F0-10, F0-11, CAR-UI-01 | OQ-33, OQ-09 | `feature/carer-home-today` | NOT STARTED |
| 17 | CAR-02 | Carer — Notifications card and bell | C | D9 | SPRINT | F0-10, F0-13, CAR-UI-01 | OQ-14 | `feature/carer-notifications` | NOT STARTED |
| 18 | CAR-03 | Carer — Patients | C | D8 | SPRINT | F0-06, F0-10, CAR-UI-02 | OQ-09 | `feature/carer-patients` | NOT STARTED |
| 19 | CAR-04 | Carer — Client info | C | D9 | SPRINT | F0-06, F0-10, F0-13, CAR-UI-02 | OQ-09 | `feature/carer-client-info` | NOT STARTED |
| 20 | CAR-05 | Carer — Calendar (shifts) and selected-shift tasks | C | D9–D10 | SPRINT | F0-10, F0-11, CAR-UI-03 | OQ-33 | `feature/carer-calendar-shifts` | NOT STARTED |
| 21 | CAR-06 | Carer — Mark tasks done | C | D10 | SPRINT | F0-10, F0-11, CAR-UI-01, CAR-UI-03 | OQ-09, OQ-10, OQ-33 | `feature/carer-complete-task` | NOT STARTED |
| 22 | CAR-07 | Carer — Add and edit events for a patient | C | — | POST-SPRINT | CAR-04, F0-11, UI-02 | OQ-09, OQ-22, OQ-19 | `feature/carer-manage-events` | NOT STARTED |
| 23 | CAR-08 | ~~Carer — Record an expense~~ (retired, CHG-020) | C | — | POST-SPRINT | F0-12, F0-13 | OQ-19, OQ-04, OQ-05 | `feature/carer-record-expense` | RETIRED (CHG-020) |
| 24 | CAR-09 | Carer — Settings | C | D10 | SPRINT | F0-07, CAR-UI-04 | OQ-35 | `feature/carer-settings` | NOT STARTED |
| 25 | ADM-01 | Admin Home — counts and overdue events | A | D8 | SPRINT | F0-11, ADM-UI-01 | OQ-29 | `feature/admin-home` | NOT STARTED |
| 26 | ADM-02 | Admin — Staff list and add/edit staff | A | D8–D9 | SPRINT | F0-06, F0-07, ADM-UI-03 | OQ-08, OQ-13 | `feature/admin-staff` | NOT STARTED |
| 27 | ADM-03 | Admin — Deactivate staff | A | — | POST-SPRINT | ADM-02 | OQ-36, OQ-19 | `feature/admin-staff-deactivate` | NOT STARTED |
| 28 | ADM-04 | Admin — Clients list and add client | A | D9 | SPRINT | F0-06, ADM-UI-04 | OQ-07, OQ-08 | `feature/admin-clients` | NOT STARTED |
| 29 | ADM-05 | Admin — Remove client | A | — | POST-SPRINT | ADM-04 | OQ-06, OQ-07, OQ-19 | `feature/admin-client-remove` | NOT STARTED |
| 30 | ADM-06 | Admin — Manage: staff and client selection | A | D9 | SPRINT | F0-06, ADM-UI-02 | — | `feature/admin-manage-selection` | NOT STARTED |
| 31 | ADM-07 | Admin — Assign shift | A | D10 | SPRINT | F0-10, ADM-06 | OQ-09 | `feature/admin-assign-shift` | NOT STARTED |
| 32 | ADM-08 | Admin — Manage carer-client assignments | A | — | POST-SPRINT | ADM-07 | OQ-09, OQ-19 | `feature/admin-carer-assignments` | NOT STARTED |
| 33 | ADM-09 | Admin — Edit, extend or cancel a shift | A | — | POST-SPRINT | ADM-07 | OQ-27, OQ-19 | `feature/admin-edit-shift` | NOT STARTED |
| 34 | ADM-10 | Admin — Settings | A | D10 | SPRINT | F0-07, ADM-UI-05 | OQ-35 | `feature/admin-settings` | NOT STARTED |
| 35 | ADM-11 | Admin — Client view: a client's Family screens with full access (CHG-020) | A | — | POST-SPRINT | ADM-04, FAM-01, FAM-04, FAM-06, FAM-07, FAM-09, FAM-10, FAM-11, FAM-14, FAM-15 | — | `feature/admin-client-view` | NOT STARTED |

### Phase 4 — Integration, hardening & release

| Order | ID | Feature | Lane | Days | Sprint | Depends on | Blocking decisions | Branch | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | INT-01 | Automatic budget threshold emails | B | D11–D12 | STRETCH | F0-12, FAM-10 | OQ-01, OQ-03, OQ-17, OQ-28 | `feature/shared-budget-threshold-emails` | NOT STARTED |
| 2 | INT-02 | End-to-end: organisation transfer journey | I | D12 | SPRINT | FAM-13, ADM-04, CAR-03 | OQ-06, OQ-15 | `feature/family-organisation-transfer-e2e` | NOT STARTED |
| 3 | INT-03 | End-to-end: carer care delivery journey | I | D12 | SPRINT | CAR-06, FAM-01 | OQ-33 | `feature/carer-care-delivery-e2e` | NOT STARTED |
| 4 | INT-04 | End-to-end: admin rostering journey | I | D12 | SPRINT | ADM-07, CAR-02, CAR-05, FAM-01 | OQ-09, OQ-33 | `feature/admin-assign-shift-e2e` | NOT STARTED |
| 5 | INT-05 | Access-control regression matrix | I | D12–D13 | STRETCH | FAM-15, CAR-06, ADM-07 | OQ-01 | `feature/shared-access-control-regression` | NOT STARTED |
| 6 | INT-06 | Accessibility verification across dashboards | I | — | POST-SPRINT | FAM-15, CAR-09, ADM-10 | OQ-01 | `feature/shared-accessibility-verification` | NOT STARTED |
| 7 | INT-07 | Scale and performance verification | I | — | POST-SPRINT | FAM-14, ADM-01 | OQ-01 | `feature/shared-calendar-scale-performance` | NOT STARTED |
| 8 | INT-08 | Release readiness and client handover | I | D13 | STRETCH | INT-02, INT-03, INT-04 | OQ-01, OQ-17 | `feature/shared-release-readiness-handover` | NOT STARTED |


---

## 5. Feature detail cards

## Phase 0 — Foundation & shared UI kit — feature detail

### F0-01 — Validate planning pack against repository, Figma and sources
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D1 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-plan-validation`
- **Description:** Docs-only feature. Claude Code inspects the actual repository, the Figma file and any newly supplied sources, reconciles them with this planning pack, records answers to open decisions and moves features from NOT STARTED to PLANNED or BLOCKED.
- **User value:** Stops the team building on an unverified plan; converts assumptions into confirmed facts or explicit questions.
- **Dependencies:** None · **Blocking decisions:** OQ-01, OQ-20
- **Jira summary:** Validate the planning documents against the real repo, Figma and source documents before any code is written
- **Acceptance criteria summary:** 4 criteria — docs/VALIDATION_REPORT.md exists and lists the result of every scope check; the discrepancy cites the file path or command output that proves it; every feature listing that decision as BLOCKING is marked BLOCKED …
- **Testing summary:** 4 review
- **Requirements:** REQ-N9
- **Docs:** `docs/development/shared/shared-plan-validation/` · **Status:** NOT STARTED

### F0-02 — Tooling baseline: TypeScript, lint, format, test runners
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D1 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-tooling-baseline`
- **Description:** Configures the engineering toolchain every later feature relies on, and creates the dashboard development branches from the validated baseline.
- **User value:** Tests-first development is impossible without working test runners; consistent tooling keeps multi-session AI work uniform.
- **Dependencies:** F0-01 · **Blocking decisions:** OQ-01
- **Jira summary:** Establish strict TypeScript, ESLint, Prettier, Vitest, Testing Library and Playwright with one `verify` script
- **Acceptance criteria summary:** 4 criteria — lint, typecheck, format check and unit tests all run and the command exits 0; it exits non-zero and names the file; the Playwright smoke test loads `/` and passes …
- **Testing summary:** 2 ci, 1 e2e, 1 review
- **Requirements:** REQ-N9
- **Docs:** `docs/development/shared/shared-tooling-baseline/` · **Status:** NOT STARTED

### F0-05 — Design tokens, typography and base styles
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D1 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-design-tokens`
- **Description:** Implements the Care Compass visual foundation exactly as defined in Figma '01 · Foundations' and the UI Spec §5, including contrast rules.
- **User value:** Every screen shares one accessible visual system; contrast rules are enforced by tests rather than memory.
- **Dependencies:** F0-02 · **Blocking decisions:** OQ-01
- **Jira summary:** Map Figma colour, type, spacing and radius tokens into Tailwind; IBM Plex Sans; focus ring; shadcn/ui initialisation
- **Acceptance criteria summary:** 4 criteria — every colour token hex matches exactly; every body-text pair is at least 4.5:1; it contains no pair of text/on-dark on bg/brand (#0C9BA9) …
- **Testing summary:** 3 unit, 1 component
- **Requirements:** REQ-N2, REQ-N3
- **Docs:** `docs/development/shared/shared-design-tokens/` · **Status:** NOT STARTED

### F0-03 — Continuous integration pipeline
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D2 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-ci-pipeline`
- **Description:** Automates the quality gates agreed in the Testing Decision and team meetings so no PR can merge with failing checks.
- **User value:** Prevents regressions and insecure dependencies reaching integration branches or main.
- **Dependencies:** F0-02 · **Blocking decisions:** OQ-01
- **Jira summary:** GitHub Actions: lint, typecheck, unit tests, build, dependency audit and commit-message check on every PR
- **Acceptance criteria summary:** 4 criteria — lint, typecheck, format, unit test, build, audit and commitlint jobs run; the lint job fails and the overall check is red; the commitlint job fails …
- **Testing summary:** 4 ci
- **Requirements:** REQ-N4, REQ-N9
- **Docs:** `docs/development/shared/shared-ci-pipeline/` · **Status:** NOT STARTED

### F0-14 — Core UI primitives and state components
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D2 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-ui-primitives`
- **Description:** Builds the reusable components that appear across all three dashboards in the Figma screens and the '06 · States' sheet.
- **User value:** Consistent, accessible building blocks so dashboard features only compose, never re-invent.
- **Dependencies:** F0-05 · **Blocking decisions:** OQ-01
- **Jira summary:** Avatar, Button, Status pill, Count badge, Progress bar, Card shell, Checkbox, Segmented control, Search field, File tile, empty/loading/error states
- **Acceptance criteria summary:** 6 criteria — its text reads 'Done · Aisha R.' and includes a check icon; it shows a warning icon and the text 'Overdue'; the text 'No matches for "Zoe".' is shown …
- **Testing summary:** 6 component
- **Requirements:** REQ-N1, REQ-N2, REQ-N3, REQ-17, REQ-19
- **Docs:** `docs/development/shared/shared-ui-primitives/` · **Status:** NOT STARTED

### UI-00 — Domain types, data-access contracts and design fixtures
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D2 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-domain-contracts-fixtures`
- **Description:** Defines the data contract every screen uses. Screens call the same query functions before and after wiring; in Phase 1 they return design fixtures, in Phase 3 the Supabase implementation replaces them.
- **User value:** Lets all three dashboards build real-looking screens in parallel now, and wire data later without rewriting them.
- **Dependencies:** F0-02 · **Blocking decisions:** OQ-01
- **Jira summary:** TypeScript domain types, query/action function signatures with a mock implementation, formatters, and fixtures copied from the designs
- **Acceptance criteria summary:** 6 criteria — it returns 'Aisha R.'; they return '1 hr 30 min' and '1 hr'; it returns 'Monday 30 November 2026' …
- **Testing summary:** 4 unit, 1 integration, 1 ci
- **Requirements:** REQ-N9, REQ-19
- **Docs:** `docs/development/shared/shared-domain-contracts-fixtures/` · **Status:** NOT STARTED

### F0-15 — Role app shell: rail, header and layouts
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D3 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-app-shell`
- **Description:** Implements the persistent chrome for the Family, Carer and Admin dashboards exactly as shown in the Figma screens.
- **User value:** Three distinct, recognisable portals; users always know whose record they are viewing.
- **Dependencies:** F0-14, UI-00 · **Blocking decisions:** OQ-01
- **Jira summary:** 88px gradient rail with role-specific items, 76px header (client or screen subject, date, user, Carer-only bell), role layouts
- **Acceptance criteria summary:** 6 criteria — 'Margaret' is the page title with subline '78 years · Preston VIC · Banksia Home Care' and 'Helen' appears separately at the right; items are exactly Home, Info, Calendar, Budget, Settings in that order; items are exactly Home, Patients, Calendar, Settings …
- **Testing summary:** 5 component, 1 e2e
- **Requirements:** REQ-02, REQ-12, REQ-N1, REQ-N2
- **Docs:** `docs/development/shared/shared-app-shell/` · **Status:** NOT STARTED

### UI-01 — Calendar kit: week/day/month grids, event blocks, date picker
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D3 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-calendar-kit`
- **Description:** Builds every calendar-like component once so the three dashboards compose them in parallel.
- **User value:** Removes the largest source of duplicated UI across dashboards.
- **Dependencies:** F0-14, UI-00 · **Blocking decisions:** OQ-01
- **Jira summary:** Reusable calendar components used by Family Calendar, Family Home, Carer Calendar, event form and Admin assign shift
- **Acceptance criteria summary:** 6 criteria — it returns Mon 30 Nov – Sun 6 Dec 2026; tops are 88px and 198px and heights 44px and 66px; MON 30 is highlighted and '09:30 Weekly weigh-in' appears under THU 3 …
- **Testing summary:** 2 unit, 4 component
- **Requirements:** REQ-16, REQ-25, REQ-23
- **Docs:** `docs/development/shared/shared-calendar-kit/` · **Status:** NOT STARTED

### UI-02 — Forms kit: fields, settings cards, side panels, chips, modal, event form
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D3–D4 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-forms-kit`
- **Description:** Builds the form patterns used across Settings, Staff, Clients, Manage and the event form.
- **User value:** Every form in three dashboards looks and validates the same way.
- **Dependencies:** F0-14, UI-00, UI-01 · **Blocking decisions:** OQ-01
- **Jira summary:** Form fields with errors, settings/profile cards, reset-password card, side-panel form, chip groups, confirmation modal and the event form layout
- **Acceptance criteria summary:** 6 criteria — 'Date' shows an inline error and onSubmit is not called; onCancel is called and focus returns to the trigger; start and end time inputs appear …
- **Testing summary:** 6 component
- **Requirements:** REQ-N1, REQ-N2
- **Docs:** `docs/development/shared/shared-forms-kit/` · **Status:** NOT STARTED

### UI-03 — Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D3 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-lists-cards-kit`
- **Description:** Builds the list and card patterns shown across all dashboards.
- **User value:** Screens become compositions, enabling fast parallel screen work.
- **Dependencies:** F0-14, UI-00 · **Blocking decisions:** OQ-01
- **Jira summary:** Data table, selectable rows, activity/log/notification rows, person card, stat card, budget bucket card, alert list card, client info view
- **Acceptance criteria summary:** 6 criteria — it shows '$240', 'of $3,000 · 92% used', a warning icon and the alert tone; the badge shows '3' and each row has an 'Overdue' pill; it has aria-selected='true' and shows a check icon …
- **Testing summary:** 6 component
- **Requirements:** REQ-17, REQ-19, REQ-27, REQ-10
- **Docs:** `docs/development/shared/shared-lists-cards-kit/` · **Status:** NOT STARTED

### UI-04 — Screen data contracts and fixtures: full-history Task log, single occurrence, event documents
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-screen-contracts-fixtures`
- **Description:** Added by CHG-004. Extends the `events` contract (defined newest-first order, validated paging, `getOccurrence`), adds a `documents` read contract (`getEventDocuments`), and extends the mock fixtures with the design's data and a long deterministic history, so the Family screens work for whatever data builds up, not only for sample rows.
- **User value:** A family member can search, filter and page the whole task history, open any task and see its documents.
- **Dependencies:** UI-00 · **Blocking decisions:** OQ-01
- **Jira summary:** getTaskLog ordering and paging, getOccurrence, getEventDocuments, design-matching and long-history fixtures
- **Acceptance criteria summary:** 10 criteria — newest-first paging with an accurate total; a page beyond the last is empty; invalid page values are rejected; `getOccurrence` never leaks another client's row; documents are scoped to their client and event …
- **Testing summary:** 22 unit
- **Requirements:** REQ-19, REQ-N9
- **Docs:** `docs/development/shared/shared-screen-contracts-fixtures/` · **Status:** NOT STARTED

### UI-05 — Plain events in the shared kit and contracts (CHG-009)
- **Dashboard / stream:** shared · **Lane:** S · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-plain-events`
- **Description:** Added by CHG-009 (the shared follow-up its Impact section lists). An occurrence of a plain event has no status in the domain types; `getTaskLog` gains a type filter (All / Tasks only / Events only) and status filters return tasks only; `getOccurrence` and `getTodayOccurrences` return plain events with no status; the mock fixtures carry plain events; the calendar kit gets a fourth, neutral "Event" block look; the lists kit gets a neutral "Event" label; the forms kit gets a shared switch and a way to hide the Status chips on the event form. Existing kit APIs stay backward compatible; dashboard lanes adopt the changes themselves.
- **User value:** Families and carers see plain events (a walk) on the schedule and in the log, clearly marked "Event" and never shown as Planned, Done or Overdue.
- **Dependencies:** UI-00, UI-01, UI-02, UI-03, UI-04 · **Blocking decisions:** None (OQ-01 ANSWERED; authorised by CHG-009)
- **Jira summary:** plain-event occurrence type, Task log type filter, plain-event fixtures, neutral Event look in calendar and lists kits, shared switch, EventForm status toggle
- **Acceptance criteria summary:** 13 criteria — a plain-event occurrence has no status; type filter with status filters returning tasks only; contracts return plain events without a status; plain-event fixtures with existing values kept; neutral "Event" look in every calendar surface and list row; a shared switch; EventForm can hide Status; axe clean; existing kit APIs unchanged …
- **Testing summary:** unit, contract, component and axe
- **Requirements:** REQ-35, REQ-17
- **Docs:** `docs/development/shared/shared-plain-events/` · **Status:** NOT STARTED

## Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) — feature detail

### FAM-UI-01 — Family Home screen (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D4 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-home`
- **Description:** Builds the Family · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-01, UI-03 · **Blocking decisions:** None
- **Jira summary:** Family Home: Today timeline, Enter event, Overdue card, Recent activity, Budget strip — on fixtures
- **Acceptance criteria summary:** 6 criteria — the Today panel shows Morning medication (Done · Aisha R.), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned); the Overdue card badge is '3' and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov); the budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state …
- **Testing summary:** 6 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-009 (tasks and plain events, REQ-35):** the Today timeline shows tasks and plain events; plain events use the neutral "Event" look; Overdue lists tasks only.
- **Docs:** `docs/development/family-dev/family-ui-home/` · **Status:** NOT STARTED

### FAM-UI-02 — Family Calendar screen (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D4–D5 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-calendar`
- **Description:** Builds the Family · Calendar screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-01, UI-03 · **Blocking decisions:** None
- **Jira summary:** Family Calendar: header range, D/W/M, week grid, Tasks checklist for selected day, Log panel — on fixtures
- **Acceptance criteria summary:** 5 criteria — W is selected and '30 Nov – 6 Dec 2026' is shown; Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4; its subtitle reads 'Tuesday 1 December' …
- **Testing summary:** 4 component, 1 e2e
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-009 (tasks and plain events, REQ-35):** calendar views show tasks and plain events (neutral "Event" look); the Tasks panel lists tasks only; the Log panel shows both.
- **Docs:** `docs/development/family-dev/family-ui-calendar/` · **Status:** NOT STARTED

### FAM-UI-03 — Family Add / Edit event screens (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D5 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-event-form`
- **Description:** Builds the Family · Edit event (and Add event) screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-02, UI-01, UI-03 · **Blocking decisions:** None
- **Jira summary:** Add event and Edit event screens using EventForm with Pick a date and document tiles — on fixtures
- **Acceptance criteria summary:** 4 criteria — Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description text are shown; a Date error is shown; document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile are shown …
- **Testing summary:** 3 component, 1 e2e
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/family-dev/family-ui-event-form/` · **Status:** NOT STARTED

### FAM-UI-04 — Family Info screen (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D5 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-info`
- **Description:** Builds the Family · Info screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-03 · **Blocking decisions:** None
- **Jira summary:** Client info: summary, Description, Habits, Medical history with Edit, Documentation tiles — on fixtures
- **Acceptance criteria summary:** 3 criteria — Description, Habits, Medical history and Documentation cards appear in that order with the design text; a textarea with the current text and Save/Cancel appears; tiles 'Care plan.pdf', 'Medication schedule.pdf' and 'Add file' are shown
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/family-dev/family-ui-info/` · **Status:** NOT STARTED

### FAM-UI-05 — Family Budget screen (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-budget`
- **Description:** Builds the Family · Budget screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-03 · **Blocking decisions:** None
- **Jira summary:** Funds by source with Update button, bucket cards and History table — on fixtures
- **Acceptance criteria summary:** 3 criteria — NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown; the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'; an empty state is shown
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-020 (PD-058):** 'Update' opens a simple form (bucket, Add or Remove, amount, optional note; local state only; a removal over the balance is refused); bucket cards show pending costs and History lists them marked Pending. +5 criteria (AC-04 to AC-08).
- **CHG-021 (PD-059):** 'Update' becomes 'Edit' and opens an Edit budget page (`budget/edit`) replacing the inline form: add or remove funds, add, rename or remove a bucket; buckets are open (NDIS, Fixed, Government are suggestions). AC-04 to AC-06 rewritten; +4 criteria (AC-09 to AC-12).
- **CHG-022 (PD-060):** a Pending costs section; each History and pending row opens a details dialog (note, recorder, paid or pending); rows made on Edit budget read "Recorded by you" and keep the save's note; adding funds pays pending costs whole, strictly oldest first (simulated in local state); an 'Export' button downloads History as CSV. +5 criteria (AC-13 to AC-17).
- **Docs:** `docs/development/family-dev/family-ui-budget/` · **Status:** NOT STARTED

### FAM-UI-06 — Family Settings screen (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-settings`
- **Description:** Builds the Family · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-02 · **Blocking decisions:** None
- **Jira summary:** Change organisation card with confirmation modal, Family info card, Reset username/password card — on fixtures
- **Acceptance criteria summary:** 3 criteria — Name 'Helen', Phone '0412 345 678', Email 'helen@example.com', Address '12 Wattle St, Preston VIC 3072' are shown; its title is 'Change organisation?' and the body states Banksia Home Care will lose access immediately; it closes and nothing else happens
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-023:** adds the `getFamilyContactDetails` contract and Helen's Settings fixtures, and AC-01 shows 'Helen Doyle' (PD-038). The feature also gains criteria for the Phase 1 behaviour of the Change confirm, Reset, the per-card Save (PD-054), validation and states: AC-04 to AC-09.
- **Docs:** `docs/development/family-dev/family-ui-settings/` · **Status:** NOT STARTED

### FAM-UI-07 — Family Task log and Task detail screens (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D6–D7 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-task-log-detail`
- **Description:** Builds the Family · Task log and Task detail screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-03, UI-02 · **Blocking decisions:** None
- **Jira summary:** Task log with search, status filter and rows; Task detail with status, description, documents — on fixtures
- **Acceptance criteria summary:** 4 criteria — 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha R. · Done · Aisha R.'; only Weekly weigh-in and Medication review remain, each with nurse '—'; 'No matches for "Zoe".' is shown …
- **Testing summary:** 4 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-009 (tasks and plain events, REQ-35):** "Task log" becomes "Care log" (route unchanged); lists tasks and plain events; Status shows "Event" for plain events; type filter All / Tasks only / Events only; plain-event detail shows "Event · No tick-off needed".
- **Docs:** `docs/development/family-dev/family-ui-task-log-detail/` · **Status:** NOT STARTED

### FAM-UI-08 — Family event cost fields (UI)
- **Dashboard / stream:** family · **Lane:** F · **Days:** — · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-ui-event-cost`
- **Description:** Adds optional Cost and 'Paid from' bucket fields to the Add / Edit event form on fixtures. A bucket at $0 or with pending costs is struck through and cannot be picked; a cost above a bucket's balance warns that it will be held as pending. Added by CHG-020.
- **User value:** Care is costed as it is planned, and nobody plans care against money that isn't there.
- **Dependencies:** FAM-UI-03, FAM-UI-05 · **Blocking decisions:** None
- **Jira summary:** Cost and bucket fields in the event form, with struck-through empty buckets and a low-balance warning — on fixtures
- **Acceptance criteria summary:** 6 criteria — $90.00 from NDIS is held; 0, negatives, 3 decimals and a cost with no bucket are refused; a $0 or pending bucket reads "No funds left" and can't be chosen; a cost above the balance warns; a recurring event reads "Charged each time it's completed"; Edit opens with the saved cost …
- **Testing summary:** 5 component, 1 unit
- **Requirements:** REQ-37, REQ-28, REQ-N1
- **CHG-021 (PD-059):** the picker lists the client's own buckets by id and name, not three kinds.
- **Docs:** `docs/development/family-dev/family-ui-event-cost/` · **Status:** NOT STARTED

### CAR-UI-01 — Carer Home screen (UI)
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D4 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-ui-home`
- **Description:** Builds the Carer · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-03 · **Blocking decisions:** None
- **Jira summary:** Carer Home: Today's calendar, Tasks checklist, Notifications, header bell — on fixtures
- **Acceptance criteria summary:** 3 criteria — Today's calendar shows 09:00, 11:30 and 15:00 rows for Margaret with Done/Planned/Planned pills; Notifications include 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' with an 'Admin' chip; a bell button is present
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-009 (tasks and plain events, REQ-35):** Today's calendar shows tasks and plain events; the Tasks checklist lists tasks only.
- **Docs:** `docs/development/carer-dev/carer-ui-home/` · **Status:** NOT STARTED

### CAR-UI-02 — Carer Patients and patient info screens (UI)
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D4–D5 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-ui-patients-info`
- **Description:** Builds the Carer · Patients (and patient info) screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-03 · **Blocking decisions:** None
- **Jira summary:** Patients grid with search and empty state; patient info page using ClientInfoView — on fixtures
- **Acceptance criteria summary:** 4 criteria — 7 cards appear including 'Margaret' '78 years · Preston VIC' and 'Jean' '88 years · Fairfield VIC'; 'No patients assigned yet' is shown; the patient info page for Margaret opens …
- **Testing summary:** 4 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/carer-dev/carer-ui-patients-info/` · **Status:** NOT STARTED

### CAR-UI-03 — Carer Calendar screen (UI)
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D5–D6 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-ui-calendar`
- **Description:** Builds the Carer · Calendar screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-01, UI-03 · **Blocking decisions:** None
- **Jira summary:** Carer Calendar: 'Shifts' week grid and 'Tasks for the selected shift' checklist — on fixtures
- **Acceptance criteria summary:** 3 criteria — MON 30 shows blocks '09:00 Margaret — Morning m…', '11:30 Margaret — Physiother…', '15:00 Margaret — Afternoon c…'; the subtitle reads '09:00 · Margaret — Morning medication' with three checklist items; W is selected
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **CHG-009 (tasks and plain events, REQ-35):** calendar blocks show tasks and plain events; "Tasks for the selected shift" lists tasks only.
- **Docs:** `docs/development/carer-dev/carer-ui-calendar/` · **Status:** NOT STARTED

### CAR-UI-04 — Carer Settings screen (UI)
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-ui-settings`
- **Description:** Builds the Carer · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-02 · **Blocking decisions:** None
- **Jira summary:** Carer Settings: My info (Name, Phone, Email, Role) and Reset card — on fixtures
- **Acceptance criteria summary:** 2 criteria — 'Aisha Rahman', '0423 987 654', 'aisha.r@banksiahomecare.com.au', 'Registered Nurse' are shown; it reads "We'll email you a secure link to reset your credentials." with a 'Reset' button
- **Testing summary:** 2 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/carer-dev/carer-ui-settings/` · **Status:** NOT STARTED

### ADM-UI-01 — Admin Home screen (UI)
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D4 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-ui-home`
- **Description:** Builds the Admin · Home screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-03 · **Blocking decisions:** None
- **Jira summary:** Admin Home: Clients and Staff stat cards, Overdue events across all clients — on fixtures
- **Acceptance criteria summary:** 3 criteria — 'Clients' shows 42 and 'Staff' shows 17; overdue rows include 'Robert · Medication review · Daniel K.'; 'All caught up' is shown
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/admin-dev/admin-ui-home/` · **Status:** NOT STARTED

### ADM-UI-02 — Admin Manage screen (UI)
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D4–D5 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-ui-manage`
- **Description:** Builds the Admin · Manage screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-01, UI-02, UI-03 · **Blocking decisions:** None
- **Jira summary:** Admin Manage: Staff and Clients selection columns with search, Assign shift panel with date, slots, warning — on fixtures
- **Acceptance criteria summary:** 4 criteria — both rows are selected and the summary reads 'Aisha Rahman → Margaret'; no rows are selected; the warning mentions 11:30–13:00 and Assign shift remains enabled …
- **Testing summary:** 4 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/admin-dev/admin-ui-manage/` · **Status:** NOT STARTED

### ADM-UI-03 — Admin Staff screen (UI)
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D5–D6 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-ui-staff`
- **Description:** Builds the Admin · Staff screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-02, UI-03 · **Blocking decisions:** None
- **Jira summary:** Admin Staff: Staff list with Add staff and Add/edit staff side panel — on fixtures
- **Acceptance criteria summary:** 3 criteria — rows include 'Sarah Nguyen · Enrolled Nurse' and 'Marcus Chen · Support Worker'; the panel shows her Name, Phone, Email and Role 'Registered Nurse'; an Email error is shown
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/admin-dev/admin-ui-staff/` · **Status:** NOT STARTED

### ADM-UI-04 — Admin Clients screen (UI)
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-ui-clients`
- **Description:** Builds the Admin · Clients screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-02, UI-03 · **Blocking decisions:** None
- **Jira summary:** Admin Clients: Client list with Remove links and Add client side panel — on fixtures
- **Acceptance criteria summary:** 3 criteria — rows include 'Margaret · Helen' and 'Doris · Tom' with 'Remove' links; an error is shown; no edit control for client information exists (D28)
- **Testing summary:** 3 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/admin-dev/admin-ui-clients/` · **Status:** NOT STARTED

### ADM-UI-05 — Admin Settings screen (UI)
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-ui-settings`
- **Description:** Builds the Admin · Settings screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.
- **User value:** A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.
- **Dependencies:** F0-15, UI-02 · **Blocking decisions:** None
- **Jira summary:** Admin Settings: Organisation info (name, ABN, phone, address) and Reset card — on fixtures
- **Acceptance criteria summary:** 2 criteria — 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072' are shown; no bell button exists
- **Testing summary:** 2 component
- **Requirements:** REQ-02, REQ-N1, REQ-N2, REQ-N3
- **Docs:** `docs/development/admin-dev/admin-ui-settings/` · **Status:** NOT STARTED

## Phase 2 — Backend & data layer (parallel with Phase 1) — feature detail

### F0-04 — Environment configuration and Supabase integration
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D2 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-supabase-environment`
- **Description:** Sets up environment variable validation, Supabase CLI local development, and the only approved ways to create Supabase clients (browser, server, middleware, and an isolated service-role client for jobs).
- **User value:** Keeps RLS as the enforcement layer on every request and prevents secret leakage.
- **Dependencies:** F0-02 · **Blocking decisions:** OQ-01
- **Jira summary:** Validated env config, local Supabase stack, and session-forwarding Supabase clients via @supabase/ssr
- **Acceptance criteria summary:** 4 criteria — it throws an error naming `NEXT_PUBLIC_SUPABASE_URL`; lint fails with the restricted-import message; the query runs with that user's JWT (auth.uid() equals the user id) …
- **Testing summary:** 1 unit, 2 ci, 1 integration
- **Requirements:** REQ-03, REQ-N4
- **Docs:** `docs/development/shared/shared-supabase-environment/` · **Status:** NOT STARTED

### F0-09 — Recurrence engine (pure TypeScript)
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D2–D3 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-recurrence-engine`
- **Description:** A pure, heavily unit-tested module that turns a recurrence rule plus per-occurrence overrides into concrete occurrences on demand, supporting a lifetime (perpetual) schedule without pre-generating dates.
- **User value:** Delivers the client's core 'perpetual calendar' requirement without re-entering items each year.
- **Dependencies:** F0-02 · **Blocking decisions:** OQ-01, OQ-12
- **Jira summary:** Expand stored recurrence rules into occurrences for any date range, with overrides, in Australia/Melbourne time
- **Acceptance criteria summary:** 8 criteria — exactly two occurrences are returned: 30 Nov 09:00 and 7 Dec 09:00; one occurrence on 30 Nov 2066 is returned; one occurrence on 28 Feb 2027 is returned (PROPOSED clamp rule) …
- **Testing summary:** 8 unit
- **Requirements:** REQ-13, REQ-14, REQ-15
- **Docs:** `docs/development/shared/shared-recurrence-engine/` · **Status:** NOT STARTED

### F0-06 — Identity, organisation and client access schema with RLS
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D3–D4 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-tenancy-schema-rls`
- **Description:** Creates the core access model: which organisation a client currently belongs to, which family members hold authority, which carers are assigned, and database-enforced visibility for each role.
- **User value:** Implements the central security requirement: users only ever see clients they are authorised for.
- **Dependencies:** F0-04 · **Blocking decisions:** OQ-01, OQ-07, OQ-09, OQ-16
- **Jira summary:** Postgres tables for organisations, profiles, clients, family links and carer assignments, with tested RLS helper functions
- **Acceptance criteria summary:** 8 criteria — only Margaret's row is returned; zero rows are returned; exactly the clients whose organisation_id is Banksia are returned …
- **Testing summary:** 8 db
- **Requirements:** REQ-03, REQ-04, REQ-05, REQ-06, REQ-N6
- **Docs:** `docs/development/shared/shared-tenancy-schema-rls/` · **Status:** NOT STARTED

### F0-08 — Append-only audit log capture
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D4 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-audit-log-capture`
- **Description:** Creates the append-only audit table and generic trigger, attaches it to existing tables and defines the pattern later schema features must follow.
- **User value:** Safeguarding: actions are traceable to a person and time and cannot be rewritten.
- **Dependencies:** F0-06 · **Blocking decisions:** OQ-01
- **Jira summary:** Database triggers record who changed what and when into an immutable audit log
- **Acceptance criteria summary:** 3 criteria — one audit_log row exists with action UPDATE, actor_id = Helen, and before/after values; the statement is rejected; the audit row has actor_role 'system'
- **Testing summary:** 3 db
- **Requirements:** REQ-N7, REQ-N6
- **Docs:** `docs/development/shared/shared-audit-log-capture/` · **Status:** NOT STARTED

### F0-10 — Shifts schema, active-shift function and conflict query
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D4–D5 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-shifts-schema`
- **Description:** Stores non-recurring shifts assigning a carer to a client for a time window, exposes whether a carer is currently on shift for a client, and detects overlapping shifts without blocking them.
- **User value:** Enables shift-based edit rights, the Admin assign-shift flow, the Carer calendar and 'which carer is on today' for families.
- **Dependencies:** F0-06 · **Blocking decisions:** OQ-01, OQ-09
- **Jira summary:** Tables and RLS for carer shifts on clients, a DB function for 'carer is on active shift', and overlap detection as a warning
- **Acceptance criteria summary:** 7 criteria — it returns true; it returns false; it returns false …
- **Testing summary:** 7 db
- **Requirements:** REQ-05, REQ-23, REQ-25, REQ-26
- **Docs:** `docs/development/shared/shared-shifts-schema/` · **Status:** NOT STARTED

### F0-07 — Sign-in, sign-out, password reset and role-based routing
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D5 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-authentication`
- **Description:** Implements authentication with Supabase Auth and routes Family, Carer and Admin users to their separate dashboards, blocking cross-role access server-side.
- **User value:** Users get in 'as simply as their online bank' (CIS3) and never see another role's dashboard.
- **Dependencies:** F0-06, F0-15, UI-02 · **Blocking decisions:** OQ-01, OQ-08
- **Jira summary:** Email/password sign-in, sign-out, reset-password email flow, and redirect of each role to its own dashboard
- **Acceptance criteria summary:** 8 criteria — she lands on `/family/<Margaret id>/home`; a generic error is shown and no session cookie is set; she lands on `/carer/home` …
- **Testing summary:** 2 e2e, 6 integration
- **Requirements:** REQ-01, REQ-02, REQ-09
- **Docs:** `docs/development/shared/shared-authentication/` · **Status:** NOT STARTED

### F0-11 — Care events, occurrence overrides and append-only completions
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D5–D6 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-care-events-schema`
- **Description:** Stores care events (the Care Need Items as designed: 'events'), their occurrence overrides and an append-only completion history; provides a server query that returns occurrences with status and actor for a date range.
- **User value:** The heart of the product: what care is due, when, and who did it.
- **Dependencies:** F0-06, F0-09, F0-10, F0-08 · **Blocking decisions:** OQ-01, OQ-10, OQ-22, OQ-29, OQ-09, OQ-33
- **Jira summary:** Schema, RLS and server query layer for recurring/one-off events, per-occurrence overrides, completions and derived Planned/Done/Overdue status
- **Acceptance criteria summary:** 8 criteria — it returns the weekly occurrences in that range with status 'planned' for future ones; status is 'overdue'; status is 'done' with actor label 'Aisha R.' …
- **Testing summary:** 2 integration, 2 unit, 4 db
- **Requirements:** REQ-13, REQ-14, REQ-15, REQ-17, REQ-18, REQ-19, REQ-N6
- **CHG-009 (tasks and plain events, REQ-35):** store `completion_mode` (`manual` = task, `automatic` = plain event) on events and per-occurrence overrides; plain-event occurrences have no status and `set_occurrence_done` rejects them; mode changes never apply before now; the log query takes a type filter.
- **CHG-020 (PD-058, REQ-37):** events gain an optional cost (`numeric(12,2)`) and the bucket it is paid from; a change applies to future completions only; the creator is stored so the carer who created an event may change its cost.
- **Docs:** `docs/development/shared/shared-care-events-schema/` · **Status:** NOT STARTED

### F0-12 — Budget buckets, fund top-ups, spending and summary calculation
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D6 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-budget-schema`
- **Description:** Stores each client's funding buckets, fund top-up history and spending; calculates total, used, remaining, percent used and threshold state atomically in Postgres.
- **User value:** Families and organisations see exactly how much is left; the basis for threshold warnings.
- **Dependencies:** F0-06, F0-08 · **Blocking decisions:** OQ-01, OQ-03, OQ-04, OQ-05
- **Jira summary:** Schema, RLS and exact-decimal calculations for budget buckets, top-up history, expenses and threshold state
- **Acceptance criteria summary:** 6 criteria — remaining is 14880.00 and percent_used is 38; percent_used is 92 and threshold_state is 'alert' (under 70/90/100 thresholds; recalculated once OQ-03 is answered); remaining is negative and threshold_state is 'depleted' …
- **Testing summary:** 5 db, 1 unit
- **Requirements:** REQ-27, REQ-28, REQ-29, REQ-N12
- **CHG-020 (PD-058, REQ-37, REQ-38):** charge an event's cost once per completed occurrence; a cost the bucket cannot cover in full is held whole as pending (no overdraft from event costs, replacing the 'remaining is negative' criterion); a top-up pays pending costs oldest first, each only in full; a manual removal cannot go below $0; admins of the client's organisation get the same writes as Family; carers get no direct budget writes. Lane B rewrites the PRD/ACs/TEST_PLAN on start. Not yet decided: a pending cost whose event is deleted; pending costs across a bucket's period.
- **CHG-021 (PD-059):** buckets are rows with a name (unique per client, case-insensitive) and an optional kind, not a fixed enum; fund entries reference the bucket by id; a bucket is deleted only with no charges and no pending costs, its remaining funds recorded as a 'Bucket removed' entry. Lane B records it on start.
- **CHG-022 (PD-060):** a top-up pays the bucket's pending costs whole, strictly oldest first, stopping at the first that does not fit, recording the paid date on the cost; each entry stores its recorder and the save's note.
- **Docs:** `docs/development/shared/shared-budget-schema/` · **Status:** NOT STARTED

### F0-13 — Client document storage
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D6–D7 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-document-storage`
- **Description:** Stores uploaded files (care plans, reports, photos) for a client, optionally attached to an event, retained in perpetuity with access mirroring client access.
- **User value:** Evidence and medical documents are kept safely and found again.
- **Dependencies:** F0-06, F0-11 · **Blocking decisions:** OQ-01, OQ-26
- **Jira summary:** Private Supabase Storage bucket, documents table, storage policies, validated upload and signed download
- **Acceptance criteria summary:** 5 criteria — a documents row exists and the object is stored under Margaret's path; a signed URL is returned that expires; it is rejected with a plain-language message and nothing is stored …
- **Testing summary:** 4 integration, 1 db
- **Requirements:** REQ-22, REQ-N5, REQ-N6
- **Docs:** `docs/development/shared/shared-document-storage/` · **Status:** NOT STARTED

### F0-16 — Development seed data from the design content
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D7 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-dev-seed-data`
- **Description:** Seeds the local database with the people, events, shifts, budgets and documents shown in the designs so each dashboard can be built and tested independently.
- **User value:** Lets Family, Carer and Admin streams develop in parallel and makes screens verifiable against Figma.
- **Dependencies:** F0-11, F0-12, F0-13, F0-10 · **Blocking decisions:** OQ-01
- **Jira summary:** Deterministic local seed matching Figma content (Banksia Home Care, Margaret, Helen, Aisha R., Priya, budgets, events)
- **Acceptance criteria summary:** 3 criteria — NDIS remaining 14880, Fixed 2750, Government 240 are returned; each succeeds and lands on their role home; it exits non-zero without writing
- **Testing summary:** 3 integration
- **Requirements:** REQ-N9
- **CHG-009 (tasks and plain events, REQ-35):** seed plain events (e.g. a daily walk) alongside tasks.
- **Docs:** `docs/development/shared/shared-dev-seed-data/` · **Status:** NOT STARTED

### F0-17 — Self-serve sign-up for Family and Organisation accounts
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-sign-up`
- **Description:** A public `/sign-up` page, built like `/sign-in`, where a family member creates their account and their client, or an organisation admin creates their account and a new organisation. Carers are invited by their admin and cannot sign up. Added by CHG-010 (PD-057).
- **User value:** The confirmed workflow (PD-037: the family sets up the client, then picks a provider) can start without anyone creating accounts by hand.
- **Dependencies:** F0-06, F0-07 · **Blocking decisions:** OQ-01, OQ-07, OQ-08
- **Jira summary:** Sign-up page (account type, names, email, password, plus client or organisation name) that creates the account and its linked record atomically, then signs the user in
- **Acceptance criteria summary:** 8 criteria — a family sign-up lands on the new client's Home; an organisation sign-up is routed like an admin sign-in; public sign-up cannot create a carer or join an existing organisation …
- **Testing summary:** 2 e2e, 4 integration, 2 db
- **Requirements:** REQ-01, REQ-36
- **Docs:** `docs/development/shared/shared-sign-up/` · **Status:** NOT STARTED

## Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) — feature detail

### FAM-01 — Family Home — Today day-view timeline
- **Dashboard / stream:** family · **Lane:** F · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-home-today`
- **Description:** The left 'Today' panel on the Family landing screen: an hour-gutter timeline listing today's occurrences for the client.
- **User value:** The family sees at a glance what care is happening today and whether it has been done.
- **Dependencies:** F0-11, F0-16, FAM-UI-01 · **Blocking decisions:** OQ-29
- **Jira summary:** Day-view timeline 07:00–18:00 showing today's events with carer, duration and status pill
- **Acceptance criteria summary:** 6 criteria — a block at 09:00 shows 'Morning medication', 'Aisha R.', '1 hr' and pill 'Done · Aisha R.'; its block spans 11:30–13:00, shows '1 hr 30 min' and pill 'Planned'; tops are 88px and 198px and heights 44px and 66px …
- **Testing summary:** 4 component, 1 unit, 1 integration
- **Requirements:** REQ-16, REQ-17, REQ-19, REQ-26
- **CHG-009 (tasks and plain events, REQ-35):** the Today timeline shows tasks and plain events; plain events have no status.
- **Docs:** `docs/development/family-dev/family-home-today/` · **Status:** NOT STARTED

### FAM-02 — Family Home — Overdue card and Recent activity
- **Dashboard / stream:** family · **Lane:** F · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-home-overdue-activity`
- **Description:** Shows overdue occurrences and the most recent five activity items for the client on the Family landing screen.
- **User value:** Problems surface immediately; recent history is one glance away.
- **Dependencies:** F0-11, FAM-UI-01 · **Blocking decisions:** None
- **Jira summary:** Right-column Overdue card with count badge and Recent activity list of the last 5 items with 'View all'
- **Acceptance criteria summary:** 4 criteria — the badge shows '3' and three rows each show an 'Overdue' pill with warning icon; 'All caught up' and 'There are no overdue tasks right now.' are shown; exactly 5 items are returned ordered Mon 30 Nov, Sun 29 Nov, Sun 29 Nov, Sat 28 Nov, Sat 28 Nov …
- **Testing summary:** 3 component, 1 integration
- **Requirements:** REQ-17, REQ-19, REQ-21
- **CHG-009 (tasks and plain events, REQ-35):** Overdue and Recent activity (Done or Overdue rows) contain tasks only, since plain events have no status.
- **Docs:** `docs/development/family-dev/family-home-overdue-activity/` · **Status:** NOT STARTED

### FAM-03 — Family Home — Budget strip
- **Dashboard / stream:** family · **Lane:** F · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-home-budget-strip`
- **Description:** Bottom strip on Family Home showing '$17,870 remaining of $32,000 · 44% used' and one card per funding bucket.
- **User value:** The bucket in trouble is visible instead of hidden in an average (D17).
- **Dependencies:** F0-12, FAM-UI-01 · **Blocking decisions:** OQ-03, OQ-04
- **Jira summary:** Budget strip with aggregate remaining line and three individual bucket cards with threshold states
- **Acceptance criteria summary:** 4 criteria — the aggregate line reads '$17,870 remaining of $32,000 · 44% used'; it uses the alert tone, shows a warning icon and '$240' 'of $3,000 · 92% used'; it uses the normal tone and shows '$14,880' 'of $24,000 · 38% used' …
- **Testing summary:** 4 component
- **Requirements:** REQ-27, REQ-28
- **Docs:** `docs/development/family-dev/family-home-budget-strip/` · **Status:** NOT STARTED

### FAM-04 — Family Calendar — day, week and month views
- **Dashboard / stream:** family · **Lane:** F · **Days:** D8–D9 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-calendar-views`
- **Description:** The Family Calendar grid: week view with hour gutter and event blocks, plus day and month views following normal calendar conventions.
- **User value:** Families plan around upcoming care across days, weeks and months.
- **Dependencies:** F0-11, FAM-UI-02 · **Blocking decisions:** None
- **Jira summary:** Calendar with D/W/M segmented control (default week), Monday-first week grid, today highlight and navigation
- **Acceptance criteria summary:** 6 criteria — W is selected and columns MON 30 to SUN 6 are shown with 30 highlighted; it returns Mon 30 Nov 2026 to Sun 6 Dec 2026; '09:30 Weekly weigh-in' appears in the THU 3 column …
- **Testing summary:** 3 component, 1 unit, 1 e2e, 1 integration
- **Requirements:** REQ-14, REQ-16
- **CHG-009 (tasks and plain events, REQ-35):** day, week and month views show plain events in the neutral "Event" look.
- **Docs:** `docs/development/family-dev/family-calendar-views/` · **Status:** NOT STARTED

### FAM-05 — Family Calendar — Tasks panel and Log panel
- **Dashboard / stream:** family · **Lane:** F · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-calendar-tasks-log`
- **Description:** Panels beneath the Family calendar: tick off the selected day's tasks and see a short activity log.
- **User value:** Family can confirm care has happened (D26) and review recent activity.
- **Dependencies:** F0-11, FAM-UI-02 · **Blocking decisions:** OQ-10
- **Jira summary:** Tasks checklist for the selected day (tick to mark Done) and Log panel with recent items and 'View all'
- **Acceptance criteria summary:** 4 criteria — it shows struck through and the completion is recorded with actor Helen; the checkbox returns to unticked and an error message is shown; its subtitle reads 'Monday 30 November' and lists that day's occurrences …
- **Testing summary:** 1 e2e, 3 component
- **Requirements:** REQ-18, REQ-19, REQ-21
- **CHG-009 (tasks and plain events, REQ-35):** the Tasks panel lists tasks only; the Log panel shows tasks and plain events.
- **Docs:** `docs/development/family-dev/family-calendar-tasks-log/` · **Status:** NOT STARTED

### FAM-06 — Family — Add event (Enter event)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-add-event`
- **Description:** Creates a one-off or recurring event for the client using the event form shown in the Edit event design.
- **User value:** Families can put care needs into the perpetual schedule themselves.
- **Dependencies:** F0-09, F0-11, FAM-UI-03 · **Blocking decisions:** OQ-22, OQ-12, OQ-10
- **Jira summary:** Enter event form: date with picker, recurring option, description, documents; entry from Home 'Enter event'
- **Acceptance criteria summary:** 5 criteria — the event appears on the calendar every week from the chosen date; an error is shown on Date and nothing is submitted; days 24, 26, 27 show event dots and the selected day is filled …
- **Testing summary:** 1 e2e, 3 component, 1 integration
- **Requirements:** REQ-13, REQ-14, REQ-18
- **CHG-009 (tasks and plain events, REQ-35):** the form has the "This is a task — must be ticked off" switch, on by default.
- **CHG-020 (PD-058):** save the event's optional cost and bucket (FAM-UI-08 fields).
- **Docs:** `docs/development/family-dev/family-add-event/` · **Status:** NOT STARTED

### FAM-07 — Family — Edit event
- **Dashboard / stream:** family · **Lane:** F · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-edit-event`
- **Description:** The 'Edit event' screen, prefilled, reached from Task detail 'Edit' or a calendar event block.
- **User value:** Care needs change over time (CIS5); families can adjust without re-entering.
- **Dependencies:** FAM-06 · **Blocking decisions:** OQ-10, OQ-11, OQ-22
- **Jira summary:** Edit an existing event or occurrence: date, recurring, status, description, documents
- **Acceptance criteria summary:** 4 criteria — the new description shows on Task detail; past completions are unchanged in the task log; a Date error is shown …
- **Testing summary:** 1 e2e, 2 integration, 1 component
- **Requirements:** REQ-14, REQ-15, REQ-17
- **CHG-009 (tasks and plain events, REQ-35):** the task switch shows the event's current value and follows the edit scope (this occurrence / this and future / entire series from now); it never changes past occurrences.
- **CHG-020 (PD-058):** cost and bucket editable by Family, admins, or the carer who created the event; future completions only.
- **Docs:** `docs/development/family-dev/family-edit-event/` · **Status:** NOT STARTED

### FAM-08 — Family — Event documents (file tiles)
- **Dashboard / stream:** family · **Lane:** F · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-event-documents`
- **Description:** Adds working document tiles to the event form and Task detail, backed by document storage.
- **User value:** Referrals, plans and evidence live with the care they relate to.
- **Dependencies:** F0-13, FAM-UI-03 · **Blocking decisions:** OQ-26
- **Jira summary:** Attach, list and open documents on an event using file tiles and '+ Add file'
- **Acceptance criteria summary:** 3 criteria — a tile 'Physio referral.pdf' appears on the event; an inline error is shown and no tile is added; the document opens via a signed URL
- **Testing summary:** 1 e2e, 2 component
- **Requirements:** REQ-22
- **Docs:** `docs/development/family-dev/family-event-documents/` · **Status:** NOT STARTED

### FAM-09 — Family — Client info
- **Dashboard / stream:** family · **Lane:** F · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-client-info`
- **Description:** The Family 'Info' screen showing and editing the client's key information and client-level documents.
- **User value:** Everyone caring for the client reads the same up-to-date information (D9).
- **Dependencies:** F0-06, F0-13, FAM-UI-04 · **Blocking decisions:** OQ-26
- **Jira summary:** Client info page: summary header, Description, Habits, Medical history sections with Edit, and Documentation tiles
- **Acceptance criteria summary:** 5 criteria — the new text is displayed; Description, Habits, Medical history and Documentation cards appear in that order; an error is shown and the text is not saved …
- **Testing summary:** 2 e2e, 2 component, 1 db
- **Requirements:** REQ-10, REQ-22
- **Docs:** `docs/development/family-dev/family-client-info/` · **Status:** NOT STARTED

### FAM-10 — Family — Budget overview and history
- **Dashboard / stream:** family · **Lane:** F · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-budget-overview`
- **Description:** The Family Budget screen: per-bucket remaining/total/percent and a dated history of top-ups.
- **User value:** Families understand where money came from and how much is left (D7).
- **Dependencies:** F0-12, FAM-UI-05 · **Blocking decisions:** OQ-04, OQ-05
- **Jira summary:** 'Funds by source' bucket cards and a History table of fund entries
- **Acceptance criteria summary:** 4 criteria — three bucket cards NDIS, Fixed, Government appear with remaining $14,880, $2,750, $240; the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'; the empty state is shown …
- **Testing summary:** 3 component, 1 e2e
- **Requirements:** REQ-27, REQ-28, REQ-29
- **CHG-020 (PD-058):** show pending costs on bucket cards and in History (FAM-UI-05 layout).
- **CHG-021 (PD-059):** draw the client's buckets, any number including none; 'Edit' opens the Edit budget page.
- **CHG-022 (PD-060):** connect the Pending costs section, the entry details dialog and Export to real data; Export writes the client's whole History from the database.
- **Docs:** `docs/development/family-dev/family-budget-overview/` · **Status:** NOT STARTED

### FAM-11 — Family — Update funds
- **Dashboard / stream:** family · **Lane:** F · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-budget-update-funds`
- **Description:** Lets the authorised person record a fund top-up against a bucket, producing a History entry and updated totals.
- **User value:** Budgets stay accurate as new funding arrives.
- **Dependencies:** FAM-10 · **Blocking decisions:** OQ-05, OQ-04, OQ-19
- **Jira summary:** 'Update' action on Funds by source to add funds to a bucket (flow not yet designed)
- **Acceptance criteria summary:** 3 criteria — the NDIS card shows $15,880 and History's first row shows '+$1,000'; a validation error is shown and nothing is saved; it is rejected
- **Testing summary:** 1 e2e, 1 component, 1 integration
- **Requirements:** REQ-29
- **CHG-020 (PD-058):** the form is bucket, Add or Remove, amount, optional note, dated today; a removal over the balance is refused; a top-up settles pending costs via F0-12; Family and admins only. The future-date edge case no longer applies. Lane F rewrites the PRD/ACs/TEST_PLAN on start.
- **CHG-021 (PD-059):** wires the Edit budget page instead: add or remove funds, add, rename or remove a bucket, one note per save.
- **CHG-022 (PD-060):** each save records its note on every row and the signed-in person as the recorder.
- **Docs:** `docs/development/family-dev/family-budget-update-funds/` · **Status:** NOT STARTED

### FAM-12 — Family — Settings: family info and password reset
- **Dashboard / stream:** family · **Lane:** F · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-settings-profile`
- **Description:** The Family Settings screen apart from Change organisation: personal contact details and requesting a reset link.
- **User value:** Contact details stay current for staff and notifications; users can recover access themselves.
- **Dependencies:** F0-07, FAM-UI-06 · **Blocking decisions:** OQ-35
- **Jira summary:** Settings page with Family info (Name, Phone, Email, Address) and 'Reset username / password'
- **Acceptance criteria summary:** 4 criteria — the new number is shown after reload; an email error is shown; a reset email is requested for her address and a confirmation message is shown …
- **Testing summary:** 1 e2e, 1 component, 1 integration, 1 db
- **Requirements:** REQ-01
- **Docs:** `docs/development/family-dev/family-settings-profile/` · **Status:** NOT STARTED

### FAM-13 — Family — Change organisation
- **Dashboard / stream:** family · **Lane:** F · **Days:** D11 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-change-organisation`
- **Description:** Lets the family move the client to another organisation: history retained, nurse assignments and future shifts cleared, old organisation loses access immediately.
- **User value:** Families can leave a provider without losing any records (CIS3, CIS5).
- **Dependencies:** F0-06, F0-10, FAM-UI-06 · **Blocking decisions:** OQ-06, OQ-15
- **Jira summary:** 'Change' → choose a registered organisation → destructive confirmation → atomic transfer retaining history
- **Acceptance criteria summary:** 6 criteria — clients.organisation_id changes, future shifts are cancelled and the assignment is ended; zero rows are returned; counts equal the pre-transfer counts …
- **Testing summary:** 4 db, 2 component
- **Requirements:** REQ-04, REQ-N6
- **CHG-010 (self-serve sign-up, REQ-36):** a self-registered family's client starts with no organisation; the organisation card must offer 'Choose organisation' (picker, no transfer confirmation) when there is none yet.
- **Docs:** `docs/development/family-dev/family-change-organisation/` · **Status:** NOT STARTED

### FAM-14 — Family — Task log
- **Dashboard / stream:** family · **Lane:** F · **Days:** D11 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-task-log`
- **Description:** Drill-down page (no rail item) listing every task occurrence up to today with search and filtering.
- **User value:** Families can audit care history over time (D27).
- **Dependencies:** F0-11, FAM-UI-07 · **Blocking decisions:** OQ-29
- **Jira summary:** Full task list with server-side search, status filter and rows Date · Task · Nurse · Status linking to detail
- **Acceptance criteria summary:** 5 criteria — the first rows are Mon 30 Nov Morning medication (Done · Aisha R.), Physiotherapy (Planned), Afternoon check-in (Planned); only Weekly weigh-in (Sun 29 Nov) and Medication review (Sat 28 Nov) are listed, each with nurse '—'; 'No matches for "Zoe".' is displayed …
- **Testing summary:** 3 integration, 1 component, 1 e2e
- **Requirements:** REQ-21
- **CHG-009 (tasks and plain events, REQ-35):** the page is the "Care log"; it lists tasks and plain events, shows "Event" in Status for plain events, and adds a type filter (All / Tasks only / Events only); status filters return tasks only.
- **Docs:** `docs/development/family-dev/family-task-log/` · **Status:** NOT STARTED

### FAM-15 — Family — Task detail
- **Dashboard / stream:** family · **Lane:** F · **Days:** D11 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-task-detail`
- **Description:** Drill-down detail for one occurrence reached from the Task log, Overdue card, Recent activity and Log panel.
- **User value:** Families can see exactly what happened, when and by whom.
- **Dependencies:** F0-11, F0-13, FAM-UI-07 · **Blocking decisions:** OQ-29, OQ-10
- **Jira summary:** Single task view: title, date, assignee, status with actor and completion time, description with Edit, documents
- **Acceptance criteria summary:** 4 criteria — it shows 'Done · Aisha R.' and 'Completed at 09:14'; the subline reads 'Monday 30 November 2026 · Assigned to Aisha R.'; its Task detail opens …
- **Testing summary:** 2 component, 1 e2e, 1 integration
- **Requirements:** REQ-19, REQ-21, REQ-22
- **CHG-009 (tasks and plain events, REQ-35):** a plain event's detail shows "Event · No tick-off needed" in the Status card, no pill or completion time; back link reads "Back to Care log".
- **CHG-020 (PD-058):** marking a task done charges its cost or makes it pending through F0-12.
- **Docs:** `docs/development/family-dev/family-task-detail/` · **Status:** NOT STARTED

### CAR-01 — Carer Home — Today's calendar and Tasks
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-home-today`
- **Description:** The Carer Home screen's top cards listing today's occurrences across the carer's assigned clients.
- **User value:** A carer on a shared laptop mid-shift sees one clear list of what to do next.
- **Dependencies:** F0-10, F0-11, CAR-UI-01 · **Blocking decisions:** OQ-33, OQ-09
- **Jira summary:** Carer landing: 'Today's calendar' rows (time, client — event, status) and 'Tasks' checklist
- **Acceptance criteria summary:** 3 criteria — Today's calendar shows '09:00 Margaret — Morning medication' with 'Done · Aisha R.', '11:30 Margaret — Physiotherapy' Planned and '15:00 Margaret — Afternoon check-in' Planned; no Robert occurrences are returned; the empty state is shown
- **Testing summary:** 2 component, 1 integration
- **Requirements:** REQ-05, REQ-17, REQ-25
- **CHG-009 (tasks and plain events, REQ-35):** Today's calendar shows tasks and plain events; the Tasks checklist lists tasks only.
- **Docs:** `docs/development/carer-dev/carer-home-today/` · **Status:** NOT STARTED

### CAR-02 — Carer — Notifications card and bell
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-notifications`
- **Description:** Records and displays notifications for carers such as new shift assignments and family document updates.
- **User value:** Carers learn about changes affecting their clients without being told in person (D34).
- **Dependencies:** F0-10, F0-13, CAR-UI-01 · **Blocking decisions:** OQ-14
- **Jira summary:** In-app notifications (source chip Admin/Family + message) on Carer Home and a header bell
- **Acceptance criteria summary:** 4 criteria — a notification for Aisha with source 'admin' and message 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' exists; each carer assigned to Margaret receives a 'family' notification; Aisha's notifications are not returned …
- **Testing summary:** 3 db, 1 component
- **Requirements:** REQ-32
- **Docs:** `docs/development/carer-dev/carer-notifications/` · **Status:** NOT STARTED

### CAR-03 — Carer — Patients
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-patients`
- **Description:** The Carer Patients screen listing clients the carer is currently assigned to.
- **User value:** Carers find the person they're caring for quickly.
- **Dependencies:** F0-06, F0-10, CAR-UI-02 · **Blocking decisions:** OQ-09
- **Jira summary:** Searchable grid of assigned patients (avatar, name, age, suburb); opens client info
- **Acceptance criteria summary:** 4 criteria — 7 cards are shown including 'Margaret' '78 years · Preston VIC'; only Elsie is shown; 'No patients assigned yet' is shown …
- **Testing summary:** 3 integration, 1 component
- **Requirements:** REQ-05
- **Docs:** `docs/development/carer-dev/carer-patients/` · **Status:** NOT STARTED

### CAR-04 — Carer — Client info
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-client-info`
- **Description:** Reuses the Family Info view for a patient opened from Patients, with edit controls present only when the carer is on an active shift for that client.
- **User value:** Carers read the same care information as the family and can update it while working.
- **Dependencies:** F0-06, F0-10, F0-13, CAR-UI-02 · **Blocking decisions:** OQ-09
- **Jira summary:** Carer view of client info (same view as Family minus organisation/payment controls); edits only during active shift
- **Acceptance criteria summary:** 4 criteria — no Edit links or Add file tile exist; the change is shown; RLS rejects it …
- **Testing summary:** 1 component, 1 e2e, 1 db, 1 integration
- **Requirements:** REQ-05, REQ-10
- **Docs:** `docs/development/carer-dev/carer-client-info/` · **Status:** NOT STARTED

### CAR-05 — Carer — Calendar (shifts) and selected-shift tasks
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D9–D10 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-calendar-shifts`
- **Description:** The Carer Calendar screen: calendar blocks labelled '09:00 Margaret — Morning m…' and a task panel for the selected block.
- **User value:** Carers see their roster and what each shift involves (D8).
- **Dependencies:** F0-10, F0-11, CAR-UI-03 · **Blocking decisions:** OQ-33
- **Jira summary:** Week/day/month calendar of the carer's shifts with a 'Tasks for the selected shift' panel
- **Acceptance criteria summary:** 3 criteria — MON 30 shows blocks at 09:00, 11:30 and 15:00 labelled with 'Margaret —'; its subtitle reads '09:00 · Margaret — Morning medication'; none of Daniel's shifts appear
- **Testing summary:** 2 component, 1 integration
- **Requirements:** REQ-25
- **CHG-009 (tasks and plain events, REQ-35):** calendar blocks show tasks and plain events; "Tasks for the selected shift" lists tasks only.
- **Docs:** `docs/development/carer-dev/carer-calendar-shifts/` · **Status:** NOT STARTED

### CAR-06 — Carer — Mark tasks done
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-complete-task`
- **Description:** Lets carers complete occurrences with their identity recorded, respecting shift-based edit rights.
- **User value:** Accurate, safeguarded record of who provided care and when (brief II, item 7).
- **Dependencies:** F0-10, F0-11, CAR-UI-01, CAR-UI-03 · **Blocking decisions:** OQ-09, OQ-10, OQ-33
- **Jira summary:** Tick tasks on Carer Home and the selected-shift panel, recording actor and time, only during an active shift
- **Acceptance criteria summary:** 3 criteria — Family Home shows 'Done · Aisha R.' for Physiotherapy; task checkboxes are not interactive; the checkbox reverts and an error is shown
- **Testing summary:** 1 e2e, 2 component
- **Requirements:** REQ-18, REQ-19, REQ-05
- **CHG-009 (tasks and plain events, REQ-35):** only tasks can be ticked off; plain events have no status.
- **CHG-020 (PD-058):** marking a task done charges its cost or makes it pending through F0-12; the carer never edits the budget directly.
- **Docs:** `docs/development/carer-dev/carer-complete-task/` · **Status:** NOT STARTED

### CAR-07 — Carer — Add and edit events for a patient
- **Dashboard / stream:** carer · **Lane:** C · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-manage-events`
- **Description:** Implements sequence Use Case 2: carer opens a rostered patient's calendar and adds a task with date, description and documentation.
- **User value:** Carers can record needs they observe while caring.
- **Dependencies:** CAR-04, F0-11, UI-02 · **Blocking decisions:** OQ-09, OQ-22, OQ-19
- **Jira summary:** Carer creates/edits a patient's event during an active shift (entry point not designed)
- **Acceptance criteria summary:** 2 criteria — it appears on Margaret's family calendar; it is rejected
- **Testing summary:** 1 e2e, 1 integration
- **Requirements:** REQ-18
- **CHG-009 (tasks and plain events, REQ-35):** the form has the task switch (on by default); a carer on shift can switch either way; the change is audited.
- **CHG-020 (PD-058):** a carer may set a cost and bucket when creating an event (reusing FAM-UI-08's fields), and change them later only on events they created.
- **Docs:** `docs/development/carer-dev/carer-manage-events/` · **Status:** NOT STARTED

### CAR-08 — Carer — Record an expense
- **Dashboard / stream:** carer · **Lane:** C · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-record-expense`
- **Description:** Lets carers record care-related spending, optionally linked to an event, with receipt upload.
- **User value:** Spending is captured when it happens and budgets stay correct (CM-0409).
- **Dependencies:** F0-12, F0-13 · **Blocking decisions:** OQ-19, OQ-04, OQ-05
- **Jira summary:** Record a purchase (amount, bucket, description, receipt) that auto-deducts from the budget (not designed)
- **Acceptance criteria summary:** 2 criteria — remaining becomes $200; it saves and state is 'depleted'
- **Testing summary:** 2 integration
- **Requirements:** REQ-28, REQ-30
- **RETIRED by CHG-020 (PD-058):** carers never change the budget by hand. Do not start.
- **Docs:** `docs/development/carer-dev/carer-record-expense/` · **Status:** RETIRED (CHG-020)

### CAR-09 — Carer — Settings
- **Dashboard / stream:** carer · **Lane:** C · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-settings`
- **Description:** Carer Settings screen for own details and password reset.
- **User value:** Carers keep their contact details current and recover access without help.
- **Dependencies:** F0-07, CAR-UI-04 · **Blocking decisions:** OQ-35
- **Jira summary:** My info (Name, Phone, Email, Role) and 'Reset username / password'
- **Acceptance criteria summary:** 3 criteria — Name 'Aisha Rahman', Phone '0423 987 654', Email 'aisha.r@banksiahomecare.com.au', Role 'Registered Nurse' are shown; RLS/column privileges reject it; a reset email is requested
- **Testing summary:** 1 component, 1 db, 1 integration
- **Requirements:** REQ-01
- **Docs:** `docs/development/carer-dev/carer-settings/` · **Status:** NOT STARTED

### ADM-01 — Admin Home — counts and overdue events
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D8 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-home`
- **Description:** Admin landing screen showing organisation totals and every overdue event across the organisation's clients.
- **User value:** Managers see what needs attention across ~42 clients (accountable).
- **Dependencies:** F0-11, ADM-UI-01 · **Blocking decisions:** OQ-29
- **Jira summary:** Stat cards (Clients, Staff) and 'Overdue events across all clients' list
- **Acceptance criteria summary:** 4 criteria — Clients shows the organisation's client count and Staff the active carer count; a row shows 'Margaret', 'Wound dressing check', 'Aisha R.' and an Overdue pill; they are not included …
- **Testing summary:** 2 integration, 2 component
- **Requirements:** REQ-34
- **Docs:** `docs/development/admin-dev/admin-home/` · **Status:** NOT STARTED

### ADM-02 — Admin — Staff list and add/edit staff
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D8–D9 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-staff`
- **Description:** Admin manages the organisation's carer accounts and job titles.
- **User value:** Organisations manage their own staff (CM-1908).
- **Dependencies:** F0-06, F0-07, ADM-UI-03 · **Blocking decisions:** OQ-08, OQ-13
- **Jira summary:** Staff list (Name · Role · Edit) with '+ Add staff' and an Add/edit panel (Name, Phone, Email, Role)
- **Acceptance criteria summary:** 4 criteria — the new staff member appears in the list with role 'Enrolled Nurse'; an Email error is shown; the panel shows her Name, Phone, Email and Role …
- **Testing summary:** 2 e2e, 1 component, 1 db
- **Requirements:** REQ-06, REQ-08
- **Docs:** `docs/development/admin-dev/admin-staff/` · **Status:** NOT STARTED

### ADM-03 — Admin — Deactivate staff
- **Dashboard / stream:** admin · **Lane:** A · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-staff-deactivate`
- **Description:** Deactivates a carer account so they can no longer access organisation information while their completions remain attributed.
- **User value:** Access is withdrawn when staff leave (CIS5).
- **Dependencies:** ADM-02 · **Blocking decisions:** OQ-36, OQ-19
- **Jira summary:** Withdraw a staff member's access without deleting their recorded work (not designed)
- **Acceptance criteria summary:** 2 criteria — zero rows are returned; those tasks still show 'Done · Marcus C.'
- **Testing summary:** 1 db, 1 integration
- **Requirements:** REQ-06, REQ-N6
- **Docs:** `docs/development/admin-dev/admin-staff-deactivate/` · **Status:** NOT STARTED

### ADM-04 — Admin — Clients list and add client
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-clients`
- **Description:** Admin views the organisation's clients and adds a client with a family contact; admin cannot edit client information (D28).
- **User value:** Organisations onboard the people they care for.
- **Dependencies:** F0-06, ADM-UI-04 · **Blocking decisions:** OQ-07, OQ-08
- **Jira summary:** Client list (Name · Family contact · Remove) and Add client panel (Client name, Family contact name, Family contact email, Notes)
- **Acceptance criteria summary:** 4 criteria — Harold appears in the list with family contact 'Grace'; an error is shown; rows include 'Margaret' with family contact 'Helen' …
- **Testing summary:** 1 e2e, 2 component, 1 integration
- **Requirements:** REQ-07
- **CHG-010 (self-serve sign-up, REQ-36):** clients are created only by families (PD-037, PD-057). This feature becomes the clients list (with Remove per ADM-05) and has no add-client panel. Lane A rewrites its PRD, ACs and TEST_PLAN when it starts.
- **CHG-020 (PD-058, REQ-38):** admins may now edit client information (PD-023 superseded); client names link to ADM-11's client view.
- **Docs:** `docs/development/admin-dev/admin-clients/` · **Status:** NOT STARTED

### ADM-05 — Admin — Remove client
- **Dashboard / stream:** admin · **Lane:** A · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-client-remove`
- **Description:** Implements the Remove link on the Admin client list.
- **User value:** Organisations can stop serving a client cleanly.
- **Dependencies:** ADM-04 · **Blocking decisions:** OQ-06, OQ-07, OQ-19
- **Jira summary:** 'Remove' a client from the organisation without losing the client's records (semantics undecided)
- **Acceptance criteria summary:** 2 criteria — zero rows are returned; all events are returned
- **Testing summary:** 2 db
- **Requirements:** REQ-04, REQ-N6
- **Docs:** `docs/development/admin-dev/admin-client-remove/` · **Status:** NOT STARTED

### ADM-06 — Admin — Manage: staff and client selection
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D9 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-manage-selection`
- **Description:** The left two columns and selection summary of the Admin Manage screen.
- **User value:** Admins pick who to roster to whom quickly (dense but clear).
- **Dependencies:** F0-06, ADM-UI-02 · **Blocking decisions:** None
- **Jira summary:** Manage screen Staff and Clients columns with search, solid selection with check and 'A → B' summary with Clear
- **Acceptance criteria summary:** 4 criteria — both rows are solid-filled with checks and the summary reads 'Aisha Rahman → Margaret'; both selections are removed; only Sarah Nguyen is listed …
- **Testing summary:** 2 component, 2 integration
- **Requirements:** REQ-23
- **Docs:** `docs/development/admin-dev/admin-manage-selection/` · **Status:** NOT STARTED

### ADM-07 — Admin — Assign shift
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-assign-shift`
- **Description:** Assign panel body on Manage: creates a shift for the selected carer and client.
- **User value:** Rostering in a few clicks with overlap awareness but no hard block (D30).
- **Dependencies:** F0-10, ADM-06 · **Blocking decisions:** OQ-09
- **Jira summary:** Date picker with existing-shift dots, time slot chips (07:00–11:00, 11:00–15:00, 15:00–19:00, Custom), soft overlap warning, Assign shift
- **Acceptance criteria summary:** 4 criteria — a shift 07:00–11:00 on 1 Dec exists and a dot appears on 1 Dec; the warning names 11:30–13:00 and Assign shift remains available; a time error is shown …
- **Testing summary:** 1 e2e, 3 component
- **Requirements:** REQ-23
- **Docs:** `docs/development/admin-dev/admin-assign-shift/` · **Status:** NOT STARTED

### ADM-08 — Admin — Manage carer-client assignments
- **Dashboard / stream:** admin · **Lane:** A · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-carer-assignments`
- **Description:** Lets admins end a carer's access to a client independently of shifts.
- **User value:** Clients have the right carers; removed carers lose access (A-3).
- **Dependencies:** ADM-07 · **Blocking decisions:** OQ-09, OQ-19
- **Jira summary:** Remove or reassign carers from clients (not designed)
- **Acceptance criteria summary:** 1 criteria — zero rows are returned
- **Testing summary:** 1 db
- **Requirements:** REQ-05, REQ-06
- **Docs:** `docs/development/admin-dev/admin-carer-assignments/` · **Status:** NOT STARTED

### ADM-09 — Admin — Edit, extend or cancel a shift
- **Dashboard / stream:** admin · **Lane:** A · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-edit-shift`
- **Description:** Supports the client's need to extend a shift when a manager asks a carer to stay longer.
- **User value:** Rosters reflect reality; edit rights follow actual working time.
- **Dependencies:** ADM-07 · **Blocking decisions:** OQ-27, OQ-19
- **Jira summary:** Change shift times, extend a shift by extra hours, or cancel it (not designed)
- **Acceptance criteria summary:** 1 criteria — it returns true
- **Testing summary:** 1 db
- **Requirements:** REQ-24
- **Docs:** `docs/development/admin-dev/admin-edit-shift/` · **Status:** NOT STARTED

### ADM-10 — Admin — Settings
- **Dashboard / stream:** admin · **Lane:** A · **Days:** D10 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-settings`
- **Description:** Admin Settings screen for organisation details and password reset.
- **User value:** Organisation details used across the app stay correct (e.g. header subline, POA/business details per CIS5).
- **Dependencies:** F0-07, ADM-UI-05 · **Blocking decisions:** OQ-35
- **Jira summary:** Organisation info (name, ABN, phone, address) and 'Reset username / password'
- **Acceptance criteria summary:** 3 criteria — 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072' are shown; an ABN error is shown; RLS rejects it
- **Testing summary:** 2 component, 1 db
- **Requirements:** REQ-06
- **Docs:** `docs/development/admin-dev/admin-settings/` · **Status:** NOT STARTED

### ADM-11 — Admin — Client view: a client's Family screens with full access
- **Dashboard / stream:** admin · **Lane:** A · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-client-view`
- **Description:** A client's name in Admin · Clients opens `/admin/clients/<id>/home`, which renders that client's Family screens inside the admin layout with every Family action available; each change names the admin. Added by CHG-020.
- **User value:** Care and money keep being managed when a family is no longer there.
- **Dependencies:** ADM-04, FAM-01, FAM-04, FAM-06, FAM-07, FAM-09, FAM-10, FAM-11, FAM-14, FAM-15 · **Blocking decisions:** None
- **Jira summary:** Admin opens a client and uses the Family screens with full access
- **Acceptance criteria summary:** 5 criteria — the client name opens its Family Home in the admin layout; each screen shows that client; an admin top-up reads "Recorded by <admin>"; admin edits, costed events and ticks save and name the admin; another organisation's admin gets not-found and RLS refuses …
- **Testing summary:** 2 e2e, 2 integration, 1 db + e2e
- **Requirements:** REQ-38, REQ-07, REQ-29
- **Docs:** `docs/development/admin-dev/admin-client-view/` · **Status:** NOT STARTED

## Phase 4 — Integration, hardening & release — feature detail

### INT-01 — Automatic budget threshold emails
- **Dashboard / stream:** shared · **Lane:** B · **Days:** D11–D12 · **Sprint:** STRETCH · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-budget-threshold-emails`
- **Description:** Sends plain-language warning emails without operator input when a bucket reaches each configured threshold.
- **User value:** Delivers the client's repeatedly emphasised requirement that previous groups missed.
- **Dependencies:** F0-12, FAM-10 · **Blocking decisions:** OQ-01, OQ-03, OQ-17, OQ-28
- **Jira summary:** Scheduled server job emails recipients once per threshold per bucket per period when spending crosses thresholds
- **Acceptance criteria summary:** 5 criteria — one email per eligible recipient is sent with the client's name and percentage; no email is sent; they receive no email …
- **Testing summary:** 5 integration
- **Requirements:** REQ-31
- **CHG-020 (PD-058):** also email Family and admins when an event cost goes pending.
- **Docs:** `docs/development/shared/shared-budget-threshold-emails/` · **Status:** NOT STARTED

### INT-02 — End-to-end: organisation transfer journey
- **Dashboard / stream:** family · **Lane:** I · **Days:** D12 · **Sprint:** SPRINT · **PR target:** `family-dev` · **Branch:** `feature/family-organisation-transfer-e2e`
- **Description:** Verifies the full transfer: family changes organisation, old admin and carers lose access, new admin sees the client, history retained.
- **User value:** Proves the highest-risk privacy workflow works across dashboards.
- **Dependencies:** FAM-13, ADM-04, CAR-03 · **Blocking decisions:** OQ-06, OQ-15
- **Jira summary:** E2E + regression tests for Sequence Use Case 1 across Family, Admin and Carer
- **Acceptance criteria summary:** 3 criteria — Margaret is absent, and when Aisha reloads Patients, Margaret is absent; all previous completions still show; Margaret is listed
- **Testing summary:** 3 e2e
- **Requirements:** REQ-04, REQ-N6
- **Docs:** `docs/development/family-dev/family-organisation-transfer-e2e/` · **Status:** NOT STARTED

### INT-03 — End-to-end: carer care delivery journey
- **Dashboard / stream:** carer · **Lane:** I · **Days:** D12 · **Sprint:** SPRINT · **PR target:** `carer-dev` · **Branch:** `feature/carer-care-delivery-e2e`
- **Description:** Carer signs in, opens a rostered patient, completes and (when CAR-07/08 exist) adds a task with cost and documentation; family sees results.
- **User value:** Proves carer actions flow through to the family view.
- **Dependencies:** CAR-06, FAM-01 · **Blocking decisions:** OQ-33
- **Jira summary:** E2E for Sequence Use Case 2 and completion visibility to family
- **Acceptance criteria summary:** 2 criteria — the block shows 'Done · Aisha R.'; it cannot be completed
- **Testing summary:** 2 e2e
- **Requirements:** REQ-18, REQ-19
- **Docs:** `docs/development/carer-dev/carer-care-delivery-e2e/` · **Status:** NOT STARTED

### INT-04 — End-to-end: admin rostering journey
- **Dashboard / stream:** admin · **Lane:** I · **Days:** D12 · **Sprint:** SPRINT · **PR target:** `admin-dev` · **Branch:** `feature/admin-assign-shift-e2e`
- **Description:** Verifies rostering across Admin, Carer and Family dashboards.
- **User value:** Proves shifts drive carer access, notifications and family visibility.
- **Dependencies:** ADM-07, CAR-02, CAR-05, FAM-01 · **Blocking decisions:** OQ-09, OQ-33
- **Jira summary:** E2E for Sequence Use Case 3: admin assigns shift → carer notified and sees shift → family sees carer on day
- **Acceptance criteria summary:** 2 criteria — a notification 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' is listed; a Tuesday block for Margaret is shown
- **Testing summary:** 2 e2e
- **Requirements:** REQ-23, REQ-25, REQ-26, REQ-32
- **Docs:** `docs/development/admin-dev/admin-assign-shift-e2e/` · **Status:** NOT STARTED

### INT-05 — Access-control regression matrix
- **Dashboard / stream:** shared · **Lane:** I · **Days:** D12–D13 · **Sprint:** STRETCH · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-access-control-regression`
- **Description:** A single, maintained suite proving every role can do exactly what it should across all tables and routes.
- **User value:** Protects vulnerable people's health and financial data against regressions.
- **Dependencies:** FAM-15, CAR-06, ADM-07 · **Blocking decisions:** OQ-01
- **Jira summary:** Consolidated role × table × action permission matrix tests and UI 'controls absent' checks
- **Acceptance criteria summary:** 2 criteria — every table has row level security enabled; all are redirected
- **Testing summary:** 1 db, 1 integration
- **Requirements:** REQ-03, REQ-N4, REQ-N5
- **Docs:** `docs/development/shared/shared-access-control-regression/` · **Status:** NOT STARTED

### INT-06 — Accessibility verification across dashboards
- **Dashboard / stream:** shared · **Lane:** I · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-accessibility-verification`
- **Description:** Verifies WCAG 2.1 AA across Family, Carer and Admin screens.
- **User value:** Older and less technical users can use the app (NFR-2, top client complaint).
- **Dependencies:** FAM-15, CAR-09, ADM-10 · **Blocking decisions:** OQ-01
- **Jira summary:** Automated axe checks on every screen, keyboard journey checks, 44px targets and contrast audit; defects raised as features
- **Acceptance criteria summary:** 2 criteria — no serious or critical violations are reported; every step is reachable with visible focus
- **Testing summary:** 2 e2e
- **Requirements:** REQ-N1, REQ-N2
- **Docs:** `docs/development/shared/shared-accessibility-verification/` · **Status:** NOT STARTED

### INT-07 — Scale and performance verification
- **Dashboard / stream:** shared · **Lane:** I · **Days:** — · **Sprint:** POST-SPRINT · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-calendar-scale-performance`
- **Description:** Checks the app remains responsive with unlimited care items over long periods.
- **User value:** Meets 'hundreds of items, no limitation' (brief item 2) and NFR-5.
- **Dependencies:** FAM-14, ADM-01 · **Blocking decisions:** OQ-01
- **Jira summary:** Load large datasets (hundreds of items per client, 42+ clients) and verify calendar, home and task-log response budgets and indexes
- **Acceptance criteria summary:** 1 criteria — p95 duration is under the agreed budget
- **Testing summary:** 1 integration
- **Requirements:** REQ-N8
- **Docs:** `docs/development/shared/shared-calendar-scale-performance/` · **Status:** NOT STARTED

### INT-08 — Release readiness and client handover
- **Dashboard / stream:** shared · **Lane:** I · **Days:** D13 · **Sprint:** STRETCH · **PR target:** `main (per OQ-01 — shared work)` · **Branch:** `feature/shared-release-readiness-handover`
- **Description:** Prepares the application and documentation for release to main and handover to a non-technical client.
- **User value:** The client can keep using and extending the system after the team leaves (NFR-9, CM-0309).
- **Dependencies:** INT-02, INT-03, INT-04 · **Blocking decisions:** OQ-01, OQ-17
- **Jira summary:** Deployment runbook, environment and backup plan, plain-English user guide, glossary and handover pack
- **Acceptance criteria summary:** 2 criteria — every technical term used appears in the glossary; the app deploys and a backup restore succeeds
- **Testing summary:** 2 review
- **Requirements:** REQ-N9, REQ-N11
- **Docs:** `docs/development/shared/shared-release-readiness-handover/` · **Status:** NOT STARTED


---

## 6. Parking lot (not scheduled)
See PRD.md §17. Promotion requires a CHG entry, human confirmation, and new feature docs from `docs/templates/FEATURE_TEMPLATE/`.

## 7. Adding a new feature
1. Propose ID (next number: `FAM-16`, `FAM-UI-09`, `CAR-10`, `ADM-12`, `UI-04`, `INT-09`, `F0-18`), slug `<stream>-<name>`, lane and planned day.
2. Record CHG-xxx in DECISIONS.md; get human confirmation if material.
3. Copy `docs/templates/FEATURE_TEMPLATE/` to `docs/development/<stream>/<slug>/` and complete it.
4. Add the row to §4 and a card to §5; add to `docs/JIRA_BACKLOG.csv`; update root PROGRESS.md.
