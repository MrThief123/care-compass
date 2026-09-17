# ARCHITECTURE — Care Compass

Version 0.2 · 17 September 2026 (plan v0.2: data-source adapter, lane folder ownership) · Status: **VALIDATED against the repository in F0-01 (see docs/VALIDATION_REPORT.md)**
Labels: **CONFIRMED** = decided in source material (ADRs, team/client meetings, designs) · **PROPOSED** = this plan's proposal · **UNKNOWN / HUMAN DECISION REQUIRED** = see DECISIONS.md.

---

## 1. Overview

```
Browser (Family | Carer | Admin dashboards)
   │  HTTPS
   ▼
Next.js App Router (TypeScript)                       CONFIRMED (ADR-02)
   ├─ Server Components  → reads                      PROPOSED pattern
   ├─ Server Actions     → UI mutations               PROPOSED pattern
   ├─ Route Handlers     → external triggers only     PROPOSED pattern
   └─ proxy.ts (Next 16; `middleware.ts` on older versions)      → session refresh (@supabase/ssr)  CONFIRMED (ADR-02)
   │  user JWT forwarded (never service role)          CONFIRMED (ADR-02 Part 3)
   ▼
Supabase                                               CONFIRMED (ADR-01)
   ├─ Postgres + Row Level Security (authorisation)     CONFIRMED (ADR-01, ADR-03)
   ├─ Postgres functions for atomic multi-table writes CONFIRMED (ADR-02 consequence)
   ├─ Auth (email/password; MFA for admins?)           CONFIRMED platform; method OQ-08
   └─ Storage (private client-documents bucket)        CONFIRMED platform; policies PROPOSED
Scheduled job runner → /api/jobs/* (service role)      CONFIRMED (TM-2808; runner: Vercel Cron or pg_cron, PD-050)
Email provider                                         CONFIRMED (Resend or Supabase SMTP, PD-050)
Hosting                                                CONFIRMED (Vercel + Supabase paid tier, PD-050)
```

Repository state: **CONFIRMED by F0-01 inspection (17 Sep 2026)**. The human's report is accurate: Next.js 16.3.3 App Router scaffold (`src/app/` only — `layout.tsx`, `page.tsx`, default styling), npm as package manager (`package-lock.json`), TypeScript 5 strict, Tailwind v4, ESLint (`eslint-config-next`, no custom rules yet), no `supabase/` directory, no test framework installed (Vitest/Playwright/pgTAP all still to be added). A basic GitHub Actions workflow does exist (`.github/workflows/ci.yaml`: install, `npm audit`, lint, `tsc --noEmit`, build) but it has no Supabase schema, no RLS tests, and no commitlint step — the team meeting 4/9 claim of a live repo with CI, Supabase schema and RLS tests for all four roles does **not** hold; per OQ-20 (ANSWERED, PD-031) this repository is authoritative and there is no existing Supabase project to adopt. The archived Confluence "Tech Stack" page (MongoDB) is superseded by ADR-01. Full check-by-check evidence: `docs/VALIDATION_REPORT.md`.

---

## 2. Technology decisions

| Concern | Choice | Label | Source |
|---|---|---|---|
| Framework | Next.js App Router | CONFIRMED | ADR-02, TM-2808 |
| Language | TypeScript (strict) | CONFIRMED | TM-2808 |
| Styling | Tailwind CSS | CONFIRMED | ADR-02 |
| Component base | shadcn/ui restyled with Figma tokens | CONFIRMED | ADR-02 |
| Font | IBM Plex Sans | CONFIRMED | UI-D22, FIG |
| Database | Supabase Postgres | CONFIRMED | ADR-01 |
| Authentication | Supabase Auth | CONFIRMED | ADR-01, ADR-03 |
| Authorisation | RLS policies + role/assignment tables | CONFIRMED | ADR-03 |
| Supabase integration | @supabase/ssr session forwarding | CONFIRMED (ADR-02 notes team confirmation pending) | ADR-02 |
| File storage | Supabase Storage | CONFIRMED | ADR-01 |
| Lint/format | ESLint + Prettier | CONFIRMED | TM-2808 |
| Commits | Conventional Commits (commitlint step PROPOSED — not yet in `.github/workflows/ci.yaml`) | CONFIRMED convention; CI enforcement PROPOSED | TM-0409; F0-01 |
| CI | GitHub Actions: lint, typecheck, build, dependency audit (`npm audit`) all CONFIRMED present in `.github/workflows/ci.yaml`; test step scaffolded but commented out pending a test framework | CONFIRMED (partial — see VALIDATION_REPORT.md) | TD, TM-2808; F0-01 |
| Unit/component tests | Vitest + Testing Library + jest-axe/axe-core | PROPOSED | TD (unit tests), PD-014 |
| DB/RLS tests | pgTAP via `supabase test db` | PROPOSED | TM-2808 (integration tests for policies) |
| E2E | Playwright | PROPOSED | TM-2808 (e2e for journeys) |
| Validation | Zod (single library) | PROPOSED | PD-015 |
| Dates/recurrence | date-fns + @date-fns/tz; in-house rule expander | PROPOSED | TM-2108, ADR-01 |
| Dependency security | npm audit + Dependabot | PROPOSED | TD ("X-ray", OQ-23) |
| Email | Provider adapter (Resend/SMTP) | CONFIRMED | PD-050 (OQ-17) |
| Scheduler | Vercel Cron or pg_cron → protected Route Handler | CONFIRMED | PD-050 (OQ-17) |
| Hosting | Vercel + Supabase paid tier | CONFIRMED | PD-050 (OQ-17), NFR-8, ADR-01 |

---

## 3. Frontend architecture (PROPOSED structure; CONFIRMED principles)

### 3.1 Directory layout
```
src/
  app/
    (auth)/sign-in/  (auth)/reset-password/
    (family)/family/[clientId]/{home,info,calendar,budget,settings,tasks,tasks/[occurrenceKey],events/new,events/[eventId]/edit}/
    (carer)/carer/{home,patients,patients/[clientId],calendar,settings}/
    (admin)/admin/{home,manage,staff,clients,settings}/
    api/jobs/<job>/route.ts
    layout.tsx  globals.css
  components/
    ui/          shadcn primitives restyled with tokens + lucide-react icons (F0-14)
    shared/      cross-dashboard composites, owned by lane S: app shell/rail/page-header (F0-15), calendar/* (UI-01), forms/* incl. event-form layout, side-panel-form, confirmation-modal (UI-02), lists/cards incl. data-table, activity-row, stat-card, budget-bucket-card, task-checklist, client-info-view (UI-03)
  features/<feature-area>/   screen-specific components (family-home, carer-home, admin-manage …)
  server/<domain>/           queries.ts · actions.ts · schemas.ts   (auth, clients, events, shifts, budget, documents, staff, notifications, email)
  server/jobs/               service-role jobs (only place allowed to import the admin client)
  lib/
    supabase/{browser,server,proxy}.ts  database.types.ts
    recurrence/  dates/  money/  env.ts
  styles/tokens.css         Tailwind v4 `@theme` tokens (F0-05)
  types/domain.ts           shared domain types used by screens and contracts (UI-00)
  mocks/                    design fixtures + dev-only current user (UI-00); never imported by app/ or features/
  server/data-source.ts     selects mock | supabase implementation from DATA_SOURCE (UI-00)
proxy.ts                    session refresh / route protection (Next.js 16 name for middleware; F0-04/F0-07)
supabase/
  migrations/  tests/  seed.sql  config.toml
tests/
  integration/  e2e/
docs/ …
```

### 3.2 Principles
- **Data-source adapter (PROPOSED, PD-028):** screens never import fixtures or Supabase directly. They call contract functions in `src/server/<domain>/queries.ts` whose signatures and return types are fixed in UI-00. `src/server/data-source.ts` routes each call to the mock implementation (`src/mocks/fixtures.ts`, built from design content) or the Supabase implementation, chosen by `DATA_SOURCE=mock|supabase`. Phase 1 screens run on `mock`; each Phase 3 wiring feature implements the Supabase side for its functions and flips its tests to integration. `getCurrentUser()` is mocked in `src/mocks/current-user.ts` (throws when `NODE_ENV=production`) until F0-07 replaces it with the real session.
- **Folder ownership by lane (PROPOSED, PD-027):** see CLAUDE.md §4.2. Dashboard features never edit `src/components/shared/**` or `src/components/ui/**`; they request changes from lane S.
- **Three portals** (CONFIRMED FR-5.4, DD): separate route groups and layouts per role; no shared UI with hidden controls. Shared *components* are allowed.
- **Controls absent, not disabled** for role restrictions (DD §8 NFR-3).
- **Server-first**: pages are Server Components that fetch through `src/server/<domain>/queries.ts`. Client Components only for interactivity (checkbox toggles, pickers, forms).
- **State management** (PROPOSED): server state via RSC + `revalidatePath`/`revalidateTag`; URL search params for view state (calendar view/date, filters, selections); local React state for transient UI; `useOptimistic` for ticks. **No global client store.**
- **Forms**: native `<form action={serverAction}>` + Zod schema shared between client hints and server validation; field errors returned as typed results.
- **Accessibility**: Radix/shadcn semantics, focus-visible ring, 44px targets, axe in component tests.

### 3.3 Design system mapping
Tokens from Figma "01 · Foundations" (CONFIRMED values):
- Colour: `bg/canvas #E9F8FA`, `bg/surface #FEFEFE`, `bg/inset #E9F8FA`, `bg/brand #0C9BA9`, `bg/brand-deep #07727D`, `bg/brand-light #49B7BF`, `bg/brand-pale #C6EAEF`, `bg/muted #8DB8C8`, `bg/accent #E69A81`, `bg/alert #FDF1EC`, `bg/alert-badge #F7C4B4`, `bg/alert-strong #B5543A`, `text/primary #1F282D`, `text/secondary #696E6A`, `text/muted #8DB8C8`, `text/brand #07727D`, `text/alert #B5543A`, `text/alert-strong #8A3A24`, `text/on-dark #FEFEFE`, `border/subtle #E9F8FA`, `border/default #D7F2F4`, `border/brand #07727D`, `border/alert #E8A98F`.
- Type: Title/Page 20/26·500; Title/Section 16/22·500; Title/Card 15/20·500; Metric/Large 22/28·500; Metric/Medium 18/24·500; Body/Emphasis 14/20·500; Body/Default 14/20·400; Body/Small 13/18·400; Body/Secondary 12/16·400; Label/Caps 11/14·400 uppercase 0.06em.
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Radius: pill, control, card, full (numeric values from UI-§5.3: pill 5–6, control 7–8, card 10, inset 8 — Figma variable values not exposed via MCP; confirm in F0-01).
- Layout: frame 1440×1024; rail 88px (gradient #07727D→#0C9BA9, items in top ~43%); header 76px; content padding 20/26; card gap 16–18; list row 50; calendar hour row 44; Family Home right column 340; Admin Manage selection columns 290.
- Rules: white text never on #0C9BA9; coral never a fill behind text; status never colour alone.

---

## 4. Backend architecture

- **No separate API server** (CONFIRMED ADR-02). Business logic in TypeScript under `src/server`, executed in Server Components/Actions/Route Handlers.
- **Atomic multi-table operations** as Postgres functions called via RPC (CONFIRMED ADR-02): `set_occurrence_done`, `add_funds`, `record_expense`, `transfer_client_organisation`, staff deactivation, shift overlap query.
- **Result shape** (PROPOSED): server actions return `{ ok: true, data } | { ok: false, error: { code, message, fieldErrors? } }`; never throw to the client for expected failures.
- **Jobs**: `src/server/jobs/*` executed by `POST /api/jobs/<name>` requiring header `x-job-secret`; idempotent by database constraints.

---

## 5. Authentication and authorisation

### 5.1 Authentication
- Supabase Auth email + password (PROPOSED; CIS5 mentions email/password; Settings designs send reset links) — OQ-08.
- Password reset via emailed link (design: "We'll email you a secure link to reset your credentials").
- Invitations for new staff/family — UNKNOWN (OQ-07, OQ-08).
- MFA for Admin — AMBIGUOUS (NFR-3 "should be supported", TM-2108 "Must", ADR-03 "enforced or strongly prompted") — OQ-08.

### 5.2 Authorisation model (CONFIRMED approach, PROPOSED details)
- `profiles.role ∈ {family, carer, admin}` read live in policies (ADR-03).
- Family access: `client_family_members` link.
- Admin access: `clients.organisation_id = profile.organisation_id`.
- Carer read access: active row in `carer_client_assignments` (definition OQ-09).
- Carer write access: `carer_on_active_shift(client_id)` (CM-0409).
- Admin cannot edit client info (UI-D28).
- Helper functions: `current_profile()`, `is_family_of()`, `is_admin_of_client()`, `is_assigned_carer()`, `carer_on_active_shift()` — `SECURITY DEFINER`, `STABLE`, `SET search_path = public`.
- Route-group layouts also check role server-side for UX redirects; **RLS remains the security boundary**.

### 5.3 Organisation transfer (CONFIRMED semantics UI-D24, ADR-03)
One transaction: set new organisation → end active carer assignments → cancel shifts starting after now → audit. Routines, events, budgets, documents and history retained. Outgoing admin/carers lose access immediately because policies read live data.

---

## 6. Data architecture (PROPOSED schema; supersedes Confluence "Database Model" ERD)

The Confluence ERD (Organisation, Carer, Shift, Shift_has_Carer, Clients, Budgets, Care Needs Item, Documents, Transaction) is **superseded**: it uses INT money, lacks users/family/roles, recurrence, completions history and audit, contradicting ADR-01 consequences (PD-024).

| Table | Purpose | Introduced by |
|---|---|---|
| organisations | Service provider organisation details (name, ABN, phone, address) | F0-06 |
| profiles | 1:1 with auth.users; role, organisation, names, contact, job_title, is_active | F0-06 |
| clients | Person receiving care; current organisation_id; DOB; suburb; avatar | F0-06 |
| client_family_members | Family authority links | F0-06 |
| carer_client_assignments | Carer ↔ client access periods | F0-06 |
| audit_log | Append-only change log | F0-08 |
| shifts | Carer–client time windows (no recurrence) | F0-10 |
| care_events | Event series or one-off (title, description, start, duration, recurrence) | F0-11 |
| care_event_overrides | Cancel/modify single occurrence | F0-11 |
| care_event_completions | Append-only done/undone history with actor snapshot | F0-11 |
| budget_buckets | Per-client funding bucket and period | F0-12 |
| budget_fund_entries | Append-only top-ups (History) | F0-12 |
| budget_expenses | Spending, optionally linked to event and receipt | F0-12 |
| documents | Metadata for stored files (client or event) | F0-13 |
| client_info_sections | Description / Habits / Medical history | F0-06 (moved from FAM-09 in plan v0.2 so Carer and Admin wiring don't depend on Family) |
| carer_notifications | In-app notifications for carers | CAR-02 |
| budget_threshold_notifications | Idempotency of threshold emails | INT-01 |

### 6.1 Conventions (PROPOSED)
- `uuid` primary keys (`gen_random_uuid()`), `snake_case`, plural table names, `created_at timestamptz default now()`, `updated_at` via trigger.
- Money `numeric(12,2)`; percentages computed in SQL.
- Soft retirement (`is_active`, `detached_at`, `cancelled_at`) instead of deletes for care data (FR-1.2, NFR-6).
- RLS enabled in the same migration as table creation; pgTAP test file per migration area.
- Attach `audit_row_change()` trigger to every client-scoped table.
- Indexes: `(client_id, starts_at)` on events; `(event_id, original_start)` on overrides/completions; `(carer_id, starts_at)` and `(client_id, starts_at)` on shifts; `(bucket_id)` on entries/expenses.
- Generated types committed at `src/lib/supabase/database.types.ts` (`npm run db:types`).

### 6.2 Recurrence (CONFIRMED approach TM-2108, ADR-01)
Rules stored on `care_events.recurrence`; occurrences generated on demand for a requested range by `src/lib/recurrence`; per-occurrence exceptions in `care_event_overrides`; completions keyed by `(event_id, original_start)`. No pre-generated lifetime rows. Occurrence key = `${eventId}:${originalStartISO}`.

### 6.3 Status derivation (CONFIRMED set UI-D18; rule PROPOSED, OQ-10)
`done` if latest completion action is `done`; else `overdue` if now ≥ occurrence due time; else `planned`.

---

## 7. API conventions (PROPOSED)
- Reads: `src/server/<domain>/queries.ts` exporting typed async functions taking a Supabase server client.
- Mutations: `src/server/<domain>/actions.ts` Server Actions (`'use server'`), validate with Zod, call Supabase (RPC for multi-table), `revalidatePath`, return result object.
- Route Handlers: `src/app/api/jobs/*` only; JSON; 401 without secret; idempotent.
- Naming: verbs for actions (`createEvent`, `setOccurrenceDone`), nouns for queries (`getOccurrences`, `getBudgetSummary`).
- Errors: codes `VALIDATION`, `UNAUTHORISED`, `NOT_FOUND`, `CONFLICT`, `UNEXPECTED`; messages plain English.

---

## 8. External integrations
| Integration | Status | Notes |
|---|---|---|
| Supabase | CONFIRMED | Local via Supabase CLI; no hosted project exists to adopt — provision new (PD-031, OQ-20) |
| Email provider | CONFIRMED | Resend or Supabase SMTP (PD-050, OQ-17); adapter interface in `src/server/email`; test double in tests |
| Scheduler | CONFIRMED | Vercel Cron or pg_cron (PD-050, OQ-17); calls job endpoints |
| Figma MCP | CONFIRMED (development tooling) | Still only page "01 · Foundations" visible — re-confirmed by F0-01 on 17 Sep 2026 (OQ-19, ANSWERED); build remaining screens from tokens + `docs/design/screens/*` per PD (OQ-19) |

---

## 9. Key data flows
1. **View Family Home** → layout verifies role → `getOccurrences(clientId, today)` (RLS) → expand rules → merge overrides/completions/shift assignee → render; `getBudgetSummary(clientId)`.
2. **Tick task** → Server Action → RPC `set_occurrence_done` (authorises family or on-shift carer, inserts completion, audit) → revalidate.
3. **Assign shift** → overlap query (warning) → insert shift (RLS admin) → trigger creates carer notification (CAR-02) → assignment ensured (OQ-09).
4. **Record expense** → RPC `record_expense` → summary recalculated → threshold job later emails once per threshold/period.
5. **Change organisation** → RPC `transfer_client_organisation` → next requests by old org return no rows.
6. **Upload document** → Server Action validates → Storage upload → documents row → signed URL on view.

---

## 10. Deployment architecture (CONFIRMED stack, PD-050; environments PROPOSED)
Vercel + Supabase paid tier (PD-050, OQ-17). Environments PROPOSED: `local` (Supabase CLI + seed), `preview` (per PR, seeded demo project), `staging` (dev branches), `production` (`main`). Brief requires accessibility "on a Microsoft based computer … accessed by others" — satisfied by a hosted web app used from Windows browsers (PROPOSED interpretation; confirm). NFR-8 (99.9%, daily backups, 1-hour redeploy) requires paid tiers (now confirmed available, PD-050).

---

## 11. Testing architecture
See `TESTING.md`. Layers: unit (pure logic) → component (UI + axe) → integration (server functions against local Supabase) → db (pgTAP RLS/functions) → e2e (Playwright journeys per role).

---

## 12. Engineering standards

### 12.1 Naming
- Files/folders: kebab-case (`status-pill.tsx`). React components: PascalCase exports. Hooks: `useX`. Server actions: verb camelCase. SQL: snake_case. Feature slugs: `<stream>-<feature>`.
- Test files beside source (`*.test.ts[x]`) for unit/component; `tests/integration`, `tests/e2e`, `supabase/tests` otherwise.

### 12.2 File organisation and component structure
- One exported component per file; props typed with `type Props`.
- Screen components compose shared components; no data fetching inside shared presentational components.
- No barrel files re-exporting whole directories (tree-shaking and circular import risk).

### 12.3 Functions and separation of concerns
- Pure logic (dates, recurrence, money formatting, layout maths) in `src/lib` with unit tests.
- I/O in `src/server`. UI in `src/components`/`src/features`.
- Guideline < 40 lines per function; extract when branching grows.

### 12.4 Type safety and validation
- `strict`, `noUncheckedIndexedAccess`. Generated DB types. Zod at every trust boundary (form input, route handler body, env).

### 12.5 Error handling and logging
- Expected failures → typed result; unexpected → caught at action boundary, logged with feature tag and request id, generic user message.
- Next.js `error.tsx` per route group using the ErrorState design; `not-found.tsx` for invalid ids.
- Never log PII, medical text, tokens or document names.

### 12.6 Security
- RLS first; service role only in jobs; no secrets in client; signed URLs; parameterised queries (Supabase client/RPC); CSP headers (PROPOSED in INT-05); dependency audit in CI.

### 12.7 Dependencies
- Add only with a feature DECISIONS entry; prefer existing stack; pin via lockfile; Dependabot weekly.

### 12.8 Configuration and environments
- All env vars declared in `src/lib/env.ts` and `.env.example`; public vars prefixed `NEXT_PUBLIC_`; no runtime reading of undeclared env.

### 12.9 Documentation
- Feature docs kept current (CLAUDE.md §4). Plain-English user-facing docs (CIS1 #4). ADR-style entries in DECISIONS.md for architectural changes.

### 12.10 Git and code review
- CLAUDE.md §3, §7; docs/DEVELOPMENT_WORKFLOW.md §4, §7, §8. Reviewers check: scope, tests-first evidence, RLS tests, tokens usage, accessibility, docs updated.

---

## 13. Security boundaries
| Boundary | Enforced by |
|---|---|
| Browser ↔ server | HTTPS; session cookies (httpOnly); Zod validation |
| Server ↔ database | User JWT forwarded; RLS policies; RPC functions with explicit checks |
| Jobs ↔ database | Service role (isolated module); secret-protected endpoint |
| Storage | Private bucket; storage policies; short-lived signed URLs |
| Organisations | Policies read current `clients.organisation_id` live |
| Audit | Append-only table; no update/delete grants |

---

## 14. Open architecture questions
OQ-01 (branching for shared work — plan v0.2 assumes shared PRs to `main`), OQ-08 (auth/MFA/invites), OQ-09 (carer access), OQ-17 (hosting/email/scheduler), OQ-20 (existing repo/infra), OQ-26 (file limits), OQ-33 (carer calendar semantics). See DECISIONS.md.
