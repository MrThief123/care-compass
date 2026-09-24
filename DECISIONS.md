# DECISIONS — Care Compass

This file holds: (1) planning-freeze status, (2) recorded project decisions (PD-xxx), (3) open decisions needing a human (OQ-xx), (4) the source-conflict register, and (5) controlled changes (CHG-xxx).
Feature-level decisions live in each feature's `DECISIONS.md`.

---

## 1. Planning freeze
Status: **FROZEN** — declared 2026-09-17 by Dhruv Verma, approving `docs/VALIDATION_REPORT.md` (F0-01, merged to `main` in PR #5). Gate **G1 — Plan validated** is satisfied. The planning pack (`PRD.md`, `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`, feature docs) is now authoritative and controlled per CLAUDE.md §9 — changes go through a `CHG-xxx` entry or a recorded decision, not ad hoc edits. F0-02 and other features listing only F0-01 as a dependency are now startable subject to their own dependencies and decisions.

---

## 2. Recorded project decisions

Format: ID · date · context · decision · reason · alternatives · consequences · human confirmation.

### PD-001 — Technology stack
- Date: 2026-08-28 (team) · recorded 2026-09-17
- Context: Relational, security-critical care and finance data; one-semester delivery.
- Decision: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, Storage, RLS).
- Reason: ADR-01 (relational integrity, exact money, RLS, built-in auth/storage), ADR-02 (one language, server layer, accessible components).
- Alternatives: MongoDB (rejected), plain Postgres (rejected), Vite SPA (rejected), MUI/Mantine (rejected), NextAuth (rejected ADR-03).
- Consequences: RLS policies are security-critical code; money numeric; multi-table writes in Postgres functions.
- Human confirmation: CONFIRMED by team (TM-2808, ADR-01–03).

### PD-002 — Authorisation lives in the database
- Date: 2026-08-28 / 2026-09-06 · Decision: RLS is the source of truth; Next.js forwards the user session via @supabase/ssr; the service-role key is used only in isolated jobs (and, if OQ-08 requires, an isolated account-provisioning module).
- Reason: ADR-02 Part 3, ADR-03. Alternatives: service-role + app checks (rejected). Consequence: pgTAP negative tests for every role. Confirmation: CONFIRMED (ADR-02 notes whole-team confirmation of session forwarding was pending — re-confirm in F0-01).

### PD-003 — Money and financial writes
- Decision: `numeric(12,2)`; arithmetic in SQL; atomic RPC functions. Source: ADR-01/02. CONFIRMED.

### PD-004 — Recurrence as rules + on-demand expansion + overrides
- Decision: Store rules, generate occurrences per range, store per-occurrence overrides; never pre-generate lifetime rows. Source: TM-2108, ADR-01. CONFIRMED.

### PD-005 — Completion history is append-only
- Decision: Completions are inserted, never updated/deleted. Source: TM-0409. CONFIRMED.

### PD-006 — Audit log is append-only and database-enforced
- Source: ADR-01, FR-10.3. CONFIRMED.

### PD-007 — Source precedence (PROPOSED — confirm in F0-01)
When sources conflict, the default precedence is: (1) latest client statements (client meeting minutes the client confirmed; Client Information Sheets by date) → (2) designs and UI Spec v3 decisions shown to the client → (3) ADRs → (4) user stories v3 / use cases → (5) Product requirements page → (6) topic proposal baseline. Material conflicts are **never** resolved silently; they are logged in §4 and, if they affect behaviour, raised as OQ-xx. User stories v1 and v2 are superseded by v3 (Confluence marks them "no longer relevant").

### PD-008 — Three separate dashboards; controls absent not disabled
- Source: FR-5.4, DD §8, UI-§4. CONFIRMED.

### PD-009 — Git branching model
- Decision: `main` production; `family-dev`, `carer-dev`, `admin-dev` integration; `feature/<dashboard>-<feature>` from the dev branch; PRs only; humans merge. Source: user constitution. CONFIRMED. Shared-work exception pending OQ-01.

### PD-010 — Tests-first development mandatory
- Source: user constitution; TM-0409 ("write tests for access policies before the interface exists"). CONFIRMED.

### PD-011 — Phase order Family → Carer → Admin (SUPERSEDED by PD-026)
- Original reason: UI Spec §4 build order; Family owns the client record and events. Superseded 2026-09-17 when the human asked for a parallel, UI-first plan. The Family → Carer → Admin order now applies only when a team cannot staff all dashboard lanes. OQ-02 remains OPEN.

### PD-012 — Design tokens from Figma Foundations
- Decision: Tokens, type ramp, spacing, radius and rail gradient from Figma "01 · Foundations" are the single visual source. CONFIRMED (FIG, DD §6).

### PD-013 — Status set Planned / Done / Overdue; Done shows actor
- Source: UI-D18, D33. CONFIRMED. Derivation rule pending OQ-10.

### PD-014 — Test tooling (PROPOSED)
- Decision: Vitest + Testing Library + axe; pgTAP via Supabase CLI; Playwright. Alternatives: Jest (slower ESM/TS), Cypress (heavier multi-context). Confirmation: validate in F0-01/F0-02.

### PD-015 — Single validation library: Zod (PROPOSED)

### PD-016 — Server Components for reads, Server Actions for UI mutations, Route Handlers only for external triggers (PROPOSED)

### PD-017 — Parking lot for confirmed-but-undesigned requirements (PROPOSED)
- Decision: Requirements without design or agreed priority are listed in PRD §17 and not scheduled; promoting one requires a CHG entry and new feature docs from the template.

### PD-018 — Organisation transfer semantics
- Decision: Retain routines, events, budget, documents, history; clear nurse assignments and future shifts; outgoing organisation loses access immediately. Source: UI-D24, D36, ADR-03. CONFIRMED (mechanism/initiator OQ-06).

### PD-019 — Carer access: read while assigned, edit during active shift
- Source: CM-0409 (client-confirmed, later than UI-D29). CONFIRMED principle; details OQ-09.

### PD-020 — Confirmed descopes and behaviours
- No completion approval workflow (CM-0309, supersedes CIS5 "supervisors confirm").
- Spending never blocked; flagged instead (CIS5 Q&A, TM-2808).
- Purchase verification out of scope (CM-0409).
- Funding-source-specific spending rules out of scope (CM-0309).
CONFIRMED.

### PD-021 — Budget notifications are email only (UI-D23). CONFIRMED.

### PD-022 — No recurring shifts (UI-D31). CONFIRMED.

### PD-023 — Admin cannot edit client information (UI-D28). CONFIRMED by design; creation flow OQ-07.

### PD-024 — Confluence "Database Model" ERD superseded (PROPOSED)
- Reason: integer money, no user/family/role tables, no recurrence/completions/audit — contradicts ADR-01 consequences. ARCHITECTURE.md §6 replaces it.

### PD-025 — Rostering in scope despite OOS-5 (PROPOSED; confirm OQ-21)
- Reason: later client meetings (19/8, 3/9, 4/9) and the Manage design include shift assignment.

### PD-026 — Plan v0.2: UI first, parallel lanes, 2-week sprint (HUMAN REQUEST)
- Date: 2026-09-17 · Requested by: human (project lead)
- Context: Two weeks available. The v0.1 dashboard-by-dashboard phases serialised work that could run at once.
- Decision: Five phases across six lanes (S shared kit, B backend, F family, C carer, A admin, I integration). Phase 0 shared kit + data contracts (D1–D4) → Phase 1 all screens on fixtures, three dashboards in parallel (D4–D7) → Phase 2 backend in parallel (D2–D7) → Phase 3 data wiring in parallel (D8–D11) → Phase 4 integration (D11–D14). Features are bucketed SPRINT / STRETCH / POST-SPRINT.
- Reason: the human asked for UI first with dashboards worked on at the same time. The plan adds two things the request didn't mention. The shared kit comes first so three lanes don't build three calendars. The backend runs alongside the UI because it is the longest-running risk.
- Alternatives: v0.1 sequential phases (too slow); screens without a kit (duplicate components, merge conflicts); backend after UI (risk found too late).
- Consequences: feature dependencies rewritten (DEVELOPMENT_PLAN.md v0.2); shared components moved into UI-01..03; `client_info_sections` moved from FAM-09 to F0-06; phase-end releases replaced by continuous sync and checkpoints D7/D10/D12.
- Human confirmation: requested by the human 2026-09-17; the details are PROPOSED until F0-01 validation is approved.

### PD-027 — Multi-person coordination from one shared plan (PROPOSED)
- Date: 2026-09-17
- Context: More than one person runs Claude Code against the same plan at the same time.
- Decision: a feature is claimed by pushing its branch and committing `Owner:` in its PROGRESS.md. Folders are owned per lane (CLAUDE.md §4.2). Per-feature state files are edited only on their branch. The root PROGRESS status section is generated by `scripts/plan-status.mjs --write` on `main` only. Worktrees are used for parallel sessions. Only lane B resets the local database.
- Reason: avoids duplicate work and merge conflicts on shared status files.
- Alternatives: hand-maintained status table (constant conflicts); Jira as the only source of truth (AI sessions can't read it reliably).
- Human confirmation: pending (F0-01 review).

### PD-028 — Data-source adapter for fixtures → Supabase (PROPOSED)
- Date: 2026-09-17
- Decision: screens call typed contract functions in `src/server/<domain>/queries.ts`. `src/server/data-source.ts` selects `mock` (design fixtures in `src/mocks/`) or `supabase` via `DATA_SOURCE`. Wiring features replace mock implementations without changing screen code. `src/mocks/**` may not be imported by `src/app` or `src/features` (lint rule); `src/mocks/current-user.ts` throws in production.
- Reason: lets screens be finished before the database exists, with the same data shapes.
- Alternatives: hard-coded props in screens (rework at wiring); MSW network mocks (no network layer exists — Server Components call functions directly).
- Human confirmation: pending (F0-01 review).

### PD-029 — No AGENTS.md; Next.js agent rules live in CLAUDE.md §14 (HUMAN REQUEST)
- Date: 2026-09-17 · Requested by: human
- Decision: delete `AGENTS.md` and the `@AGENTS.md` import. CLAUDE.md §14 carries the rule to read `node_modules/next/dist/docs/` before writing Next.js code. If `next dev` re-creates AGENTS.md, delete it again and add it to `.gitignore` (F0-02).
- Human confirmation: requested by the human 2026-09-17.

### PD-030 — Shared-work branch parent and naming: Option B
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-01)
- Decision: shared/cross-cutting work (Phase 0 foundation kit, Phase 4 integration) uses `feature/shared-<name>` branched from `main`, PR back to `main` with mandatory human review; `main` is then merged into all three dashboard dev branches per §3.4.
- Reason: matches CLAUDE.md's recommended default (Option B); avoids routing shared work through a single dashboard's dev branch.
- Alternatives: Option A — host shared work in `family-dev` as `feature/family-shared-<name>`, promote via release (rejected — adds an extra promotion step with no offsetting benefit here).
- Consequences: `feature/shared-*` branches may now be created. Gate 0 requirement for OQ-01 is satisfied.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-031 — Repository is authoritative; no existing Supabase project to adopt
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-20)
- Decision: the current repository (empty Next.js scaffold) is treated as the actual starting state. There is no existing Supabase project, schema, or CI to adopt; the 4/9 team-meeting report of a live repo with RLS tests for all four roles does not apply here.
- Reason: human confirmation supersedes the team-meeting report (PD-007 source precedence: client/human confirmation outranks internal meeting notes for state-of-the-world facts).
- Alternatives: adopt an existing Supabase project (rejected — none exists); investigate further before deciding (unnecessary — human gave a direct answer).
- Consequences: F0-01/F0-02 proceed by provisioning Supabase from scratch, not by importing an existing schema. The archived Confluence "Tech Stack" (MongoDB) and the 4/9 meeting report are both superseded for infra purposes.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-032 — Budget alert thresholds: 75 / 85 / 100
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-03)
- Decision: budget bucket alert thresholds are 75% (first warning), 85% (second warning), 100% (exhausted). The UI Spec D4 mockup value of 70/90/100 is a design inaccuracy, not the source of truth.
- Reason: Client Information Sheet 3 and user stories P-18/UC-F02 outrank the UI mockup (PD-007 source precedence: client-confirmed sources over designs shown but not confirmed).
- Alternatives: 70/90/100 (rejected, UI-only); per-client/per-bucket configurable thresholds (rejected — not asked for, adds scope).
- Consequences: thresholds implemented as a single configuration constant, not per-bucket. Design D4 and the bucket card states should be corrected to show 75/85/100 (flag to design owner). Resolves C-01.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-033 — Funding model: three fixed buckets, no categories (MVP)
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-04)
- Decision: MVP funding model is per-client buckets of kind NDIS / Fixed / Government, one accounting period each, no categories/subcategories, no source-specific spending restrictions.
- Reason: matches the current design (three fixed buckets) and CM-0309's descope of funding rules; avoids building an undesigned, unconfirmed full funding model (Pension/NDIS/Disability Trust/Family & other with restrictions) from the original brief.
- Alternatives: full brief model with multiple sources, categories and restrictions (rejected — larger scope, not designed, Client Information Sheet No 4 on budgeting was never supplied).
- Consequences: categories/restrictions/multiple funding sources go to the parking lot (PL-10). F0-12, FAM-03, FAM-10, FAM-11, CAR-08 proceed against the 3-bucket model.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-034 — Fund/budget edit rights: Family and organisation admins can both edit
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-05)
- Decision: both Family and the client's current organisation admins can add funds and edit budgets (not admin-read-only). Carers continue to record expenses during their shifts (unchanged from the proposed default — not contested). Budget History shows both top-ups and expenses, each attributed to the actor who recorded it.
- Reason: CM-0409 ("organisations can edit family budgets") is a later client source than UI-D1 ("only Family adds funds"); PD-007 source precedence favours the later client confirmation.
- Alternatives: Family-only edit rights per UI-D1 (rejected — superseded by CM-0409); admin read-only per the original proposed default (rejected by human).
- Consequences: the Admin Budget screen needs edit controls, not just read access — the "Update" interaction UI-D19 flagged as undesigned still needs a design (raise as a design gap alongside OQ-19). RLS policies must allow admin writes to budget tables for their organisation's clients. Resolves C-02.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-035 — Budget email recipients: Family + current org admins; period = bucket period
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-28)
- Decision: budget warning emails go to Family and the client's current organisation's admins (role-based, not a separate configurable registry). The "present period" for a warning is whatever accounting period the triggering bucket already tracks.
- Reason: matches the proposed default; a registry adds configuration UI not currently designed or requested with priority.
- Alternatives: CIS5 "Warning Notification Entities" registry (rejected for MVP — no design, no confirmed priority; parked as PL-02).
- Consequences: notification recipient logic is role-derived (Family + org admins for the client), re-derived on organisation transfer per PD-018/OQ-06. Resolves E-1..E-3 ambiguity for MVP.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-036 — Organisation change is family-initiated, via picker
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-06)
- Decision: Family uses "Change organisation" → an organisation picker → confirmation, matching UI-D3/D36 and the Settings design. Admin's "Remove" action on a client detaches that organisation's access without deleting client data (per PD-018).
- Reason: matches the latest design shown to the client; CM-0309's "replace with Add/Delete Organisation" is treated as superseded by the design (PD-007: designs shown to the client outrank a meeting note where they conflict, absent a later client confirmation reinstating CM-0309).
- Alternatives: CM-0309's admin-driven Add/Delete Organisation (rejected); FR-5.8 admin-initiated transfer (rejected as the primary mechanism — admin retains only the "Remove" detach action).
- Consequences: the organisation picker screen still needs a design (tracked under OQ-19's design gaps). FAM-13, ADM-05, INT-02 proceed on this basis. Resolves C-03 for the initiator question.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-037 — Family creates the client record and assigns a provider organisation
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-07)
- Decision: the family/POA creates the client record and then assigns (links) an organisation as provider, per CIS3 Order 1–3 and CM-1908's workflow. This supersedes the Admin Clients design's "admin adds client with family contact name and email" flow.
- Reason: human chose the client-confirmed workflow (CIS3/CM-1908) over the Admin Clients design, which was drawn before this workflow was confirmed.
- Alternatives: admin-created client + family invitation email (rejected — was the proposed default, but superseded by this answer).
- Consequences: the Admin Clients "add client" screen needs rework or removal — flag to the design owner as a **HUMAN REVIEW** item, since it contradicts an approved design. The family-side "create client + assign provider" flow (including how the organisation is selected/notified) is undesigned and needs a design gap entry (fold into OQ-19). F0-06, ADM-04, ADM-05 proceed on family-created clients, admin no longer being the client-creation path. Resolves C-04.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-038 — Staff names: full name always shown
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-13)
- Decision: store first and last name; display the full name everywhere (not first name + initial). This supersedes the "Aisha R." / "Daniel K." display convention shown in the current designs. Job titles remain a per-organisation editable list, seeded with Registered Nurse / Enrolled Nurse / Support Worker.
- Reason: human chose CIS5's "some organisations show full name" over the abbreviated display in the current design mockups.
- Alternatives: first name + initial per the current design (rejected); per-organisation configurable display format (not chosen — human picked a single fixed convention).
- Consequences: designs showing "Aisha R." / "Daniel K." need a copy update to full names — flag to the design owner. Applies wherever a staff name is displayed (records, Task log, Task detail assignee). Resolves relevant part of OQ-13.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-039 — Staff deactivation via a Deactivate action with confirmation
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-36)
- Decision: add a "Deactivate" action to the Staff Add/edit panel, with a confirmation step, per FR-5.6/US A-2/CIS5. Deactivated staff lose access immediately; their historical records (completions, audit entries) are retained, not deleted.
- Reason: matches the proposed default — soft deactivation preserves audit/history integrity (consistent with PD-005/PD-006 append-only history) while satisfying the access-withdrawal requirement.
- Alternatives: full removal/deletion of staff records (rejected — would break append-only completion/audit history and actor attribution).
- Consequences: the Staff design needs a Deactivate control added (design gap, fold into OQ-19). ADM-03 implements deactivation as a status flag, not a delete.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-040 — Simple email+password login, no mandatory MFA
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-08)
- Decision: Supabase Auth email + password for all roles. No mandatory MFA for any role, including Admin. Account creation still uses invitation emails for new users (not contested).
- Reason: human prioritised CIS3's "bank-like simplicity" request over NFR-3/ADR-03/TM-2108's MFA push.
- Alternatives: TOTP MFA required for admins (rejected — the original proposed default); MFA optional for all (not chosen).
- Consequences: NFR-3/TM-2108's MFA expectation is descoped for MVP — flag this to the human as a security tradeoff worth reconfirming before production launch, since Admin accounts hold access to health/financial data across an organisation's whole client base. F0-07, ADM-02, ADM-04 implement plain email/password auth only.
- Human confirmation: CONFIRMED 2026-09-17.
- **Amended by PD-057 / CHG-010 (2026-09-24):** "invitation emails for new users" now applies to **carers only**. Family and admin accounts are created by self-serve sign-up (F0-17). The MFA part of this entry is **reaffirmed** by CHG-010: MFA is not mandatory for any role, including admins. The forced admin TOTP enrolment that F0-07 shipped must be removed (CHG-010 follow-up).

### PD-041 — Carer visibility and edit access derived from shift schedule (no separate assignment table)
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-09)
- Decision: a carer's access to a client is computed directly from that carer's shifts with that client — there is no separate persistent "assignment" record.
  - **Read (visibility):** a carer can see a client the moment any shift is scheduled for that carer↔client pairing, however far in the future. Visibility persists as long as at least one shift (current or future) exists for that pairing. The instant the last remaining shift for that pairing ends with nothing else scheduled, visibility disappears immediately (no grace period, no lookback).
  - **Write (edit):** a carer can edit a client's events, tasks, and information only while a shift for that pairing is actively in progress (`start_time ≤ now < end_time`). Outside that window, access reverts to read-only (or no access, per the rule above).
  - During an active shift, edit access is full: carers may create and edit events, tasks, and client information for that client — not completion-only.
- Reason: this is the human's direct, detailed answer, replacing the "auto-assign on first shift, ended by admin/transfer" mechanism in the original proposed default.
- Alternatives: a persistent assignment table created on first shift and explicitly ended by admin/transfer (rejected — proposed default, superseded); completion-only edit rights during shift (rejected).
- Consequences: ADR-03's mention of "a separate assignment table" is superseded — access-control queries and RLS policies for F0-06, F0-10, F0-11, CAR-01, CAR-03, CAR-04, CAR-06, CAR-07, ADM-07, ADM-08, INT-04 derive carer↔client access directly from the shifts table (start_time/end_time) rather than a join through an assignment table. Flag as an architecture update to ARCHITECTURE.md §6 (controlled change). Resolves C-05 in full (previously PARTLY RESOLVED).
- Human confirmation: CONFIRMED 2026-09-17.

### PD-042 — Single Family role with full authority
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-16)
- Decision: Family is a single role with full family authority for MVP, matching the UI Spec's POA-acting-nominee model. View-only family access is parked (PL-16).
- Reason: matches the proposed default; CIS5's four-group model (Carers, Managers, Family, POA) adds role granularity not requested with priority or designed.
- Alternatives: multiple family sub-roles per CIS5 (rejected for MVP — parked).
- Consequences: F0-06 implements one `family` role; no per-user family permission tiers.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-043 — Carer Calendar blocks are events, not shift slots; no structured checklist sub-tasks
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-33)
- Decision:
  - (a) Carer Calendar blocks represent individual care events at their real times (e.g. "09:00 Margaret — Morning medication"), not the 4-hour shift slots assigned in Admin Manage.
  - (b) There is no separate structured checklist sub-task list. The "checklist" text seen in the Carer Calendar design (e.g. "Administer morning medication, Record in medication log, Check for side effects before leaving") is descriptive content of the event itself, not a distinct authored sub-task entity.
  - (c) Carer Home shows events for clients the carer is currently or upcoming rostered to, per PD-041's visibility rule.
- Reason: matches the proposed default combination; avoids building an undesigned structured checklist sub-task feature with an unclear authoring model.
- Alternatives: blocks = shift slots with separate admin-authored checklist sub-tasks (rejected — bigger scope, no confirmed authoring workflow).
- Consequences: F0-11, CAR-01, CAR-05, CAR-06, INT-03, INT-04 build the carer calendar against the events data model already used elsewhere (Home, Task log), not a new shift-block or checklist model. Resolves C-17.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-044 — Per-event completion mode: Manual (tick-off + optional proof) vs Automatic (self-completing)
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-10, extended per human's own design)
- Decision: every event/routine has a **completion mode** field, set once per event and applied to all its occurrences: `manual` (default) or `automatic`.
  - **Manual**: a carer or family member must explicitly mark the occurrence Done, with their name recorded (core safeguarding requirement), optionally attaching a document/photo as proof using the existing Documents field (not a mandatory gate). If due time passes with nothing recorded, the occurrence becomes **Overdue** automatically — Overdue is never user-selectable. Done can be undone by whoever marked it, or by Family, via an append-only "undone" entry (never deleting the original completion row, consistent with PD-005).
  - **Automatic**: no confirmation is required. Once the occurrence's scheduled time passes, the system marks it Done by itself — no actor attached, no Overdue state for this mode.
- Reason: reconciles the human's request (some tasks, e.g. "go on a walk," don't need proof; others, e.g. "buy prescriptions," need explicit tick-off with optional receipt upload) with the project's core safeguarding purpose (care must be verifiably confirmed by a named actor for tasks that matter) and with the sources' Overdue-is-derived intent (US A-5/P-4, CM-0309).
- Alternatives: a single global auto-vs-manual toggle (rejected — the whole point is that different routines need different modes); auto mode marking events "Done" with no distinction from manual (rejected in discussion — would defeat safeguarding intent, since a missed automatic task would show as completed with no one having confirmed it).
- Consequences: this is a **new capability beyond any original source document** — logged separately as **CHG-001** (below) since it adds a field to the event data model and a toggle to the Edit event form that no PRD/AC/design currently shows. F0-11 (event schema) gains a `completion_mode` column; FAM-06/FAM-07/CAR-06/CAR-07 (event create/edit UI) gain the mode toggle; the Edit event design needs this control added (fold into OQ-19 design gaps). Resolves OQ-10 in full.
- Human confirmation: CONFIRMED 2026-09-17.
- **Amended by CHG-009 (2026-09-24):** the **Automatic** mode no longer self-completes. An event in that mode is a **plain event** with no status at all (never Planned, Done or Overdue, and never ticked off). Manual-mode events are called **tasks** in the UI. "Set once per event" is replaced: the mode can be changed at any time, forward only. Read CHG-009 for the full rules.

### PD-045 — Recurring event edits get a scope selector (this occurrence / this and future / entire series)
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-11)
- Decision: editing a recurring event presents a scope choice — "this occurrence only," "this and future occurrences," or "entire series" — before applying the edit, matching the Prototype A behaviour cited in the design traceability (FR-2.5).
- Reason: matches the proposed default; without a scope choice, PD-004's per-occurrence override model has no UI to drive it.
- Alternatives: edits always apply to the whole series (rejected — loses the ability to make one-off changes without a scope choice).
- Consequences: the Edit event design needs a scope selector added (design gap, fold into OQ-19). FAM-07 implements the selector and routes the edit through `src/lib/recurrence` per-occurrence overrides (PD-004). Resolves C-11.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-046 — Recurrence options: full frequency set incl. Fortnightly, perpetual by default
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-12)
- Decision: the event form's recurrence options are: Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly. Recurrence repeats indefinitely unless an explicit end date is set.
- Reason: matches the proposed default, covering every frequency mentioned across sources (FR-2.1, US C-5) plus Fortnightly, and honouring CIS5's multi-year (4–5 year) rollover expectation via perpetual-by-default recurrence.
- Alternatives: Weekly-only, matching the current design exactly (rejected — too narrow for the confirmed use cases).
- Consequences: F0-09 (recurrence logic) and FAM-06 (event form) implement the full option set; the Edit event design's "Recurring" select needs the additional options added (design gap, fold into OQ-19).
- Human confirmation: CONFIRMED 2026-09-17.

### PD-047 — Event form gains Title, Start time, and Duration fields
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-22)
- Decision: the Edit event form adds Title, Start time, and Duration fields, alongside the existing Date, Recurring, Status, Description, Documents, and the new completion-mode toggle (PD-044).
- Reason: matches the proposed default — Home, Calendar, and Task log already display title/time/duration for events, and CM-0309 requires tasks to have a date and time; the current Edit event form is missing the fields that produce that display data.
- Alternatives: deriving a display title/time from other data instead of explicit fields (rejected — no reliable source to derive from; the brief and CM-0309 imply these are first-class inputs).
- Consequences: the Edit event design needs Title, Start time, and Duration fields added (design gap, fold into OQ-19). F0-11 (event schema), FAM-06, FAM-07, CAR-07 implement the new fields. Resolves C-22.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-048 — Carer notification scope: shift + family-update triggers
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-14)
- Decision: Carer notifications trigger on shift assigned/changed/cancelled, and on family adding a document or an event. The bell shows an unread count; clicking a notification scrolls to the relevant card.
- Reason: matches the proposed default and the design's own examples.
- Alternatives: broader scope including budget/status-change notifications (not chosen — not designed, adds scope).
- Consequences: CAR-02 implements this fixed set of trigger types; retention/read-unread mechanics still need basic definition during implementation (not further specified here).
- Human confirmation: CONFIRMED 2026-09-17.

### PD-049 — Incoming organisation sees full client history, labelled by recording organisation
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-15)
- Decision: on organisation transfer (PD-018/PD-036), the incoming organisation sees the client's full history (events, completions, budget, documents) from before the transfer, with each item labelled with the organisation that originally recorded it.
- Reason: matches the proposed default and US A-12/P-15/P-17's requirement that history remains available and identifiable to authorised parties.
- Alternatives: hiding pre-transfer history from the new organisation (rejected — contradicts the user stories' identifiability requirement).
- Consequences: FAM-13, INT-02 carry an `organisation_id` (or equivalent) on historical records for labelling; RLS grants read access to the current organisation across organisation boundaries for that client's history.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-050 — Hosting stack: Vercel + Supabase paid tier + Resend
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-17)
- Decision: deploy on Vercel with a paid Supabase tier (Postgres, Auth, Storage) and Resend (or Supabase SMTP) for transactional email; Vercel Cron or pg_cron for scheduled jobs (e.g. budget threshold checks).
- Reason: matches the proposed default; the human chose to proceed on the assumption that budget is available, over descoping to free tiers.
- Alternatives: free/low-cost tiers accepting reduced availability/backup guarantees (not chosen — human picked the fuller stack).
- Consequences: NFR-8's 99.9%/backup requirement is targeted rather than descoped. INT-01, INT-08 provision these services; actual billing/budget confirmation with the client sponsor is still needed operationally, but does not block implementation.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-051 — File uploads: PDF/JPEG/PNG/HEIC/DOCX up to 20MB, no video
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-26)
- Decision: uploads (client documents, event proof-of-completion attachments per PD-044) accept PDF, JPEG, PNG, HEIC, and DOCX, up to 20MB per file. Video is excluded for MVP.
- Reason: matches the proposed default; covers documents and photos (including completion-proof receipts) without the storage-cost implications of video.
- Alternatives: including short video clips per CIS3's mention of video recordings (not chosen — human kept video out of scope for MVP).
- Consequences: F0-13, FAM-08, FAM-09 implement this file-type/size allowlist in upload validation and Supabase Storage policies. Storage cost documented in project handover, per the original proposed default.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-052 — Undesigned gaps are built directly from Figma tokens/patterns, flagged for review
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-19)
- Decision: for the outstanding undesigned screens/controls (organisation picker, budget Update flow, staff Deactivate control, recurring-edit scope selector, extra recurrence options, event Title/Start/Duration fields, the completion-mode toggle from PD-044, and any others found when re-checking Figma per the original OQ-19 default), Claude Code builds the missing UI directly from the Figma "01 · Foundations" tokens and the visual patterns already established elsewhere in the app, rather than pausing for a separate design/approval step. Each such addition is flagged in its PR for human sanity-check (per §5.3/§10-style HUMAN REVIEW flagging), not silently merged as if it were pre-approved.
- Reason: there is no separate design step scheduled in the two-week sprint plan; blocking every affected feature on new Figma work would stall the schedule.
- Alternatives: pausing each affected feature until the human supplies/approves a design first (rejected — human chose speed, accepting review-after-build risk).
- Consequences: PRs touching any of these gaps must call out "design gap, built from tokens — please review" explicitly, per CLAUDE.md §10's spirit even though this specific case is now pre-authorised. Applies to FAM-11, CAR-07, CAR-08, ADM-03, ADM-05, ADM-08, ADM-09 and any other feature citing an OQ-19 design gap.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-053 — Shift edit/cancel: simple edit of time/carer, or outright cancellation; no separate "extend" action
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-27)
- Decision: an admin can open a scheduled shift and edit its start/end time or reassign the carer, or cancel it outright (soft-delete, preserving history). There is no separate "extend shift" action distinct from editing the end time.
- Reason: matches the proposed default framing — simplest workflow that still satisfies CIS5's need to lengthen a shift (via editing the end time) and to cancel one.
- Alternatives: a distinct "Extend shift" action separate from general edit (rejected — redundant with editing the end time).
- Consequences: ADM-09 implements a single shift edit/cancel UI; cancellation keeps the shift row (status = cancelled) rather than deleting it, consistent with the project's append-only/audit conventions (PD-005/PD-006).
- Human confirmation: CONFIRMED 2026-09-17.

### PD-054 — Settings: per-card Save button; Role read-only for carers; email field is contact-only
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-35)
- Decision: each Settings card (Family info, My info, Organisation info) gets its own Save button. Carers cannot edit their own Role field (admin-controlled elsewhere). The email field shown in Settings is a contact email, distinct from the Supabase Auth login email — editing it does not change how the user signs in.
- Reason: matches the proposed default; keeps login-credential changes (a security-sensitive flow) out of a simple contact-info form.
- Alternatives: making the Settings email field also update the login email (rejected — adds a re-verification flow not currently designed or requested).
- Consequences: FAM-12, CAR-09, ADM-10 implement per-card Save actions; Role field is rendered read-only (absent an edit control) for the carer's own Settings view, consistent with PD-008 (controls absent, not disabled).
- Human confirmation: CONFIRMED 2026-09-17.

### PD-055 — Event assignee derived from the covering shift; actor shown once Done
- Date: 2026-09-17 · Decided by: Dhruv Verma (answering OQ-29)
- Decision: the assignee shown on a Planned event is derived from whichever carer has a shift covering that event's scheduled time — consistent with PD-041's shift-derived access model. If no shift covers it, show "—". Once the event is marked Done, show the actor who actually completed it, not the derived assignee.
- Reason: matches the proposed default; avoids adding a redundant manual assignee field when the shift schedule already determines who is responsible.
- Alternatives: an explicit manual "assign to" field on the event, independent of shifts (rejected — redundant with the shift schedule and adds a second source of truth for who's responsible).
- Consequences: F0-11, FAM-01, FAM-14, FAM-15, ADM-01 compute the displayed assignee via a query joining events to shifts by covering time range, not a stored field.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-056 — PR approval gate: Claude Code never opens a PR without explicit human approval
- Date: 2026-09-17 · Decided by: Dhruv Verma (process rule, not tied to an OQ)
- Decision: on reaching a feature's Definition of Done, Claude Code reports status and states readiness to open the PR, then stops and waits for explicit approval. On approval, the feature's PROGRESS.md/SESSION_STATE.md is updated to `PR OPEN` on the same feature branch, committed with the final implementation work, pushed, then the PR is opened — as one unit, not a separate before/after step. No separate branch is created after a merge solely to record that the PR merged. Documented in `docs/DEVELOPMENT_WORKFLOW.md` §7 (new section; renumbered old §7–§10 to §8–§11).
- Reason: hardens CLAUDE.md's general "confirm before shared-visible actions" guidance into an explicit, repo-documented gate so every session (not just one Claude Code instance) follows it, and avoids redundant cleanup branches.
- Alternatives: leaving it as an unwritten convention (rejected — not visible to other sessions/team members); updating docs only after merge confirmation (rejected by the human — adds an extra round trip for no benefit).
- Consequences: `docs/DEVELOPMENT_WORKFLOW.md` gained new §7 and renumbered §7→§8 (PR template), §8→§9 (dev-branch testing), §9→§10 (checkpoints), §10→§11 (session hygiene). Cross-references updated: CLAUDE.md §3 and §8 (this file's own PR/commit rules already implied this; now explicit), PRD.md §19, ARCHITECTURE.md §12.10.
- Human confirmation: CONFIRMED 2026-09-17.

### PD-057 — Self-serve sign-up for Family and Admin; carers stay invite-only
- Date: 2026-09-24 · Decided by: Prajeet (in-session; extends PD-037 and PD-040)
- Decision:
  - **Anyone creates their own account first, then links.** A public `/sign-up` page creates the account and the thing it links to in one step. There are two account types:
    - **Family:** creates the family account and the client record (the person they care for). The family becomes that client's family member (PD-037, PD-042). The client starts with no organisation. The family links a provider later with the organisation picker (PD-036).
    - **Organisation (admin):** creates the admin account and a **new organisation**, and becomes its first admin. This takes the *registration* half of PL-18 into scope; *deleting* an organisation stays parked.
  - **Carers cannot sign up themselves.** A carer account exists only when an admin invites them (ADM-02, PD-040). The public page offers no carer option, and the database rejects any attempt to create a carer, or to join an existing organisation, through public sign-up.
  - **Families do not link carers.** Carers reach a client only through shifts that the linked organisation's admin schedules (PD-041, unchanged).
  - **No email confirmation.** A new account can sign in straight away (Supabase `enable_confirmations = false`, already the setting in `supabase/config.toml`).
  - **Same look as sign-in.** `/sign-up` uses the `(auth)` layout and the same `CardShell`, `Field`, `InlineAlert` and `Button` components and tokens as `/sign-in`. Only the fields differ. Sign-in and sign-up link to each other.
  - **Admin MFA is not mandatory** (reaffirms PD-040). A newly registered admin goes straight to `/admin/home`. The forced TOTP enrolment and challenge F0-07 shipped for admins (its feature CHG-001) contradicts PD-040 and is to be removed in a shared follow-up fix.
  - **Every organisation needs a unique identifier** so families can tell a real provider from a lookalike in the picker (PL-24). Which identifier (e.g. the ABN, which `organisations.abn` already has a column for) and whether sign-up requires it is not decided yet.
  - **Shared stream.** The feature is **F0-17**, in the shared stream and Lane B like F0-07, branch `feature/shared-sign-up`, PR → `main`.
- Reason: human instruction in-session, 2026-09-24: "everyone can create their own account and then they link an organisation/client/carer etc." The follow-up answers to the four questions were: carers stay invite-only; admin sign-up registers a new organisation; no direct family-to-carer link; no email confirmation. On reviewing the CHG-010 risks the human then chose: admin MFA stays not mandatory; organisations need a unique identifier (noted for PL-24).
- Alternatives: carer join request approved by an admin (rejected: human kept admin invite); carer join code (not chosen); admin joins an existing organisation by request (not chosen); no admin self-sign-up (not chosen); family picks carers (rejected: it would change PD-041); email confirmation required (rejected: human chose immediate sign-in).
- Consequences: see CHG-010.
- Human confirmation: CONFIRMED 2026-09-24 (Prajeet, in-session).

---

## 3. Open decisions (human input required)

Blocking decisions stop the listed features until answered. Record answers as PD entries and change the status to ANSWERED.
**Gate 0 decisions (needed before any work): OQ-01, OQ-20.** All decisions below are OPEN and stay OPEN until the human closes them. `docs/SPRINT_PLAN.md` §4 shows the day each one first blocks sprint work.
Claude Code never changes a status in this table, never adds an ANSWERED heading, and never acts on a proposed default for a blocking decision.

| ID | Decision needed | Conflict / context | Sources | Blocking | Blocks features | Proposed default | Status |
|---|---|---|---|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | The Git model requires every feature to belong to one dashboard stream and forbids feature branches from main, but Phase 0 foundation and some Phase 4 work serve all three dashboards. | User constitution §5–6 | YES | F0-01, F0-02, F0-05, F0-03, F0-14, UI-00, F0-15, UI-01, UI-02, UI-03, F0-04, F0-09, F0-06, F0-08, F0-10, F0-07, F0-11, F0-12, F0-13, F0-16, INT-01, INT-05, INT-06, INT-07, INT-08 | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. | ANSWERED |
| OQ-02 | Dashboard phase order | The planning template lists Carer → Admin → Family; UI Specs §4 build order is Family (1–6, 13–14) → Carer (7–9) → Admin (10–12). Plan v0.2 builds the three dashboards in parallel lanes, so order now only matters when a team is too small to staff every lane (SPRINT_PLAN §2). | User constitution §7; UI-§4 | no | — | Family → Carer → Admin (source build order). Seed data (F0-16) removes cross-dashboard data dependencies. | OPEN |
| OQ-03 | Budget threshold percentages | Client Information Sheet 3 and user stories P-18/UC-F02 say 75% / 85% / 100%; UI Spec D4 and the bucket card states say 70% / 90% / 100%. The design shows Government at 92% in alert state (true under both). | CIS3 Data 6a; CIS5; US P-18; UC-F02; UI-D4; UI-§6 | YES | F0-12, FAM-03, INT-01 | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. | ANSWERED |
| OQ-04 | Funding model: buckets, categories and periods | Brief lists funding sources Pension, NDIS, Disability Trust, Family & other with restrictions and different accounting periods (FR-6.1–6.4). CM-0309 descoped funding rules and chose predefined categories/subcategories. The design shows three fixed buckets NDIS, Fixed, Government with no categories. Client Information Sheet No 4 (budgeting) was not supplied. | BRIEF IV, item 5; CIS5; CM-0309; UI-D1; Design Budget | YES | F0-12, FAM-03, FAM-10, FAM-11, CAR-08 | MVP: per-client buckets of kinds NDIS / Fixed / Government with one period each; categories and restrictions parked (PL-10). Obtain CIS4 before F0-12. | ANSWERED |
| OQ-05 | Who can add funds and record spending; Budget History contents | UI-D1 'Only Family adds funds'; CM-0409 (later) 'Organisations can edit family budgets'. Design History lists only top-ups; whether expenses appear and who records them (carer? admin?) is unstated. The Update interaction is not designed. | UI-D1, D19; CM-0409; CM-0309; US C-11; Design Budget | YES | F0-12, FAM-10, FAM-11, CAR-08 | Family adds funds; carers record expenses during shifts; admins read — confirm, and design the Update flow. | ANSWERED |
| OQ-06 | Organisation change model | UI-D3/D36 and the Settings design: Family 'Change organisation' → picker → confirmation. CM-0309: replace 'Change Organisation' with Add/Delete Organisation. FR-5.8: Admin transfers the client. Admin Clients design has 'Remove'. The organisation picker is not designed. | UI-D3, D24, D36; CM-0309; FR-5.8; Design Settings/Clients | YES | FAM-13, ADM-05, INT-02 | Family-initiated change per the latest design; Admin 'Remove' detaches without deleting. Picker design required. | ANSWERED |
| OQ-07 | Client record creation and family linking | CIS3 and CM-1908: family sets up the client and assigns a provider. Admin Clients design: admin adds client with family contact name and email. How the family contact becomes a user is undefined. | CIS3 Order 1–3; CM-1908 workflow; UI-D28; Design Admin Clients | YES | F0-06, ADM-04, ADM-05 | Admin adds client + family contact email → family receives an invitation to set a password; confirm. | ANSWERED |
| OQ-08 | Account provisioning, sign-in method and MFA | No sign-in screen is designed. Settings designs imply email-based password reset. Staff and family account creation (invite vs admin-set password) is undefined. NFR-3/ADR-03/TM-2108 require or strongly prompt MFA for Admin; CIS3 asks for bank-like simplicity. | CIS3; CIS5 Q&A; NFR-3; ADR-03; TM-2108; Design Settings | YES | F0-07, ADM-02, ADM-04 | Email + password via Supabase Auth, invitation emails for new users, TOTP MFA required for admins; confirm. | ANSWERED |
| OQ-09 | Carer access model | CM-0409: read while assigned, edit only during active shift. UI-D29: carer client-info edit rights match Family's. FR-5.2: carer cannot view clients when not scheduled. ADR-03 uses a separate assignment table; Admin Manage only assigns shifts. Undefined: what creates/ends an assignment, active-shift window, and whether carers create/edit events. | CM-0409; UI-D10, D29; FR-5.2; ADR-03; Sequence UC2, UC3; CM-0309 | YES | F0-06, F0-10, F0-11, CAR-01, CAR-03, CAR-04, CAR-06, CAR-07, ADM-07, ADM-08, INT-04 | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. | ANSWERED |
| OQ-10 | Status behaviour and undo | UI-D18 three statuses; the Edit event design lets users pick Overdue manually although Overdue should be derived (A-5/P-4). UI Q16: can Done be undone and by whom? CM-0309 asks how automatic Planned/Overdue works. | UI-D18, Q16; US A-5, P-4; CM-0309; Design Edit event | YES | F0-11, FAM-05, FAM-06, FAM-07, FAM-15, CAR-06 | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. | ANSWERED |
| OQ-11 | Editing recurring events: scope | Prototype A had 'this occurrence / this and future / entire series' and the design traceability cites it for FR-2.5, but the final Edit event design has no scope selector or cancel-occurrence control. | FR-2.5; US C-6; BRIEF item 3; DD §4, §8; Design Edit event | YES | FAM-07 | Add a scope choice when editing a recurring event (design required). | ANSWERED |
| OQ-12 | Recurrence options and plan horizon | FR-2.1: weekly, monthly, every 2 months, quarterly, 6-monthly, yearly, one-off. C-5: daily, weekly, monthly. CIS5: multi-year plans (e.g. 4–5 years) rolled over. Design shows a 'Recurring' select with 'Weekly' only. | FR-2.1; US C-5; CIS5 Perpetual; Design Edit event | YES | F0-09, FAM-06 | Options: Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly; repeats indefinitely unless an end date is set. | ANSWERED |
| OQ-13 | Staff names and job titles | CIS5: some organisations show full name, others first name + surname initial. Design shows 'Aisha R.' on records and 'Daniel K.' stored as a name. Role select shows Registered Nurse / Enrolled Nurse / Support Worker; CIS3 wants organisation-defined labels. | CIS3 #3–4; CIS5 Rostering & Q&A; UI-D33; Design Staff | YES | ADM-02 | Store first and last name; display first name + initial everywhere (matches design); job titles are a per-organisation editable list seeded with the three design values. | ANSWERED |
| OQ-14 | Carer notifications scope | D34 gives Carers an in-app notifications panel. The design shows notifications for 'new shift assigned', 'family updated care plan documents' and 'family added a note'. Undefined: full list of types, bell click behaviour, read/unread, retention. | UI-D34; Design Carer Home | YES | CAR-02 | Types: shift assigned/changed/cancelled, family document added, family event added/changed; bell shows unread count and scrolls to the card. | ANSWERED |
| OQ-15 | Incoming organisation's visibility of history | UI Q15: D24 retains everything on transfer, but can the new organisation see records created under the previous one? US P-17/A-12 say history remains available and identifiable to authorised parties. | UI-Q15; US A-12, P-15, P-17 | YES | FAM-13, INT-02 | Incoming organisation sees full history, labelled with the organisation that recorded it. | ANSWERED |
| OQ-16 | Family role granularity | UI Spec: Family = nominee acting under Power of Attorney (single role). CIS5 lists four groups (Carers, Managers, Family, POA). FR-5.3: Family view-only. US P-11: view-only family vs POA authority. | UI-§2; CIS3 #8; CIS5 Q&A; FR-5.3; US P-11 | YES | F0-06 | Single Family role with full family authority for MVP; view-only family parked (PL-16). | ANSWERED |
| OQ-17 | Hosting, email, scheduler, environments and availability | Brief: 'loaded on a Microsoft based computer … accessed by others'; NFR-1 cloud; NFR-8 99.9% with daily backups; ADR-01 notes the Supabase free tier does not meet this. Email provider and scheduler not chosen. | BRIEF wish; NFR-1, NFR-8; ADR-01; TD | YES | INT-01, INT-08 | Vercel (or equivalent) + Supabase paid tier; Resend (or Supabase SMTP) for email; Vercel Cron or pg_cron for jobs — confirm budget with client. | ANSWERED |
| OQ-18 | Printable schedule and data export | TM-2808 says the client moved printable export to Must; user stories v3 rate A-15 COULD and P-16 SHOULD; CIS3 requires POA/parent approval for downloads. No design. | TM-2808; US A-15, P-16; CIS3 Data 7 | no | — | Parked (PL-08) pending client priority. | OPEN |
| OQ-19 | Figma access and remaining design gaps | Figma MCP exposed only page '01 · Foundations'; screens were supplied as images (a '06 · States' sheet implies pages 02–06). Not designed: sign-in/reset pages, add-event header and title/time fields, organisation picker, budget Update, staff deactivate, client remove, custom time slot input, shift edit, expense entry, event notes/comments, carer add-event entry, admin overdue drill-down. | FIG; user-supplied screen images (17 Sep 2026) | YES | FAM-11, CAR-07, CAR-08, ADM-03, ADM-05, ADM-08, ADM-09 | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. | ANSWERED |
| OQ-20 | Repository and infrastructure reality | Team meeting 4/9 reports a live repository with CI, Supabase schema and RLS tests for all four roles; the human reports an essentially empty Next.js scaffold. An archived Confluence 'Tech Stack' page lists MongoDB. | TM-0409; archived Confluence 'Tech Stack'; user constitution §3 | YES | F0-01 | Treat the current repository as authoritative; ask whether any Supabase project/schema exists to adopt. | ANSWERED |
| OQ-21 | Rostering scope and shift patterns | Product requirements OOS-5 says rostering is out of scope; CM-1908, CM-0309, UI §7.14 and the Manage design include shift assignment. CIS5 wants organisation-configurable shift patterns and extension; the design uses fixed slot chips + Custom. | OOS-5; CM-1908; CIS5 Rostering; Design Manage | no | — | Shift assignment in scope per later sources; fixed chips for MVP, configurable patterns parked (PL-19). | OPEN |
| OQ-22 | Event fields | Home, Calendar, Task log and Task detail display event title, start time and duration, and CM-0309 says tasks require date and time, but the Edit event form only has Date, Recurring, Status, Description and Documents. | CM-0309; Design Edit event vs Home/Calendar | YES | F0-11, FAM-06, FAM-07, CAR-07 | Add Title, Start time and Duration fields to the event form (design update). | ANSWERED |
| OQ-23 | Dependency security tool ('X-ray') | Testing Decision selects 'X-ray' checks without naming the tool. | TD | no | — | npm audit (high) + Dependabot. | OPEN |
| OQ-24 | Undesigned empty states | UI Q17 (client with no funding) and other empty states (no events today, no history) are not in the States sheet. | UI-Q17; Design States | no | — | Use the EmptyState primitive with proposed copy flagged for review. | OPEN |
| OQ-25 | Help tooltips, FAQ and discussion board | CIS3 asks for '?'/'i' help bubbles and an editable Q&A; CIS5 adds an editable FAQ and a staff discussion board; CM-0309 agreed contextual help throughout. None designed. | CIS3 Access 6; CIS5 FAQ; CM-0309 | no | — | Parked (PL-05) pending design and priority. | OPEN |
| OQ-26 | File upload constraints | US C-4 refers to an 'agreed file-size limit'; CIS3 mentions photos and video recordings kept in perpetuity and asks about subscription fees. No limits agreed. | US C-4; CIS3 Data 4 | YES | F0-13, FAM-08, FAM-09 | PDF, JPEG, PNG, HEIC, DOCX up to 20 MB; video excluded for MVP; storage cost documented in handover. | ANSWERED |
| OQ-27 | Shift edit, extend and cancel workflow | CIS5 requires extending a shift; CM-0309 lists the workflow as unresolved. No design. | CIS5 Rostering; CM-0309 | YES | ADM-09 | Design required. | ANSWERED |
| OQ-28 | Budget email recipients and budget period | D4: family, nurse and admin. CIS5: a 'Warning Notification Entities' registry of names/emails, changeable, excluding removed organisations. E-1..E-3: POA and/or Family. 'Present period' boundaries undefined. | UI-D4; CIS5 Notifications; US E-1..E-3 | YES | INT-01 | Family + current organisation admins; registry parked (PL-02); period = bucket period. | ANSWERED |
| OQ-29 | Which nurse is shown on an event | Home blocks, Task log 'Nurse' and Task detail 'Assigned to Aisha R.' show an assignee; overdue rows show '—'. The event form has no assignee field. Could be derived from the shift covering the event time or stored on the event. | UI-D25; Design Home, Task log, Task detail | YES | F0-11, FAM-01, FAM-14, FAM-15, ADM-01 | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. | ANSWERED |
| OQ-30 | Multi-client family accounts | CM-2108 decided one account can access multiple client schedules; prior-group clarification (parent with several children); US P-10 COULD. UI Spec says Family context is one client; no client switcher designed. | CM-2108; US P-10; UI-§2 | no | — | Routes include clientId; switcher parked (PL-15). | OPEN |
| OQ-31 | Task log range | 'Every task' is unbounded for perpetual recurrences. The design shows past items and today's planned items only. | UI-D27; Design Task log | no | — | Occurrences up to end of today, newest first. | OPEN |
| OQ-32 | Timezone | All sources are Victorian; no multi-timezone requirement exists. | Design content (Preston VIC) | no | — | Australia/Melbourne for all date logic. | OPEN |
| OQ-33 | Carer calendar and task semantics | Carer Calendar is titled 'Shifts' but its blocks show events ('09:00 Margaret — Morning medication') at event times, unlike the 4-hour slots assigned in Manage. 'Tasks for the selected shift' lists checklist steps (Administer morning medication, Record in medication log, Check for side effects before leaving) that exist nowhere else. Carer Home 'Tasks' lists events. Which clients' events appear on Carer Home is undefined. | UI-D8; Design Carer Calendar, Carer Home, Admin Manage | YES | F0-11, CAR-01, CAR-05, CAR-06, INT-03, INT-04 | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. | ANSWERED |
| OQ-34 | Event notes and comments | CIS5 Q&A and brief item 4 require comments on completed tasks; the Carer notification 'Helen added a note to today's Afternoon check-in' implies notes exist; no note/comment UI is designed. | BRIEF item 4(i, iii); CIS5 Q&A; US C-3, C-10; Design Carer Home | no | — | Parked (PL-21) until designed. | OPEN |
| OQ-35 | Settings forms save behaviour | Family info, My info and Organisation info cards show inputs but no Save button. Unclear whether carers can edit Role and whether email changes the login email. | Design Family/Carer/Admin Settings | YES | FAM-12, CAR-09, ADM-10 | Add a Save button per card; Role read-only for carers; email field is contact email only. | ANSWERED |
| OQ-36 | Staff deactivation | FR-5.6/US A-2 and CIS5 require withdrawing access when staff leave; the Staff design has no deactivate/remove control. | FR-5.6; US A-2; CIS5 Q&A; Design Staff | YES | ADM-03 | Design a Deactivate action in the Add/edit panel with confirmation. | ANSWERED |
| OQ-37 | Admin Home overdue row destination | Rows have chevrons but Admin has no task detail or task log screen (UI Q14). | UI-Q14; Design Admin Home | no | — | Omit navigation until an admin detail view is designed (PL-20). | OPEN |
| OQ-38 | Client information fields | CIS3/CIS5 request DOB, contacts (parents, POA), disability, behaviours of concern up front, date admitted, 'last updated', photo, expandable headings with summary flags and SPO forms with archive. The Info design has Description, Habits, Medical history and Documentation only. | CIS3 Data 1–2; CIS5 Front page; Design Family Info | no | — | Build the design for MVP; remaining fields parked (PL-13, PL-22) pending client confirmation. | OPEN |
| OQ-39 | Design copy and visual inconsistencies | Manage warning example (11:30–13:00) does not overlap the selected 07:00–11:00 slot; States sheet repeats no-results copy twice; Budget screen bar colours differ from Home; Task log Nurse column misaligned on Planned rows; Task log status filter is a dropdown despite 'chips over dropdowns'; Staff and Clients rail items share an icon. | Design images; DD §5, §7 | no | — | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. | OPEN |


### How to answer
Add under this heading:
```
### OQ-xx — ANSWERED <date> by <name>
Answer: …
Recorded as: PD-0xx
Docs updated: <files>
```

### OQ-01 — ANSWERED 2026-09-17 by Dhruv Verma
Answer: Option B — `feature/shared-<name>` from `main`, PR to `main` with mandatory human review, then merged into all three dashboard dev branches.
Recorded as: PD-030
Docs updated: DECISIONS.md

### OQ-20 — ANSWERED 2026-09-17 by Dhruv Verma
Answer: The current repository is authoritative and starts empty; no existing Supabase project/schema/CI exists to adopt.
Recorded as: PD-031
Docs updated: DECISIONS.md

---

## 4. Source conflict register

| # | Conflict | Sources | Resolution | Status |
|---|---|---|---|---|
| C-01 | Budget thresholds 75/85/100 vs 70/90/100 | CIS3, US P-18 vs UI-D4 | OQ-03 / PD-032 (75/85/100 wins) | RESOLVED |
| C-02 | Fund editing: Family only vs organisation can edit | UI-D1 vs CM-0409 | OQ-05 / PD-034 (CM-0409 wins) | RESOLVED |
| C-03 | Change organisation vs Add/Delete organisation vs Admin transfer | UI-D3/D36 + design vs CM-0309 vs FR-5.8 | OQ-06 / PD-036 (design wins) | RESOLVED |
| C-04 | Client created by family vs by admin | CIS3, CM-1908 vs UI-D28 + Admin Clients design | OQ-07 / PD-037 (CIS3/CM-1908 wins; design needs rework) | RESOLVED |
| C-05 | Carer edit rights same as family vs only during shift | UI-D29 vs CM-0409 | PD-019 + PD-041 (shift-limited, fully specified) | RESOLVED |
| C-06 | Family view-only vs family edits, adds funds, changes organisation | FR-5.3, US v2 vs UI-D1, D9, D26, CM-0309 | Later sources win (family edits); granularity OQ-16 | PARTLY RESOLVED |
| C-07 | Supervisor confirms completion vs no approval | CIS5 Q&A vs CM-0309 | PD-020 | RESOLVED |
| C-08 | Rostering out of scope vs shift assignment designed | OOS-5 vs CM-1908, CM-0309, UI §7.14 | PD-025 / OQ-21 | PROPOSED |
| C-09 | Configurable funding sources/restrictions/periods vs three fixed buckets | BRIEF, FR-6.x vs CM-0309, UI-D1, designs | OQ-04 / PD-033 | RESOLVED |
| C-10 | Overdue as user-selectable status vs derived | Edit event design vs US A-5/P-4 | OQ-10 / PD-044 (derived, for manual-mode events) | RESOLVED |
| C-11 | Recurring edit scope present in Prototype A / traceability vs absent in final | DD §4, §8 vs Edit event design | OQ-11 / PD-045 | RESOLVED |
| C-12 | Printable export Must vs Could | TM-2808 vs US A-15 | OQ-18 | OPEN |
| C-13 | MFA Must vs should be supported vs simple bank-like login | TM-2108 vs NFR-3 vs CIS3 | OQ-08 | OPEN |
| C-14 | Repo has CI/Supabase/RLS vs empty scaffold | TM-0409 vs human | OQ-20 / PD-031 (human wins) | RESOLVED |
| C-15 | Tech stack MongoDB (archived page) vs Supabase | Archived "Tech Stack" vs ADR-01 | ADR-01 wins (PD-001) | RESOLVED |
| C-16 | ERD integer money/no roles vs ADR consequences | Database Model vs ADR-01 | PD-024 | PROPOSED |
| C-17 | Carer calendar "Shifts" showing events and checklist sub-tasks vs shift slots in Manage | Carer Calendar design vs Admin Manage design, UI-D8 | OQ-33 / PD-043 | RESOLVED |
| C-18 | Client info fields requested by client vs design sections | CIS3/CIS5 vs Family Info design | OQ-38 | OPEN |
| C-19 | Email recipients: registry vs roles vs POA/Family | CIS5 vs UI-D4 vs E-1..E-3 | OQ-28 / PD-035 | RESOLVED |
| C-20 | Family context one client vs multi-client accounts | UI-§2 vs CM-2108, US P-10 | OQ-30 | PARKED |
| C-21 | FR-5.2 carer cannot view when not scheduled vs read while assigned | FR-5.2 vs CM-0409 | CM-0409 wins (PD-019) | RESOLVED |
| C-22 | Edit event form lacks title/time/duration shown elsewhere | Edit event vs Home/Calendar/Task log designs, CM-0309 | OQ-22 / PD-047 | RESOLVED |
| C-23 | "Chips over dropdowns" vs dropdowns in Recurring, Status filter, Staff Role | DD §5, §7 vs designs | Follow designs; noted OQ-39 | NOTED |
| C-24 | Screen detail source UI Spec v1 §7 referenced but not available | UI Specs §7 | Designs supplied as images; OQ-19 | PARTLY RESOLVED |

| C-25 | v0.1 sequential dashboard phases vs human request for a parallel, UI-first plan | PD-011 vs human 2026-09-17 | PD-026 | RESOLVED |
---

## 5. Controlled changes

### CHG-001 — Per-event completion mode (Manual with optional proof / Automatic self-completing)
- Date / requested by: 2026-09-17 / Dhruv Verma (human, project lead)
- Type: new requirement
- Description: add a `completion_mode` attribute to every event/routine (`manual` or `automatic`, set once per event, applying to all its occurrences). Manual events require a carer/family member to explicitly mark them Done with their name recorded, optionally attaching a document/photo as proof (using the existing per-event Documents field). Automatic events self-complete when their scheduled time passes, with no confirmation, no actor, and no Overdue state. See PD-044 for full behaviour.
- Source / justification: no PRD/AC/design document specifies this distinction; it is a new requirement the human introduced directly in this session, motivated by a real gap (not every task needs proof of completion — e.g. "go on a walk" vs "buy prescriptions").
- Impact: F0-11 event schema gains `completion_mode`; FAM-06/FAM-07/CAR-06/CAR-07 event create/edit UI gain a mode toggle; Edit event design needs the control added (design gap, fold into OQ-19); ACCEPTANCE_CRITERIA.md for affected features needs new ACs for both modes; TEST_PLAN.md needs cases for automatic self-completion and manual tick-off with/without proof.
- Human confirmation: Dhruv Verma, 2026-09-17.
- Docs updated: DECISIONS.md (PD-044, this entry). Still to update: PRD.md scope section, affected features' ACCEPTANCE_CRITERIA.md and TEST_PLAN.md, DEVELOPMENT_PLAN.md if it changes feature sizing.
- **Amended by CHG-009 (2026-09-24):** Automatic mode becomes a plain event with no status; see CHG-009, which also carries the PRD, ARCHITECTURE and DEVELOPMENT_PLAN updates this entry left outstanding.

### CHG-002 — `budget`/`events` `src/server/<domain>/` contract files: ownership reconciled to UI-00 (initial shape) / Lane B (extension)
- Date / requested by: 2026-09-17 / Dhruv Verma (human, project lead)
- Type: architectural change (doc reconciliation, no code/behaviour change)
- Description: UI-00's PRD.md Scope explicitly required creating `src/server/budget/queries.ts` and `src/server/events/{queries,actions}.ts` (needed to implement AC-04's `getBudgetSummary`), but `docs/AGENT_REFERENCE.md`'s folder-ownership table assigned all of `src/server/**` (except `data-source.ts`) to Lane B with no carve-out, and `ARCHITECTURE.md` §3.1's directory-layout tags didn't call out these two files as UI-00-owned the way `types/domain.ts`/`mocks/`/`data-source.ts` were. UI-00 built the files anyway (new/additive, nothing pre-existing in Lane B's territory) and flagged the doc gap (FD-02) for reconciliation rather than resolving it unilaterally.
- Source / justification: found during PR review of UI-00 (feature/shared-domain-contracts-fixtures, PR #11) when the human asked for this to be resolved.
- Impact: `ARCHITECTURE.md` §3.1 (directory layout note + data-source-adapter principle) and `docs/AGENT_REFERENCE.md`'s folder-ownership table updated to state: UI-00 authors the initial `queries.ts`/`actions.ts` contract shape for the `budget` and `events` domains only; Lane B and dashboard wiring features extend (not recreate) those two, and author every other domain's contract files from scratch. No other domain, no code, and no AC changed.
- Human confirmation: Dhruv Verma, 2026-09-17.
- Docs updated: ARCHITECTURE.md §3.1, docs/AGENT_REFERENCE.md folder-ownership table, DECISIONS.md (this entry).

### CHG-003 — commitlint `subject-case` conflicts with the project's feature-ID conventions
- Date / requested by: 2026-09-19 / Dhruv Verma (human, project lead)
- Type: architectural change (tooling/CI convention; no product behaviour change)
- Description: CI's `commitlint` job rejects commit subjects that begin with a feature ID. The `subject-case` rule ("subject must not be sentence-case, start-case, pascal-case, upper-case") reads a leading `UI-02` as upper-case, so `feat(shared): UI-02 forms kit …` and `test(shared): UI-02 forms kit tests …` both fail, while `docs(shared-forms-kit): claim UI-02` passes because the ID is not leading. This sits against the project's own conventions, which put feature IDs at the front everywhere else: PR titles are `<ID> <Feature name>` (`docs/DEVELOPMENT_WORKFLOW.md` §8) and test titles start `[<ID>][AC-xx]` (CLAUDE.md §5). CLAUDE.md §8's commit examples (`feat(family): …`) neither require nor forbid a leading ID, so the convention is genuinely undefined for commit subjects.
- Source / justification: found in CI on UI-02 (`feature/shared-forms-kit`, PR #41) — see FD-08 in `docs/development/shared/shared-forms-kit/DECISIONS.md`. The owner chose to merge UI-02 with `commitlint` red rather than rewrite pushed history (CLAUDE.md §3) or change another lane's config mid-feature.
- Impact: needs a decision and a fix on **F0-03 (shared-ci-pipeline)** — either relax/configure `subject-case` to permit a leading feature ID, or state in CLAUDE.md §8 that commit subjects never lead with one and keep the rule as-is. Until then `commitlint` stays red wherever a subject leads with an ID. UI-02 merged with it red by decision; no AC, test or product behaviour is affected. Note `main` is independently red on `build` and `e2e` until F0-07 (see FD-07).
- Human confirmation: Dhruv Verma, 2026-09-19.
- Docs updated: DECISIONS.md (this entry). Pending on F0-03: `commitlint.config.mjs` and/or CLAUDE.md §8.

### CHG-004 — Extend events contract and add documents read; extend mock fixtures
- Date / requested by: 2026-09-19 / Dhruv Verma (human, project lead)
- Type: new feature (shared, Lane S) and architectural change (contract extension)
- Description: a new shared feature, **UI-04** (`feature/shared-screen-contracts-fixtures`, PR → `main`), (1) defines `getTaskLog` as newest first by `start` instant, ties by `key` ascending, `total` = count after `q`/`status`, page size 20, a page past the last returns no items with the right `total`, and validates its input with the existing Zod `TaskLogQuerySchema`; (2) adds `getOccurrence(clientId, key): Promise<Occurrence | undefined>` to `src/server/events/queries.ts`; (3) adds a new domain `src/server/documents/queries.ts` with `getEventDocuments(clientId, eventId): Promise<EventDocument[]>` (metadata only, no signed URL or download); (4) extends `src/mocks/**` so Margaret's fixtures match the design (26–30 Nov 2026, header 78 years · Preston VIC), add a deterministic long history (over 120 completed occurrences), long text (about 100-character task title, about 50-character carer name), event-attached documents, and a second client's occurrences for isolation tests. Mock-only, no database.
- Source / justification: FAM-UI-01 (Home) and FAM-UI-07 (Task log and detail) found gaps they cannot fix from lane F (their DECISIONS.md FD-02, FD-03, FD-04, FD-08 and FD-12): no defined order or bounded paging, no way to open an occurrence outside the first page, no documents contract, and fixtures that do not carry the design's data. Human instruction in-session, 2026-09-19: "it should be able to do everything like getting logs in full without limitations", open any task, and see attached documents.
- Impact: `src/server/events/queries.ts` (extended, not recreated, per CHG-002), `src/server/documents/queries.ts` (new; per CHG-002 every other domain's contract files are authored from scratch, here by Lane S by human decision), `src/types/domain.ts`, `src/mocks/**`; DEVELOPMENT_PLAN.md gains the UI-04 row and card. Existing test expectation changed: `tests/integration/shared-app-shell-clients-contract.test.ts` (Margaret's age and suburb, now matching the design), recorded in the feature DECISIONS.md. FAM-14, FAM-15 and F0-11 must implement the same ordering, `total` and validation semantics against Supabase. No family feature PRD is edited by this change.
- Human confirmation: Dhruv Verma, 2026-09-19 (in-session).
- Docs updated: DECISIONS.md (this entry), DEVELOPMENT_PLAN.md (UI-04 row, card, totals), `docs/development/shared/shared-screen-contracts-fixtures/`.

### CHG-005 — FAM-UI-07 Task log scope: full-history server-driven search, filter and pagination (supersedes the PRD line "client-side over fixtures")
- Date / requested by: 2026-09-19 / Dhruv Verma (human, project lead)
- Type: scope change
- Description: the FAM-UI-07 PRD Scope says search and filter act on fixtures client-side (server search comes with wiring). That is replaced: the Task log is the whole, server-driven history. The screen reads `q`, `status` and `page` from the URL, validates them, calls `getTaskLog(clientId, {q, status, page})`, shows `total`/`pageSize` and a pager, and never filters or re-sorts in the browser; Task detail opens any occurrence, past or future, through `getOccurrence`; its Documents card reads `getEventDocuments`. The contract these need is delivered by UI-04 (CHG-004).
- Source / justification: human instruction in-session, 2026-09-19: "it should be able to do everything like getting logs in full without limitations". A real person will use and add to the app, so every screen must work for whatever data builds up, not only for sample rows.
- Impact: FAM-UI-07 PRD Scope and Functional Requirements, AC wording (its AC-02 and AC-03 already reworded and AC-05 to AC-08 added on its branch, FD-12) and TEST_PLAN, updated by the family agents in their own lane; FAM-14 (Task log wiring) and FAM-15 (Task detail wiring) implement the same contract on Supabase. FAM-UI-01 (Home) reads the same contract and its Recent activity and Overdue composition follow the newest-first order. No family feature document is edited by this shared feature.
- Human confirmation: Dhruv Verma, 2026-09-19 (in-session).
- Docs updated: DECISIONS.md (this entry). The family features record it in their own DECISIONS.md.

### CHG-008 — Events contract: single-event read `getEvent`
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: contract extension (shared folders changed from a dashboard feature branch)
- Description: no Phase 1 contract returned an event's series fields. `Occurrence` has no recurrence, so Edit event could not show 'Weekly'. Added `getEvent(clientId, eventId): Promise<CareEvent | undefined>` to `src/server/events/queries.ts` (extended, not recreated, per CHG-002), and its mock in `src/mocks/queries/events.ts`, reading `CARE_EVENTS`. It returns `undefined` for an unknown id or another client's event. Supabase mode throws the standard not-implemented error. No fixtures or types changed.
- Source / justification: human answer in-session, 2026-09-24 ("Add getEvent on this branch"), same route as CHG-012 (then numbered CHG-006).
- Impact: F0-11 must implement `getEvent` against Supabase with the same client scoping. FAM-07 (Edit event wiring) reads through it; CAR-07 may too. FAM-UI-03 only otherwise.
- Numbering: CHG-006 and CHG-007 are on unmerged branches (`feature/family-ui-calendar`, `feature/admin-ui-home`). Whichever merges later renumbers.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); `docs/development/family-dev/family-ui-event-form/DECISIONS.md` FD-01.

### CHG-009 — Tasks and plain events: every event is either a task (ticked off by hand) or a plain event (no status); the Task log becomes the Care log
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change (amends PD-044 and CHG-001)
- Description:
  - **Model.** Every calendar item is an event. A **task** is an event that must also be ticked off by hand, with the actor's name recorded, and becomes Overdue if nobody ticks it off by its due time (PD-044 Manual, unchanged). A **plain event** has **no status**: it is never Planned, Done or Overdue and cannot be ticked off. This replaces PD-044's Automatic self-completion. Data: the existing `completion_mode` field stays (`manual` = task, `automatic` = plain event); the UI only ever says "Task" or "Event".
  - **Form switch.** The event form has one switch, "This is a task — must be ticked off". It starts **on** for a new event and shows the current value when editing.
  - **Changing it is forward only.** Switching never changes past occurrences: they keep their status and recorded actors (append-only history, PD-005). Switching an event to a task does not make past occurrences Overdue. The value can be changed at any time; "set once per event" in PD-044 no longer applies.
  - **Edit scope.** The switch follows the PD-045 scope choice. "This occurrence only" makes one occurrence differ from its series (a PD-004 per-occurrence override). "This and future" applies from that occurrence onward. "Entire series" applies from now onward, never before now.
  - **Who can change it.** Anyone who can edit the event can switch it either way: Family at any time, a carer during an active shift for that client (PD-041). The change is captured by the append-only audit log (PD-006). No screen shows it for now; a Family alert is parked as **PL-23**.
  - **Where each appears.** Anything with a checkbox shows **tasks only**: the Family Calendar Tasks panel, the Carer Home Tasks checklist and the Carer Calendar "Tasks for the selected shift". Overdue lists (Family Home Overdue, Admin Home overdue) contain only tasks, since a plain event cannot be Overdue. Anything that shows the schedule or history shows **both**: Family Home Today timeline, Family Calendar day/week/month, Carer Home "Today's calendar", Carer Calendar blocks, the Calendar Log panel and the Care log.
  - **Calendar look.** A plain event gets a fourth, neutral block look: neutral colour, no status shape, and the word "Event" where the block has room. Tasks keep the Planned, Done and Overdue looks. Status is still never conveyed by colour alone.
  - **Care log.** The Family "Task log" is renamed **"Care log"** and lists tasks and plain events. The page title, the "View all" links on Home and Calendar and the detail page's back link ("Back to Care log") change; the route stays `/family/[clientId]/tasks`. The Status column shows "Event" for a plain event. The filter gains a type choice, **All / Tasks only / Events only**; the Planned, Done and Overdue status filters return tasks only. The Nurse column is unchanged for plain events: the carer whose shift covers the start (PD-055), or "—".
  - **Detail page.** Opening a plain event from the Care log shows the same page as a task, except the Status card reads "Event" with "No tick-off needed" and no pill or completion time. Description, Edit and Documents work as for a task; documents on a plain event are attachments, not proof of completion.
- Source / justification: human instruction in-session, 2026-09-24, refining PD-044: "tasks" are events with the extra function of being ticked off by hand; plain events "would just exist" (a walk vs picking up a prescription); only tasks belong in the task (checkbox) sections; all events and tasks go into the log. Decided question by question in a grilling session with the human on 2026-09-24.
- Impact:
  - **Shared (Lane S, all shared features are merged):** needs a **shared follow-up feature**, not yet planned. `src/types/domain.ts` (an occurrence of a plain event has no status; `TaskLogQuerySchema` gains a type filter), `src/mocks/**` (plain-event fixtures in the log and calendar), UI-01 calendar kit (neutral "Event" block look in `status-cue` and day, week and month grids, event popover), UI-03 lists (a neutral "Event" label where a status pill would go), `getTaskLog` / `getOccurrence` / `getTodayOccurrences` contract semantics (UI-04). Until it merges, dashboard features cannot show plain events correctly.
  - **Backend (Lane B):** F0-11 keeps `completion_mode`; status derivation returns no status for a plain-event occurrence; `set_occurrence_done` rejects plain-event occurrences; per-occurrence mode overrides; mode changes never apply before now. F0-16 seeds plain events.
  - **Family:** FAM-UI-01 / FAM-01 (Today timeline shows both), FAM-02 (Overdue tasks only; Recent activity unchanged: Done or Overdue rows, so tasks only), FAM-UI-02 / FAM-04 (neutral event look), FAM-05 (Tasks panel tasks only; Log panel both), FAM-06 / FAM-07 (the switch, default on, scope rules; FAM-UI-03 needs no change), FAM-UI-07 / FAM-14 / FAM-15 (Care log name, type filter, "Event" label, plain-event detail).
  - **Carer:** CAR-UI-01 / CAR-01 (Today's calendar both; Tasks checklist tasks only), CAR-UI-03 / CAR-05 (blocks both; selected-shift tasks only), CAR-06 (tick-off applies to tasks only), CAR-07 (the switch).
  - **Admin:** ADM-01 overdue list is tasks only by definition; no change.
  - **Tests:** each affected feature adds cases for plain events (no status, excluded from checklists and Overdue, included in schedule views and the Care log, type filter, forward-only switching, per-occurrence switch).
  - **Numbering:** CHG-006, CHG-007 and CHG-008 are used on unmerged feature branches (`feature/admin-ui-home`, `feature/family-ui-calendar`, `feature/family-ui-event-form`), so this entry takes CHG-009 to avoid a clash.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session; asked for these docs to be changed and a PR opened).
- Docs updated: DECISIONS.md (this entry; amendment notes on PD-044 and CHG-001), PRD.md (REQ-17, REQ-18, REQ-21, new REQ-35, nav table, permissions, PL-23), ARCHITECTURE.md (§6 `care_events` and `care_event_overrides` rows, §6.3 status derivation, flow 2 'Tick task'), DEVELOPMENT_PLAN.md (CHG-009 notes on the affected cards). Each lane updates its own feature PRD, ACCEPTANCE_CRITERIA and TEST_PLAN when it starts or resumes an affected feature, and records it in that feature's DECISIONS.md (same approach as CHG-005).

### CHG-010 — Self-serve sign-up (F0-17): Family and Organisation accounts; carers invite-only
- Date / requested by: 2026-09-24 / Prajeet (human, in-session)
- Type: new feature (shared, Lane B) and scope change (PL-18 registration half; PD-040 invitation wording)
- Description: add **F0-17 — Self-serve sign-up for Family and Organisation accounts** (`feature/shared-sign-up`, PR → `main`). A `/sign-up` page in the `(auth)` layout, built the same way as `/sign-in`, asks for the account type (Family or Organisation), first name, last name, email, password and confirm password. A Family account also needs the client's first and last name. An Organisation account also needs the organisation name. A security-definer Postgres function creates the profile and the linked record in one transaction: the client plus a `client_family_members` row for Family, or the organisation plus `profiles.organisation_id` for an admin. After sign-up the user is signed in and routed like any sign-in (F0-07): Family to `/family/<new client id>/home`, admin to their MFA gate and then `/admin/home`. Full rules: PD-057.
- Source / justification: human instruction in-session, 2026-09-24 (PD-057). PD-037 says the family creates the client, but no feature created a family account, so the confirmed workflow could not start.
- Impact:
  - **New feature F0-17** (shared, Lane B): `src/app/(auth)/sign-up/`, `src/server/auth/actions.ts` (new `signUp` action), a new migration (registration function, grants; users still cannot change their own `role`, `organisation_id` or `is_active`), a 'Create an account' link on `/sign-in`. Tests: integration, e2e and pgTAP (see its TEST_PLAN).
  - **F0-07** (merged): no change to its ACs. `/sign-in` gains a link to `/sign-up`, made by F0-17 in the same lane.
  - **ADM-02:** unchanged. Carers are still created by admin invitation. The public sign-up must never create a carer.
  - **ADM-04:** the card still reads "adds a client with a family contact". That flow was already rejected by PD-037, and CHG-010 confirms that clients are created only by families. ADM-04 becomes the clients **list** (read and Remove per ADM-05) with no add panel. Lane A updates its own PRD, ACs and TEST_PLAN when it starts ADM-04, and records it in that feature's DECISIONS.md. The Admin Clients design's "Add client" panel is still the HUMAN REVIEW design item raised by PD-037.
  - **FAM-13:** a self-registered family's client has **no organisation** at first. FAM-13's organisation card must handle "no organisation yet" with a 'Choose organisation' action (picker, no transfer confirmation, since there is nothing to transfer). Lane F records it when it starts FAM-13.
  - **PL-18:** split. Organisation **registration** moves into F0-17; Add/Delete organisation by an operator stays parked.
  - **Risks raised for the human, not decided here:**
    1. **Admin MFA mismatch — DECIDED 2026-09-24 (Prajeet): MFA is not mandatory.** PD-040 says no mandatory MFA, but F0-07 shipped forced TOTP enrolment for admins (its feature CHG-001 says OQ-08 answered "TOTP MFA required", which misreads PD-040). **Follow-up needed:** a shared fix that removes the forced admin enrolment and AAL2 gate from `src/server/auth/routing.ts` / `guard.ts` and changes F0-07's AC-09/AC-10 and T-09/T-10 (a test-expectation change, flagged HUMAN REVIEW). F0-17 does not make that change; its AC-02 only requires that a new admin is routed the same way an existing admin is.
    2. **Anyone can create an organisation.** It then appears in the family organisation picker (PD-036). Someone could register a lookalike of a real provider's name and a family could link their client to it. **Note (Prajeet, 2026-09-24): every organisation should have a unique identifier**, so that two organisations can never be confused in the picker. Which identifier (e.g. ABN) and when it is required are still to be decided. Parked as **PL-24** for the human to prioritise.
    3. **No email confirmation.** A mistyped email address can create an account the real owner does not control. Supabase also reports "already registered" on sign-up, so account enumeration is possible on `/sign-up` (not on `/sign-in` or reset). Accepted by the human for MVP. Worth re-checking before production, together with the PD-040 MFA note.
  - **Numbering:** CHG-006 to CHG-008 are taken on unmerged branches (see CHG-009), so this entry is CHG-010.
- Human confirmation: Prajeet, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (PD-057, this entry, amendment note on PD-040), PRD.md (REQ-01, REQ-09, new REQ-36, PL-18, new PL-24), DEVELOPMENT_PLAN.md (F0-17 row and card, totals, next number, CHG-010 notes on ADM-04 and FAM-13), `docs/development/shared/shared-sign-up/`.

### CHG-011 — Plain events on the calendar use a solid neutral stripe; on compact surfaces they may differ from Planned tasks by colour alone
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change (amends CHG-009 "Calendar look" and UI-05 AC-12)
- Description: a plain event's calendar block and month chip carry a **solid** neutral stripe (token `text-secondary` grey) instead of a patterned one, with no status shape. The word "Event" is still visible where the block has room (day view `full` tier, event popover) and is always in the accessible name. On compact day blocks, week blocks and month chips — where a Planned task also has no shape and the status word is read out to screen readers only — a plain event differs **visually** from a Planned task by stripe colour alone. This is an accepted exception for **event type** only: task **status** (Planned, Done, Overdue) is still never conveyed by colour alone (CLAUDE.md §7 unchanged for status).
- Source / justification: human instruction in-session, 2026-09-24, after reviewing the dotted-bar preview: "I don't like the grey dotted line … just have the same grey as a stripe rather than dots"; the colour-alone trade-off was put to the human, who chose "stripe only".
- Impact: UI-05 AC-12 reworded (event type exempt from the colour-alone rule on compact surfaces; status still covered); UI-05 FD-05; UI-01 calendar kit `EVENT_CUE`. Dashboard features that show plain events (FAM-UI-01/02, FAM-04/05, CAR-UI-01/03, CAR-05) inherit the look; no test changes outside UI-05.
- Numbering: recorded as CHG-010 on `feature/shared-plain-events`; renumbered to CHG-011 when merging `main`, where CHG-010 is self-serve sign-up (F0-17).
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry), `docs/development/shared/shared-plain-events/ACCEPTANCE_CRITERIA.md` (AC-12), `docs/development/shared/shared-plain-events/DECISIONS.md` (FD-05).

### CHG-012 — Events contract: calendar range read `getOccurrences` and `getToday`; design-week fixtures to 6 Dec
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: contract extension (shared folders changed from a dashboard feature branch)
- Description: no Phase 1 contract could answer "this client's occurrences from date X to date Y", so no calendar could draw any week but the reference day. Added to `src/server/events/queries.ts` (extended, not recreated, per CHG-002): `getOccurrences(clientId, { from, to })`, which returns occurrences on Melbourne calendar days `from` to `to` inclusive, oldest first, ties by key, validated by `OccurrenceRangeSchema` (at most `OCCURRENCE_RANGE_MAX_DAYS` = 42, one 6×7 month grid). Also added `getToday()`, the Melbourne calendar date the calendar opens on (the fixtures' reference day in mock mode, the real day otherwise). In `src/mocks/**`: the mock implementations, plus five hand-written Planned rows, Tue 1 to Sat 5 Dec 2026, exactly as drawn in `family-02-calendar.png`. They are held in `UPCOMING_OCCURRENCES_BY_CLIENT_ID`, which `getOccurrences` and `getOccurrence` read and `getTaskLog` does not (a log lists what has happened, and the Task log fixtures stay at 137 rows). `src/types/domain.ts` gains `OccurrenceRangeSchema`, `OccurrenceRange` and `OCCURRENCE_RANGE_MAX_DAYS`.
- Source / justification: human instruction in-session, 2026-09-24: "make on this feature branch". The app is real, not a design clone: users add events on any date, so the calendar must read any range. Events will live in the database; F0-11's PRD already names `getOccurrences(clientId, range)` for the Supabase side, and this is its Phase 1 mock with the same name and shape.
- Impact: F0-11 must implement `getOccurrences` against Supabase with the same range, order and validation semantics (recurrence expansion, overrides, latest completion, assigned carer). CAR-UI-03 (Carer Calendar) has the same gap, probably as a carer-wide read across patients, and should extend this contract rather than add a second pattern. FAM-04 and FAM-05 wire FAM-UI-02 through it. No other screen changes behaviour.
- Numbering: recorded as CHG-006 on `feature/family-ui-calendar` (its code comments and commit messages before the merge say CHG-006); renumbered to CHG-012 when merging `family-dev`, where CHG-006 to CHG-011 were taken. `feature/admin-ui-home` (unmerged) also records a CHG-006 and renumbers when it merges.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); `docs/development/family-dev/family-ui-calendar/DECISIONS.md` FD-01, FD-02.

### CHG-013 — FAM-UI-02: keyboard shortcuts and a Today button on the Family Calendar
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change (new ACs on an in-flight feature)
- Description: FAM-UI-02 gains AC-06 (D / W / M switch the view; ← / → step one day, week or month by view) and AC-07 (a Today button beside the range heading, also on T, returns to today in the current view). Shortcuts are ignored while typing in a text field, with Ctrl/Cmd/Alt held, and on key repeat. The arrows and Today expose `aria-keyshortcuts` and a tooltip.
- Source / justification: human instruction in-session, 2026-09-24. Not in the design (`family-02-calendar.png`).
- Impact: FAM-UI-02 only (ACCEPTANCE_CRITERIA AC-06, AC-07; TEST_PLAN T-06, T-07; feature DECISIONS FD-12). No shared folders changed. CAR-UI-03 may want the same behaviour for consistency.
- Numbering: recorded as CHG-007 on `feature/family-ui-calendar`; renumbered to CHG-013 when merging `family-dev`.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); FAM-UI-02 ACCEPTANCE_CRITERIA.md, TEST_PLAN.md, DECISIONS.md, PROGRESS.md, SESSION_STATE.md.

### CHG-014 — Task detail: an "Edit event" button, and Back returns to where the task was opened from
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change on a merged feature (FAM-UI-07)
- Description: Task detail stays read-only. (1) A clear outlined "Edit event" button sits at the right of the title row (it wraps below a long title on narrow widths, never overlapping) and links to the existing Edit event route; the small "Edit" link in the Description card is removed, so there is one edit control. (2) Back returns to the screen the task was opened from, on the exact view: every link to Task detail carries an origin marker, `from=calendar` plus the calendar's `view / date / month`, `from=home`, or `from=tasks` plus the Task log's `q / status / page`. Task detail shows "Back to Calendar", "Back to Home" or "Back to Task log". A missing or invalid origin keeps the old behaviour ("Back to Task log" with any valid Task log params). The Back href is rebuilt only from a whitelisted origin name and params re-validated by that screen's own parser; no URL or path is ever read from the query, and `router.back()` / `history.back()` are not used (they break on reload, shared links and arrivals from outside the app).
- Source / justification: human instruction in-session, 2026-09-24: "keep it as the read only mode but then have a edit button which takes you to the edit page", "add a clearer edit event button", and "going back should take [you] not to task log but wherever you clicked the link from originally".
- Impact: FAM-UI-07 (new AC-09, AC-10, AC-11; TEST_PLAN T-20 to T-22; feature DECISIONS FD-27 to FD-30; existing tests' expected hrefs and the Description Edit link changed, FD-30). FAM-UI-02 (Calendar blocks and Log rows) and FAM-UI-01 (Home's Today, Overdue and Recent activity rows) now add the origin to their Task detail links. The design differs from `family-08-task-detail.png`: the button placement is new and the back label varies. FAM-UI-03 (Edit event) is unchanged; its Cancel uses `router.back()` and the Task detail link does not pass `?occurrence=` (follow-ups, FAM-UI-07 FD-29). No shared folders changed.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); FAM-UI-07 ACCEPTANCE_CRITERIA.md, TEST_PLAN.md, DECISIONS.md, PROGRESS.md, SESSION_STATE.md.

### CHG-015 — Edit event and Add event return to a validated origin; Edit event opens on the occurrence being viewed
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change on a merged feature (FAM-UI-03), closing the CHG-014 follow-ups (FAM-UI-07 FD-29)
- Description: (1) Task detail's "Edit event" button links to the Edit event route with `?occurrence=<key>` and Task detail's own origin (`from=` plus that screen's params, CHG-014), so the form opens on the occurrence being viewed. (2) On Edit event, Save event (after validation) and Cancel go to that occurrence's Task detail with its origin kept, so Back from there still reaches the Calendar, Home or Task log view it started on. If the occurrence is missing, unknown or belongs to another event, they go to the origin screen itself, and with no origin to the Task log. (3) On Add event, Save event (after validation) and Cancel go to Home, its only opener. (4) The target href is built only from a whitelisted origin re-validated by that screen's parser (`task-detail-origin.ts`) and an occurrence key the contract confirms belongs to the event; nothing is echoed from the URL. Navigation is `router.push(href)`; `router.back()` is no longer used. Save still persists nothing (FAM-UI-03 FD-04, Phase 1).
- Source / justification: human instruction in-session, 2026-09-24: Step 2 brief (FD-29 (a) and (b): "Make them return to a validated origin, the same way Task detail's Back works … whitelist only, never echo a URL"; "Pass it from Task detail's Edit event button"), and "do both" (the CHG as proposed, and including Add event).
- Impact: FAM-UI-03 (new AC-07 to AC-09, TEST_PLAN T-07 to T-09, feature DECISIONS FD-09 onward; FD-04's navigation is superseded; existing tests asserting `router.back()` change: HUMAN REVIEW). FAM-UI-07 (the "Edit event" href gains the occurrence and origin; FD-29 closed). No shared folders changed.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); FAM-UI-03 ACCEPTANCE_CRITERIA.md, TEST_PLAN.md, DECISIONS.md, PROGRESS.md, SESSION_STATE.md; FAM-UI-07 DECISIONS.md (FD-29 status).

### CHG-016 — Family Calendar: a tick in the Tasks panel shows on the grids, with who ticked it
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change on a merged feature (FAM-UI-02)
- Description: (1) Ticking a task in the Calendar's Tasks panel makes its block in the week, day and month views show Done at once, on the same page, with the signed-in person's name where the view shows a name ("Done · <First Last>", read through the existing `getCurrentUser("family")` contract, the same form `setOccurrenceDone` records). (2) Unticking restores the task's original status (Planned or Overdue); a task that was Done in the data shows Planned, without its old name (PROPOSED: whether a past task counts as Overdue is a business rule for FAM-04 / FAM-05). (3) Display only: nothing is saved, it is lost on reload or on moving to another range, and the Log panel and Task detail are unchanged. FAM-05 later replaces the local tick with `setOccurrenceDone` and keeps the same state as its optimistic update. (4) Plain events (no checkbox, no status) are untouched.
- Source / justification: human instruction in-session, 2026-09-24: chose option (a) "Grids show ticks now" for the Step 3 question (ticks were local to the Tasks panel and the block stayed "Planned"), and "I think it makes sense but it should record the person who ticked it".
- Impact: FAM-UI-02 (new AC-08, TEST_PLAN T-08, feature DECISIONS FD-13; the calendar tests gain mocks for `getCurrentUser` and `setOccurrenceDone`, no existing assertion changed). Lane F only (`src/features/family-calendar/**`); the kit grids are unchanged. FAM-05's wiring should reuse the lifted tick state.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); FAM-UI-02 ACCEPTANCE_CRITERIA.md, TEST_PLAN.md, DECISIONS.md, PROGRESS.md, SESSION_STATE.md.

### CHG-017 — Family Calendar: an "Enter event" button that returns to the Calendar
- Date / requested by: 2026-09-24 / Dhruv Verma (human, project lead)
- Type: scope change on merged features (FAM-UI-02, FAM-UI-03)
- Description: (1) The Family Calendar toolbar gets a primary "Enter event" link, the same wording and style as Home's, just left of the D/W/M control, 44px tall. It opens Add event with the Calendar's origin (`from=calendar` plus its `view / date / month`, the selected day included, CHG-014's format). (2) On Add event, Save event (after validation) and Cancel go back to that Calendar view when the origin is the Calendar; otherwise, as before, to Home (CHG-015). The origin is re-validated by the Calendar's own parser; nothing is echoed from the URL. (3) The form is not prefilled with the selected date. Nothing persists (Phase 1).
- Source / justification: human instruction in-session, 2026-09-24: "it's missing the add event button like there is for the home page … put a similar button in for the calendar page next to the toggles for D, W, M", and the answers "Back to Calendar view", "No prefill", "\"Enter event\", primary".
- Impact: FAM-UI-02 (new AC-09, TEST_PLAN T-09, feature DECISIONS FD-14; the design `family-02-calendar.png` has no such button: design review). FAM-UI-03 (new AC-10, TEST_PLAN T-10, feature DECISIONS FD-11; AC-09's "its only opener" now means "with no Calendar origin", no existing assertion changed). Lane F only; no shared folders changed.
- Human confirmation: Dhruv Verma, 2026-09-24 (in-session).
- Docs updated: DECISIONS.md (this entry); FAM-UI-02 and FAM-UI-03 ACCEPTANCE_CRITERIA.md, TEST_PLAN.md, DECISIONS.md, PROGRESS.md, SESSION_STATE.md.

### CHG-019 — Fund history contract, and the Family · Budget design fixtures
- Date / requested by: 2026-09-25 / Dhruv Verma (human, project lead)
- Type: contract extension (shared folders changed from a dashboard feature branch)
- Description: no Phase 1 contract returned a client's fund entries, and `FUND_ENTRIES` did not hold what the design draws. Added, read-only: `getFundHistory(clientId): Promise<FundEntry[]>` to `src/server/budget/queries.ts` (extended, not recreated, per CHG-002): the client's entries, newest date first; `[]` for a client with none or an unknown id. Its mock is in `src/mocks/queries/budget.ts`. `src/mocks/fixtures.ts`: `FUND_ENTRIES` now holds Margaret's three top-ups exactly as `family-06-budget.png` draws them (3 Nov 2026 "NDIS quarterly plan top-up" +$6,000; 15 Oct 2026 "Fixed funding top-up" +$1,000; 1 Oct 2026 "Government subsidy payment" +$750) and one entry for Robert, so client scoping is testable. The two earlier entries (a 1 Nov top-up worded "Quarterly NDIS plan top-up" and a 15 Nov physiotherapy expense of -$320) are replaced; only `fixtures.test.ts` referenced them, and it only parses them against the schema. No types change (`FundEntry` exists). Supabase mode throws the standard not-implemented error. Nothing here writes: Update on the Budget screen changes nothing (Phase 1).
- Source / justification: human answer in-session, 2026-09-25 (chose "On this branch as CHG-019" over a separate shared PR), same route as CHG-008, CHG-012 and CHG-018.
- Impact: FAM-UI-05 (`src/features/family-budget/**`). F0-12 owns the budget tables. FAM-10 (Budget overview and history) reads and wires through this contract and must keep the newest-first order and the client scoping, and add PD-034's attribution of each entry to the person who recorded it (the design draws no such column, FAM-UI-05 FD-05). FAM-11 (Update funds) writes the entries this reads. The Admin Budget screen and CAR-08 should extend this contract, not add a second pattern. The fixtures are display data, not a ledger: the three top-ups do not reconcile with the buckets' totals.
- Numbering: CHG-018 (FAM-UI-04, PR #89) is unmerged and is not in `family-dev` yet; this is CHG-019 so the two do not collide. Whichever merges second resolves the neighbouring entries in this file.
- Human confirmation: Dhruv Verma, 2026-09-25 (in-session).
- Docs updated: DECISIONS.md (this entry); `docs/development/family-dev/family-ui-budget/DECISIONS.md` FD-02.

Template for future entries:
```
### CHG-xxx — <title>
- Date / requested by:
- Type: new requirement | new feature | scope change | architectural change
- Description:
- Source / justification:
- Impact: features, ACs, tests, docs
- Human confirmation: <name, date>
- Docs updated:
```
