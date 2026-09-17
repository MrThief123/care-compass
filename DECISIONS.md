# DECISIONS — Care Compass

This file holds: (1) planning-freeze status, (2) recorded project decisions (PD-xxx), (3) open decisions needing a human (OQ-xx), (4) the source-conflict register, and (5) controlled changes (CHG-xxx).
Feature-level decisions live in each feature's `DECISIONS.md`.

---

## 1. Planning freeze
Status: **NOT FROZEN** — the planning pack is unvalidated (Stage G0). F0-01 produces `docs/VALIDATION_REPORT.md`; the freeze is declared here after human approval.

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

### PD-029 — No AGENTS.md; Next.js agent rules live in CLAUDE.md §15 (HUMAN REQUEST)
- Date: 2026-09-17 · Requested by: human
- Decision: delete `AGENTS.md` and the `@AGENTS.md` import. CLAUDE.md §15 carries the rule to read `node_modules/next/dist/docs/` before writing Next.js code. If `next dev` re-creates AGENTS.md, delete it again and add it to `.gitignore` (F0-02).
- Human confirmation: requested by the human 2026-09-17.

---

## 3. Open decisions (human input required)

Blocking decisions stop the listed features until answered. Record answers as PD entries and change the status to ANSWERED.
**Gate 0 decisions (needed before any work): OQ-01, OQ-20.** All decisions below are OPEN and stay OPEN until the human closes them. `docs/SPRINT_PLAN.md` §4 shows the day each one first blocks sprint work.
Claude Code never changes a status in this table, never adds an ANSWERED heading, and never acts on a proposed default for a blocking decision.

| ID | Decision needed | Conflict / context | Sources | Blocking | Blocks features | Proposed default | Status |
|---|---|---|---|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | The Git model requires every feature to belong to one dashboard stream and forbids feature branches from main, but Phase 0 foundation and some Phase 4 work serve all three dashboards. | User constitution §5–6 | YES | F0-01, F0-02, F0-05, F0-03, F0-14, UI-00, F0-15, UI-01, UI-02, UI-03, F0-04, F0-09, F0-06, F0-08, F0-10, F0-07, F0-11, F0-12, F0-13, F0-16, INT-01, INT-05, INT-06, INT-07, INT-08 | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. | OPEN |
| OQ-02 | Dashboard phase order | The planning template lists Carer → Admin → Family; UI Specs §4 build order is Family (1–6, 13–14) → Carer (7–9) → Admin (10–12). Plan v0.2 builds the three dashboards in parallel lanes, so order now only matters when a team is too small to staff every lane (SPRINT_PLAN §2). | User constitution §7; UI-§4 | no | — | Family → Carer → Admin (source build order). Seed data (F0-16) removes cross-dashboard data dependencies. | OPEN |
| OQ-03 | Budget threshold percentages | Client Information Sheet 3 and user stories P-18/UC-F02 say 75% / 85% / 100%; UI Spec D4 and the bucket card states say 70% / 90% / 100%. The design shows Government at 92% in alert state (true under both). | CIS3 Data 6a; CIS5; US P-18; UC-F02; UI-D4; UI-§6 | YES | F0-12, FAM-03, INT-01 | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. | OPEN |
| OQ-04 | Funding model: buckets, categories and periods | Brief lists funding sources Pension, NDIS, Disability Trust, Family & other with restrictions and different accounting periods (FR-6.1–6.4). CM-0309 descoped funding rules and chose predefined categories/subcategories. The design shows three fixed buckets NDIS, Fixed, Government with no categories. Client Information Sheet No 4 (budgeting) was not supplied. | BRIEF IV, item 5; CIS5; CM-0309; UI-D1; Design Budget | YES | F0-12, FAM-03, FAM-10, FAM-11, CAR-08 | MVP: per-client buckets of kinds NDIS / Fixed / Government with one period each; categories and restrictions parked (PL-10). Obtain CIS4 before F0-12. | OPEN |
| OQ-05 | Who can add funds and record spending; Budget History contents | UI-D1 'Only Family adds funds'; CM-0409 (later) 'Organisations can edit family budgets'. Design History lists only top-ups; whether expenses appear and who records them (carer? admin?) is unstated. The Update interaction is not designed. | UI-D1, D19; CM-0409; CM-0309; US C-11; Design Budget | YES | F0-12, FAM-10, FAM-11, CAR-08 | Family adds funds; carers record expenses during shifts; admins read — confirm, and design the Update flow. | OPEN |
| OQ-06 | Organisation change model | UI-D3/D36 and the Settings design: Family 'Change organisation' → picker → confirmation. CM-0309: replace 'Change Organisation' with Add/Delete Organisation. FR-5.8: Admin transfers the client. Admin Clients design has 'Remove'. The organisation picker is not designed. | UI-D3, D24, D36; CM-0309; FR-5.8; Design Settings/Clients | YES | FAM-13, ADM-05, INT-02 | Family-initiated change per the latest design; Admin 'Remove' detaches without deleting. Picker design required. | OPEN |
| OQ-07 | Client record creation and family linking | CIS3 and CM-1908: family sets up the client and assigns a provider. Admin Clients design: admin adds client with family contact name and email. How the family contact becomes a user is undefined. | CIS3 Order 1–3; CM-1908 workflow; UI-D28; Design Admin Clients | YES | F0-06, ADM-04, ADM-05 | Admin adds client + family contact email → family receives an invitation to set a password; confirm. | OPEN |
| OQ-08 | Account provisioning, sign-in method and MFA | No sign-in screen is designed. Settings designs imply email-based password reset. Staff and family account creation (invite vs admin-set password) is undefined. NFR-3/ADR-03/TM-2108 require or strongly prompt MFA for Admin; CIS3 asks for bank-like simplicity. | CIS3; CIS5 Q&A; NFR-3; ADR-03; TM-2108; Design Settings | YES | F0-07, ADM-02, ADM-04 | Email + password via Supabase Auth, invitation emails for new users, TOTP MFA required for admins; confirm. | OPEN |
| OQ-09 | Carer access model | CM-0409: read while assigned, edit only during active shift. UI-D29: carer client-info edit rights match Family's. FR-5.2: carer cannot view clients when not scheduled. ADR-03 uses a separate assignment table; Admin Manage only assigns shifts. Undefined: what creates/ends an assignment, active-shift window, and whether carers create/edit events. | CM-0409; UI-D10, D29; FR-5.2; ADR-03; Sequence UC2, UC3; CM-0309 | YES | F0-06, F0-10, F0-11, CAR-01, CAR-03, CAR-04, CAR-06, CAR-07, ADM-07, ADM-08, INT-04 | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. | OPEN |
| OQ-10 | Status behaviour and undo | UI-D18 three statuses; the Edit event design lets users pick Overdue manually although Overdue should be derived (A-5/P-4). UI Q16: can Done be undone and by whom? CM-0309 asks how automatic Planned/Overdue works. | UI-D18, Q16; US A-5, P-4; CM-0309; Design Edit event | YES | F0-11, FAM-05, FAM-06, FAM-07, FAM-15, CAR-06 | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. | OPEN |
| OQ-11 | Editing recurring events: scope | Prototype A had 'this occurrence / this and future / entire series' and the design traceability cites it for FR-2.5, but the final Edit event design has no scope selector or cancel-occurrence control. | FR-2.5; US C-6; BRIEF item 3; DD §4, §8; Design Edit event | YES | FAM-07 | Add a scope choice when editing a recurring event (design required). | OPEN |
| OQ-12 | Recurrence options and plan horizon | FR-2.1: weekly, monthly, every 2 months, quarterly, 6-monthly, yearly, one-off. C-5: daily, weekly, monthly. CIS5: multi-year plans (e.g. 4–5 years) rolled over. Design shows a 'Recurring' select with 'Weekly' only. | FR-2.1; US C-5; CIS5 Perpetual; Design Edit event | YES | F0-09, FAM-06 | Options: Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly; repeats indefinitely unless an end date is set. | OPEN |
| OQ-13 | Staff names and job titles | CIS5: some organisations show full name, others first name + surname initial. Design shows 'Aisha R.' on records and 'Daniel K.' stored as a name. Role select shows Registered Nurse / Enrolled Nurse / Support Worker; CIS3 wants organisation-defined labels. | CIS3 #3–4; CIS5 Rostering & Q&A; UI-D33; Design Staff | YES | ADM-02 | Store first and last name; display first name + initial everywhere (matches design); job titles are a per-organisation editable list seeded with the three design values. | OPEN |
| OQ-14 | Carer notifications scope | D34 gives Carers an in-app notifications panel. The design shows notifications for 'new shift assigned', 'family updated care plan documents' and 'family added a note'. Undefined: full list of types, bell click behaviour, read/unread, retention. | UI-D34; Design Carer Home | YES | CAR-02 | Types: shift assigned/changed/cancelled, family document added, family event added/changed; bell shows unread count and scrolls to the card. | OPEN |
| OQ-15 | Incoming organisation's visibility of history | UI Q15: D24 retains everything on transfer, but can the new organisation see records created under the previous one? US P-17/A-12 say history remains available and identifiable to authorised parties. | UI-Q15; US A-12, P-15, P-17 | YES | FAM-13, INT-02 | Incoming organisation sees full history, labelled with the organisation that recorded it. | OPEN |
| OQ-16 | Family role granularity | UI Spec: Family = nominee acting under Power of Attorney (single role). CIS5 lists four groups (Carers, Managers, Family, POA). FR-5.3: Family view-only. US P-11: view-only family vs POA authority. | UI-§2; CIS3 #8; CIS5 Q&A; FR-5.3; US P-11 | YES | F0-06 | Single Family role with full family authority for MVP; view-only family parked (PL-16). | OPEN |
| OQ-17 | Hosting, email, scheduler, environments and availability | Brief: 'loaded on a Microsoft based computer … accessed by others'; NFR-1 cloud; NFR-8 99.9% with daily backups; ADR-01 notes the Supabase free tier does not meet this. Email provider and scheduler not chosen. | BRIEF wish; NFR-1, NFR-8; ADR-01; TD | YES | INT-01, INT-08 | Vercel (or equivalent) + Supabase paid tier; Resend (or Supabase SMTP) for email; Vercel Cron or pg_cron for jobs — confirm budget with client. | OPEN |
| OQ-18 | Printable schedule and data export | TM-2808 says the client moved printable export to Must; user stories v3 rate A-15 COULD and P-16 SHOULD; CIS3 requires POA/parent approval for downloads. No design. | TM-2808; US A-15, P-16; CIS3 Data 7 | no | — | Parked (PL-08) pending client priority. | OPEN |
| OQ-19 | Figma access and remaining design gaps | Figma MCP exposed only page '01 · Foundations'; screens were supplied as images (a '06 · States' sheet implies pages 02–06). Not designed: sign-in/reset pages, add-event header and title/time fields, organisation picker, budget Update, staff deactivate, client remove, custom time slot input, shift edit, expense entry, event notes/comments, carer add-event entry, admin overdue drill-down. | FIG; user-supplied screen images (17 Sep 2026) | YES | FAM-11, CAR-07, CAR-08, ADM-03, ADM-05, ADM-08, ADM-09 | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. | OPEN |
| OQ-20 | Repository and infrastructure reality | Team meeting 4/9 reports a live repository with CI, Supabase schema and RLS tests for all four roles; the human reports an essentially empty Next.js scaffold. An archived Confluence 'Tech Stack' page lists MongoDB. | TM-0409; archived Confluence 'Tech Stack'; user constitution §3 | YES | F0-01 | Treat the current repository as authoritative; ask whether any Supabase project/schema exists to adopt. | OPEN |
| OQ-21 | Rostering scope and shift patterns | Product requirements OOS-5 says rostering is out of scope; CM-1908, CM-0309, UI §7.14 and the Manage design include shift assignment. CIS5 wants organisation-configurable shift patterns and extension; the design uses fixed slot chips + Custom. | OOS-5; CM-1908; CIS5 Rostering; Design Manage | no | — | Shift assignment in scope per later sources; fixed chips for MVP, configurable patterns parked (PL-19). | OPEN |
| OQ-22 | Event fields | Home, Calendar, Task log and Task detail display event title, start time and duration, and CM-0309 says tasks require date and time, but the Edit event form only has Date, Recurring, Status, Description and Documents. | CM-0309; Design Edit event vs Home/Calendar | YES | F0-11, FAM-06, FAM-07, CAR-07 | Add Title, Start time and Duration fields to the event form (design update). | OPEN |
| OQ-23 | Dependency security tool ('X-ray') | Testing Decision selects 'X-ray' checks without naming the tool. | TD | no | — | npm audit (high) + Dependabot. | OPEN |
| OQ-24 | Undesigned empty states | UI Q17 (client with no funding) and other empty states (no events today, no history) are not in the States sheet. | UI-Q17; Design States | no | — | Use the EmptyState primitive with proposed copy flagged for review. | OPEN |
| OQ-25 | Help tooltips, FAQ and discussion board | CIS3 asks for '?'/'i' help bubbles and an editable Q&A; CIS5 adds an editable FAQ and a staff discussion board; CM-0309 agreed contextual help throughout. None designed. | CIS3 Access 6; CIS5 FAQ; CM-0309 | no | — | Parked (PL-05) pending design and priority. | OPEN |
| OQ-26 | File upload constraints | US C-4 refers to an 'agreed file-size limit'; CIS3 mentions photos and video recordings kept in perpetuity and asks about subscription fees. No limits agreed. | US C-4; CIS3 Data 4 | YES | F0-13, FAM-08, FAM-09 | PDF, JPEG, PNG, HEIC, DOCX up to 20 MB; video excluded for MVP; storage cost documented in handover. | OPEN |
| OQ-27 | Shift edit, extend and cancel workflow | CIS5 requires extending a shift; CM-0309 lists the workflow as unresolved. No design. | CIS5 Rostering; CM-0309 | YES | ADM-09 | Design required. | OPEN |
| OQ-28 | Budget email recipients and budget period | D4: family, nurse and admin. CIS5: a 'Warning Notification Entities' registry of names/emails, changeable, excluding removed organisations. E-1..E-3: POA and/or Family. 'Present period' boundaries undefined. | UI-D4; CIS5 Notifications; US E-1..E-3 | YES | INT-01 | Family + current organisation admins; registry parked (PL-02); period = bucket period. | OPEN |
| OQ-29 | Which nurse is shown on an event | Home blocks, Task log 'Nurse' and Task detail 'Assigned to Aisha R.' show an assignee; overdue rows show '—'. The event form has no assignee field. Could be derived from the shift covering the event time or stored on the event. | UI-D25; Design Home, Task log, Task detail | YES | F0-11, FAM-01, FAM-14, FAM-15, ADM-01 | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. | OPEN |
| OQ-30 | Multi-client family accounts | CM-2108 decided one account can access multiple client schedules; prior-group clarification (parent with several children); US P-10 COULD. UI Spec says Family context is one client; no client switcher designed. | CM-2108; US P-10; UI-§2 | no | — | Routes include clientId; switcher parked (PL-15). | OPEN |
| OQ-31 | Task log range | 'Every task' is unbounded for perpetual recurrences. The design shows past items and today's planned items only. | UI-D27; Design Task log | no | — | Occurrences up to end of today, newest first. | OPEN |
| OQ-32 | Timezone | All sources are Victorian; no multi-timezone requirement exists. | Design content (Preston VIC) | no | — | Australia/Melbourne for all date logic. | OPEN |
| OQ-33 | Carer calendar and task semantics | Carer Calendar is titled 'Shifts' but its blocks show events ('09:00 Margaret — Morning medication') at event times, unlike the 4-hour slots assigned in Manage. 'Tasks for the selected shift' lists checklist steps (Administer morning medication, Record in medication log, Check for side effects before leaving) that exist nowhere else. Carer Home 'Tasks' lists events. Which clients' events appear on Carer Home is undefined. | UI-D8; Design Carer Calendar, Carer Home, Admin Manage | YES | F0-11, CAR-01, CAR-05, CAR-06, INT-03, INT-04 | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. | OPEN |
| OQ-34 | Event notes and comments | CIS5 Q&A and brief item 4 require comments on completed tasks; the Carer notification 'Helen added a note to today's Afternoon check-in' implies notes exist; no note/comment UI is designed. | BRIEF item 4(i, iii); CIS5 Q&A; US C-3, C-10; Design Carer Home | no | — | Parked (PL-21) until designed. | OPEN |
| OQ-35 | Settings forms save behaviour | Family info, My info and Organisation info cards show inputs but no Save button. Unclear whether carers can edit Role and whether email changes the login email. | Design Family/Carer/Admin Settings | YES | FAM-12, CAR-09, ADM-10 | Add a Save button per card; Role read-only for carers; email field is contact email only. | OPEN |
| OQ-36 | Staff deactivation | FR-5.6/US A-2 and CIS5 require withdrawing access when staff leave; the Staff design has no deactivate/remove control. | FR-5.6; US A-2; CIS5 Q&A; Design Staff | YES | ADM-03 | Design a Deactivate action in the Add/edit panel with confirmation. | OPEN |
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

---

## 4. Source conflict register

| # | Conflict | Sources | Resolution | Status |
|---|---|---|---|---|
| C-01 | Budget thresholds 75/85/100 vs 70/90/100 | CIS3, US P-18 vs UI-D4 | OQ-03 | OPEN |
| C-02 | Fund editing: Family only vs organisation can edit | UI-D1 vs CM-0409 | OQ-05 | OPEN |
| C-03 | Change organisation vs Add/Delete organisation vs Admin transfer | UI-D3/D36 + design vs CM-0309 vs FR-5.8 | OQ-06 | OPEN |
| C-04 | Client created by family vs by admin | CIS3, CM-1908 vs UI-D28 + Admin Clients design | OQ-07 | OPEN |
| C-05 | Carer edit rights same as family vs only during shift | UI-D29 vs CM-0409 | PD-019 (shift-limited) + OQ-09 details | PARTLY RESOLVED |
| C-06 | Family view-only vs family edits, adds funds, changes organisation | FR-5.3, US v2 vs UI-D1, D9, D26, CM-0309 | Later sources win (family edits); granularity OQ-16 | PARTLY RESOLVED |
| C-07 | Supervisor confirms completion vs no approval | CIS5 Q&A vs CM-0309 | PD-020 | RESOLVED |
| C-08 | Rostering out of scope vs shift assignment designed | OOS-5 vs CM-1908, CM-0309, UI §7.14 | PD-025 / OQ-21 | PROPOSED |
| C-09 | Configurable funding sources/restrictions/periods vs three fixed buckets | BRIEF, FR-6.x vs CM-0309, UI-D1, designs | OQ-04 | OPEN |
| C-10 | Overdue as user-selectable status vs derived | Edit event design vs US A-5/P-4 | OQ-10 | OPEN |
| C-11 | Recurring edit scope present in Prototype A / traceability vs absent in final | DD §4, §8 vs Edit event design | OQ-11 | OPEN |
| C-12 | Printable export Must vs Could | TM-2808 vs US A-15 | OQ-18 | OPEN |
| C-13 | MFA Must vs should be supported vs simple bank-like login | TM-2108 vs NFR-3 vs CIS3 | OQ-08 | OPEN |
| C-14 | Repo has CI/Supabase/RLS vs empty scaffold | TM-0409 vs human | OQ-20 | OPEN |
| C-15 | Tech stack MongoDB (archived page) vs Supabase | Archived "Tech Stack" vs ADR-01 | ADR-01 wins (PD-001) | RESOLVED |
| C-16 | ERD integer money/no roles vs ADR consequences | Database Model vs ADR-01 | PD-024 | PROPOSED |
| C-17 | Carer calendar "Shifts" showing events and checklist sub-tasks vs shift slots in Manage | Carer Calendar design vs Admin Manage design, UI-D8 | OQ-33 | OPEN |
| C-18 | Client info fields requested by client vs design sections | CIS3/CIS5 vs Family Info design | OQ-38 | OPEN |
| C-19 | Email recipients: registry vs roles vs POA/Family | CIS5 vs UI-D4 vs E-1..E-3 | OQ-28 | OPEN |
| C-20 | Family context one client vs multi-client accounts | UI-§2 vs CM-2108, US P-10 | OQ-30 | PARKED |
| C-21 | FR-5.2 carer cannot view when not scheduled vs read while assigned | FR-5.2 vs CM-0409 | CM-0409 wins (PD-019) | RESOLVED |
| C-22 | Edit event form lacks title/time/duration shown elsewhere | Edit event vs Home/Calendar/Task log designs, CM-0309 | OQ-22 | OPEN |
| C-23 | "Chips over dropdowns" vs dropdowns in Recurring, Status filter, Staff Role | DD §5, §7 vs designs | Follow designs; noted OQ-39 | NOTED |
| C-24 | Screen detail source UI Spec v1 §7 referenced but not available | UI Specs §7 | Designs supplied as images; OQ-19 | PARTLY RESOLVED |

| C-25 | v0.1 sequential dashboard phases vs human request for a parallel, UI-first plan | PD-011 vs human 2026-09-17 | PD-026 | RESOLVED |
---

## 5. Controlled changes
_None yet._ Template:
```
### CHG-001 — <title>
- Date / requested by:
- Type: new requirement | new feature | scope change | architectural change
- Description:
- Source / justification:
- Impact: features, ACs, tests, docs
- Human confirmation: <name, date>
- Docs updated:
```
