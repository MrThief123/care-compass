# PRD — Care Compass (Scheduling of Care Program)

Version 0.2 · 17 September 2026 · Status: **DRAFT — pending validation (F0-01) and planning freeze**
Client: Peter Mansourian · Team: University of Melbourne COMP30022 Group 4
Labels used: **CONFIRMED** (clearly established by sources) · **PROPOSED** (plan proposal) · **UNKNOWN** · **AMBIGUOUS — HUMAN DECISION REQUIRED** (see DECISIONS.md OQ-xx). Source abbreviations: `docs/SOURCES.md`.

---

## 1. Product purpose
CONFIRMED (BRIEF): a cloud-based tool that helps the people and organisations who care for a person with special needs (PWSN) — or an elderly person receiving care — keep care on track across that person's whole life. It is a safeguard on the level of care and its cost when staff, providers and even family change over decades.

## 2. Problem statement
CONFIRMED (BRIEF, CIS3, CIS5):
- A PWSN often cannot judge their own care needs and depends on staff whose turnover, availability and diligence vary.
- Recurring needs (replacing a toothbrush head, buying clothes, dental visits, medication) are forgotten or re-entered each year.
- Records are lost when a service provider organisation (SPO) is replaced, a parent dies, or a Power of Attorney (POA) changes.
- Funds from several sources are spent without visibility, and nobody is warned before they run out.
- Previous student solutions failed on usability for non-technical, older users and never sent automatic budget warnings (prior-group clarifications; TM-1408).

## 3. Target users and roles
| Role (app) | Real-world people | Context | Status |
|---|---|---|---|
| **Family** | Parent/relative acting for the client; nominee acting under Power of Attorney | Often aged 55–80; one client (multi-client parked, OQ-30); owns the client's schedule | CONFIRMED (UI-§2); granularity AMBIGUOUS (OQ-16) |
| **Carer** | Registered nurse, enrolled nurse, support worker, including temporary staff | Shift worker on a shared laptop; one organisation, many clients | CONFIRMED |
| **Admin** | SPO manager, supervisor or head nurse (one shared dashboard) | Back office; ~42 clients, ~17 staff in design content | CONFIRMED (UI-D2) |
| Client (PWSN) | The person receiving care | Represented by Family; no login | CONFIRMED (UI-§2, ADR-03) |
| System / Email service | Scheduled jobs | Budget threshold emails | CONFIRMED |

No other staff types need access (CIS5 Q&A).

## 4. Product goals
Derived from the motivational model (root goal: *the person receiving care is safeguarded regardless of who is on shift*):
1. **Schedule** — perpetual, recurring care that never needs re-entry.
2. **Evidence** — every completion records who did it and when; documents are kept for life.
3. **Fund** — budgets per funding bucket are visible, deducted automatically and warned on.
4. **Oversee** — families and managers see status, overdue care and who is rostered.
5. **Be** trustworthy, transparent and forgiving; carers feel supported, families reassured, admins accountable.

## 5. Functional requirements
Each requirement links to sources and to the features that implement it. Requirements marked "Not scheduled" are confirmed needs without design or priority; they appear in the Parking lot (§17).

| ID | Area | Requirement | Priority · Status | Sources | Implemented by |
|---|---|---|---|---|---|
| REQ-01 | Access | Users sign in simply and securely; users can reset their password by email. Family and organisation admins create their own accounts (REQ-36); carers are invited by their admin. | MUST · CONFIRMED (method answered OQ-08/PD-040; sign-up PD-057) | CIS3 Order 1; CIS5 Q&A; NFR-3; UC-S01; Design Settings | F0-07, F0-17, FAM-12, CAR-09 |
| REQ-02 | Access | Three separate role dashboards — Family, Carer, Admin — each with its own navigation; controls a role may not use are absent, not disabled. | MUST · CONFIRMED | CM-0708; FR-5.4; UI-§4, D15; DD §8 | F0-15, FAM-UI-01, FAM-UI-02, FAM-UI-03, FAM-UI-04, FAM-UI-05, FAM-UI-06, FAM-UI-07, CAR-UI-01, CAR-UI-02, CAR-UI-03, CAR-UI-04, ADM-UI-01, ADM-UI-02, ADM-UI-03, ADM-UI-04, ADM-UI-05, F0-07 |
| REQ-03 | Access | Authorisation enforced by the database (RLS) on every read and write. | MUST · CONFIRMED | FR-5.5; NFR-3; ADR-01–03; TM-2808 | F0-04, F0-06, INT-05 |
| REQ-04 | Access | A client belongs to one organisation at a time; the family can move the client to another organisation; the outgoing organisation and all its staff lose access immediately; no data is lost; emails stop going to the old organisation. | MUST · CONFIRMED (mechanism AMBIGUOUS, OQ-06/OQ-15) | CIS3 Order 2–4, #9; CIS5 Q&A; UI-D3, D24, D36; US P-12–P-15 | F0-06, FAM-13, ADM-05, INT-02 |
| REQ-05 | Access | Carers see only clients they are assigned to; read access while assigned; edit access only during an active shift. | MUST · CONFIRMED (details AMBIGUOUS, OQ-09) | CM-0409; FR-5.2; ADR-03; US C-1 | F0-06, F0-10, CAR-01, CAR-03, CAR-04, CAR-06, ADM-08 |
| REQ-06 | Access | Admins (managers/head nurses share one dashboard) manage their organisation's staff accounts and organisation details; withdrawing staff access is possible. | MUST · CONFIRMED | CM-1908; UI-D2; US A-2; CIS5 Q&A; Design Staff, Settings | F0-06, ADM-02, ADM-03, ADM-08, ADM-10 |
| REQ-07 | Access | Admins add and remove clients for their organisation but cannot edit client information. | SHOULD · CONFIRMED by design (conflicts OQ-07) | UI-D28, §7.16; Design Clients | ADM-04 |
| REQ-08 | Access | Staff are identified by name (and optional reference); organisations differ on showing full surname or initial. | MUST · CONFIRMED (display AMBIGUOUS, OQ-13) | CIS5 Rostering & Q&A; UI-D33 | ADM-02 |
| REQ-09 | Access | MFA is not mandatory for any role, including Admin (PD-040, reaffirmed by CHG-010 on 2026-09-24). | SHOULD · CONFIRMED (PD-040, CHG-010) | NFR-3; ADR-03; TM-2108 | F0-07 |
| REQ-10 | Client record | Client information page with key descriptive, habit and medical information and documentation; editable by Family and by Carers within shift restrictions; opened first when selecting a client. | MUST · CONFIRMED (field list AMBIGUOUS, OQ-38) | CIS3 Data 1–2; CIS5 Front page; CM-0309; UI-D9, D10, D29; Design Info | UI-03, FAM-09, CAR-04 |
| REQ-11 | Client record | Client information can be extended with new headings, summary flags and organisation proforma forms archived on provider change. | SHOULD · CONFIRMED requirement, PARKED (PL-13, OQ-38) | CIS3 Data 2A, 2B; US A-11, A-12 | Not scheduled — see Parking lot |
| REQ-12 | Client record | The client's name and avatar anchor Family page headers; the signed-in user is shown separately. | MUST · CONFIRMED | UI-D16; DD §1 | F0-15 |
| REQ-13 | Scheduling | Care events (Care Need Items) can be one-off or recurring, with no limit on number. | MUST · CONFIRMED | BRIEF I, items 1–3; FR-1.3, FR-2.1, FR-2.6; US C-5 | F0-09, F0-11, FAM-06 |
| REQ-14 | Scheduling | Schedules are perpetual: recurrences carry forward indefinitely without re-entry and can be changed later. | MUST · CONFIRMED | BRIEF item 3; CIS5 Perpetual; FR-2.4 | F0-09, F0-11, FAM-04, FAM-06, FAM-07 |
| REQ-15 | Scheduling | A single occurrence can be cancelled or modified without affecting the series. | SHOULD · CONFIRMED (UI AMBIGUOUS, OQ-11) | BRIEF item 3; FR-2.5; US C-6 | F0-09, F0-11, FAM-07 |
| REQ-16 | Scheduling | Calendar offers day, week and month views, defaulting to week, with normal conventions. | MUST · CONFIRMED | CM-0309; UI-D6, D12 | UI-01, FAM-01, FAM-04 |
| REQ-17 | Scheduling | Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue when due time passes without completion. Statuses apply to tasks only; a plain event has no status (REQ-35, CHG-009). | MUST · CONFIRMED (derivation AMBIGUOUS, OQ-10) | UI-D18, §5.1; US A-5, P-4 | F0-14, UI-03, F0-11, FAM-01, FAM-02, FAM-07, CAR-01 |
| REQ-18 | Scheduling | Family and Carers can create events and mark tasks Done; no approval step (CHG-009). | MUST · CONFIRMED | CM-0309; UI-D26; CIS5 Q&A (superseded supervisor confirmation) | F0-11, FAM-05, FAM-06, CAR-06, CAR-07, INT-03 |
| REQ-19 | Scheduling | Completion records who did it and when (including temporary staff) as an unalterable history, displayed as 'Done · Aisha R.'. | MUST · CONFIRMED | BRIEF II, item 7; CIS5 Q&A; FR-3.1–3.2; TM-0409; UI-D33 | F0-14, UI-00, UI-03, F0-11, FAM-01, FAM-02, FAM-05, FAM-15, CAR-06, INT-03 |
| REQ-20 | Scheduling | Comments and evidence can be added to care items and completions. | SHOULD · CONFIRMED requirement, NOT DESIGNED (OQ-34) | BRIEF item 4; CIS5 Q&A; FR-3.3; US C-3, C-10 | Not scheduled — see Parking lot |
| REQ-21 | Scheduling | The Care log (renamed from Task log, CHG-009) lists tasks and plain events with date, nurse and status ('Event' for plain events), with server-side search, status filter and type filter (All / Tasks only / Events only); each opens a detail page. | MUST · CONFIRMED | UI-D27, D32, §7.7–7.8; Design Task log/detail | FAM-02, FAM-05, FAM-14, FAM-15 |
| REQ-22 | Documents | Files (reports, photos, referrals) can be uploaded, attached to the client or an event, located and retrieved, and kept in perpetuity. | MUST · CONFIRMED (limits AMBIGUOUS, OQ-26) | BRIEF III, item 6; CIS3 Data 4; FR-4.1–4.3 | F0-13, FAM-08, FAM-09, FAM-15 |
| REQ-23 | Shifts | Admins assign a carer to a client for a date and time slot (or custom time); overlapping shifts produce a soft warning; shifts do not recur. | MUST · CONFIRMED | CM-1908; Sequence UC3; UI-D30, D31, §7.14; Design Manage | UI-01, F0-10, ADM-06, ADM-07, INT-04 |
| REQ-24 | Shifts | Shifts can be edited and extended. | SHOULD · CONFIRMED requirement, NOT DESIGNED (OQ-27) | CIS5 Rostering; CM-0309 | ADM-09 |
| REQ-25 | Shifts | Carers see all their assigned shifts in a calendar with the tasks for a selected shift. | MUST · CONFIRMED (semantics AMBIGUOUS, OQ-33) | UI-D8; Design Carer Calendar | UI-01, F0-10, CAR-01, CAR-05, INT-04 |
| REQ-26 | Shifts | Family sees which carer is assigned each day. | MUST · CONFIRMED | UI-D25; CM-0309 | F0-10, FAM-01, INT-04 |
| REQ-27 | Budget | Each funding bucket shows $ remaining, $ total and % used individually; buckets in trouble are flagged. | MUST · CONFIRMED (model AMBIGUOUS, OQ-04) | UI-D7, D17; US P-6, C-12; Design Home/Budget | UI-03, F0-12, FAM-03, FAM-10 |
| REQ-28 | Budget | Spending automatically deducts from the relevant bucket; remaining = total − spending; overspending is never blocked but is flagged. | MUST · CONFIRMED | CM-0409; CIS3 Data 5; CIS5 Q&A; UC-F01 | F0-12, FAM-03, FAM-10, CAR-08 |
| REQ-29 | Budget | Funds are added/edited only on the Budget screen by authorised people, with a dated history. | MUST · CONFIRMED (who AMBIGUOUS, OQ-05) | UI-D1, D19; CM-0409; Design Budget | F0-12, FAM-10, FAM-11 |
| REQ-30 | Budget | Care-related expenses can be recorded (amount, date, description, receipt), optionally linked to an event. | SHOULD · CONFIRMED requirement, NOT DESIGNED | BRIEF V; CM-0309; US C-11; UC-C06; Sequence UC2 | CAR-08 |
| REQ-31 | Notifications | Budget warning emails are sent automatically, once per threshold per period, email only. | MUST · CONFIRMED (thresholds/recipients AMBIGUOUS, OQ-03/OQ-28) | BRIEF item 8; CIS3 Data 6a; CIS5; UI-D4, D23; US P-18 | INT-01 |
| REQ-32 | Notifications | Carers have an in-app notifications panel (e.g. new shift, family updates). | MUST · CONFIRMED by design (scope AMBIGUOUS, OQ-14) | UI-D34; Design Carer Home | CAR-02, INT-04 |
| REQ-33 | Notifications | Reminders for upcoming care and alerts for overdue care. | SHOULD · CONFIRMED requirement, PARKED (PL-03) | CM-0309; US C-8; UC-F04; CIS5 | Not scheduled — see Parking lot |
| REQ-34 | Admin | Admin Home shows client and staff counts and overdue events across all clients. | MUST · CONFIRMED | UI-D5; US A-5; Design Admin Home | ADM-01 |
| REQ-35 | Scheduling | Every event is either a task (ticked off by hand with the actor recorded; Overdue if not done by its due time) or a plain event (no status, never ticked off). A switch on the event form, on by default, sets it; changes follow the edit scope and never alter past occurrences. Checkbox views show tasks only; schedule and log views show both, with plain events in a neutral 'Event' look. | MUST · CONFIRMED | Human, 2026-09-24 (PD-044, CHG-009) | F0-11, F0-16, FAM-01, FAM-02, FAM-04, FAM-05, FAM-06, FAM-07, FAM-14, FAM-15, CAR-01, CAR-05, CAR-06, CAR-07 |
| REQ-36 | Access | Self-serve sign-up. A family member creates their account and the client record in one step and links a provider organisation later. An organisation admin creates their account and a new organisation in one step. Carers cannot sign up themselves; they are invited by their organisation's admin. No email confirmation is required. Sign-up uses the same look as sign-in. | MUST · CONFIRMED | Human, 2026-09-24 (PD-057, CHG-010); CIS3 Order 1–3; CM-1908 | F0-17, FAM-13, ADM-02, ADM-04 |
| REQ-N1 | Non-functional | Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; destructive actions explain consequences. | MUST · CONFIRMED | NFR-2; CIS1 #4; CIS3 Access 6; UI-§2; DD §1 | F0-14, F0-15, UI-02, FAM-UI-01, FAM-UI-02, FAM-UI-03, FAM-UI-04, FAM-UI-05, FAM-UI-06, FAM-UI-07, CAR-UI-01, CAR-UI-02, CAR-UI-03, CAR-UI-04, ADM-UI-01, ADM-UI-02, ADM-UI-03, ADM-UI-04, ADM-UI-05, INT-06 |
| REQ-N2 | Non-functional | WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alone, 13px body minimum. | MUST · CONFIRMED | UI-§5.4; DD §7 | F0-05, F0-14, F0-15, UI-02, FAM-UI-01, FAM-UI-02, FAM-UI-03, FAM-UI-04, FAM-UI-05, FAM-UI-06, FAM-UI-07, CAR-UI-01, CAR-UI-02, CAR-UI-03, CAR-UI-04, ADM-UI-01, ADM-UI-02, ADM-UI-03, ADM-UI-04, ADM-UI-05, INT-06 |
| REQ-N3 | Non-functional | Visual system follows Figma Foundations tokens, IBM Plex Sans, 88px rail, 76px header, 1440 frame. | MUST · CONFIRMED | FIG; UI-§5 | F0-05, F0-14, FAM-UI-01, FAM-UI-02, FAM-UI-03, FAM-UI-04, FAM-UI-05, FAM-UI-06, FAM-UI-07, CAR-UI-01, CAR-UI-02, CAR-UI-03, CAR-UI-04, ADM-UI-01, ADM-UI-02, ADM-UI-03, ADM-UI-04, ADM-UI-05 |
| REQ-N4 | Non-functional | Security: TLS, hashed credentials, session expiry/refresh, input validation, OWASP Top 10 mitigations, no service-role key in client code. | MUST · CONFIRMED | NFR-3; ADR-02 | F0-03, F0-04, INT-05 |
| REQ-N5 | Non-functional | Privacy aligned with Australian Privacy Principles; data download only with family/POA approval. | MUST · CONFIRMED (export PARKED) | NFR-4; CIS3 Data 7 | F0-13, INT-05 |
| REQ-N6 | Non-functional | Historical records are never lost through edits, rollover, staff changes or organisation changes. | MUST · CONFIRMED | NFR-6; CIS3 #9; ADR-01 | F0-06, F0-08, F0-11, F0-13, FAM-13, ADM-03, ADM-05, INT-02 |
| REQ-N7 | Non-functional | Actions are traceable to a user and time in an immutable audit log. | MUST · CONFIRMED | NFR-7; FR-10.1, 10.3, 10.4 | F0-08 |
| REQ-N8 | Non-functional | Performs with hundreds of care items per client over a lifetime. | MUST · CONFIRMED | BRIEF item 2; FR-1.3; NFR-5 | INT-07 |
| REQ-N9 | Non-functional | Maintainable with comprehensive plain-English handover documentation. | MUST · CONFIRMED | BRIEF wish; NFR-9; CM-0309; CIS1 #4 | F0-01, F0-02, F0-03, UI-00, F0-16, INT-08 |
| REQ-N10 | Non-functional | Primary access is desktop web; phone access 'should be possible'. | MUST (desktop) · SHOULD (phone, AMBIGUOUS) | CIS5 Q&A; OOS-7; UI-§2 | Not scheduled — see Parking lot |
| REQ-N11 | Non-functional | Deployment accessible to multiple users; 99.9% availability, daily backups, 1-hour redeploy. | MUST · AMBIGUOUS (OQ-17) | BRIEF wish; NFR-1, NFR-8 | INT-08 |
| REQ-N12 | Non-functional | Money stored as exact decimals; multi-table financial writes are atomic. | MUST · CONFIRMED | ADR-01; ADR-02 | F0-12 |


## 6. Major workflows (CONFIRMED unless noted)
1. **Client set-up** — admin adds client with family contact (design) *or* family registers the client (CIS3/CM-1908) — AMBIGUOUS (OQ-07).
2. **Schedule care** — family (or carer on shift) enters an event with date, recurrence, description, documents; it appears on calendars indefinitely.
3. **Roster** — admin selects staff and client, picks date and time slot, sees a soft overlap warning, assigns shift; carer is notified.
4. **Deliver care** — carer on shift opens Home/Calendar, ticks tasks; family sees "Done · Aisha R.".
5. **Monitor** — family Home shows today, overdue, recent activity and budgets; admin Home shows overdue across all clients.
6. **Budget** — funds recorded per bucket; spending deducts automatically; threshold emails sent automatically.
7. **Change organisation** — family chooses a new organisation, confirms consequences; history retained, nurses and future shifts cleared, old organisation loses access immediately.
8. **Handover** — client receives plain-English guides and runbooks.

## 7. Dashboard requirements (from designs)
| Dashboard | Rail (order) | Screens | Header |
|---|---|---|---|
| Family | Home · Info · Calendar · Budget · Settings | Home (Today timeline, Enter event, Overdue, Recent activity, Budget strip); Info; Calendar D/W/M + Tasks + Log; Add/Edit event; Budget (Funds by source, History, Update); Settings (Change organisation, Family info, Reset password); Care log (was Task log, CHG-009); Care log detail | Client avatar + name + "age · suburb · organisation"; date; family member |
| Carer | Home · Patients · Calendar · Settings | Home (Today's calendar, Tasks, Notifications); Patients grid; Calendar (Shifts + tasks for selected shift); Settings (My info, Reset) | Screen name; date; bell; carer |
| Admin | Home · Manage · Staff · Clients · Settings | Home (Clients/Staff counts, Overdue events); Manage (Staff, Clients, Assign shift); Staff (list + add/edit); Clients (list + add, Remove); Settings (Organisation info, Reset) | Screen name; date; admin |
Common states (States sheet): empty ("All caught up", "No patients assigned yet"), search no-results, list and card skeletons, error with Retry, destructive confirmation modal.

## 8. Permissions (summary — authoritative matrix built in INT-05)
| Capability | Family | Carer | Admin |
|---|---|---|---|
| View client info | Linked clients | Assigned clients | Own-org clients (header/list data) |
| Edit client info | Yes | Only during active shift (OQ-09) | No (D28) |
| Create/edit events | Yes | During active shift (OQ-09) | Not designed |
| Mark Done | Yes (D26) | During active shift | No |
| Switch an event between task and plain event | Yes | During active shift, either way (CHG-009) | No |
| View budget | Yes | UNKNOWN | UNKNOWN |
| Add funds | Yes (D1) / org (CM-0409) — OQ-05 | No | OQ-05 |
| Record expenses | OQ-05 | OQ-05 | OQ-05 |
| Change organisation | Yes (D3, D36) — OQ-06 | No | No |
| Manage staff | No | No | Own organisation |
| Add/remove clients | No | No | Own organisation (D28) |
| Assign shifts | No | No | Own organisation |
| Receive in-app notifications | No | Yes (D34) | No |
| Receive budget emails | OQ-28 | OQ-28 | OQ-28 |
Enforcement: database RLS (ADR-01–03); UI controls absent for disallowed actions.

## 9. Integrations
- Supabase (Postgres, Auth, Storage) — CONFIRMED (ADR-01).
- Transactional email provider — UNKNOWN (OQ-17).
- Scheduler for jobs — UNKNOWN (OQ-17).
- No government/NDIS/payment integrations — CONFIRMED out of scope (OOS-3, OOS-4).

## 10. Data requirements
- Lifetime retention of care records, completions, budgets and documents (CIS3 Data 4, NFR-6).
- Records created by one organisation remain after it leaves; identifiable by source organisation (US P-17) — visibility to new org AMBIGUOUS (OQ-15).
- Unlimited care events per client (BRIEF item 2).
- Exact decimal money; append-only completions, fund entries and audit log (ADR-01, TM-0409).
- Proposed entities: organisations, profiles, clients, client_family_members, carer_client_assignments, client_info_sections, care_events, care_event_overrides, care_event_completions, shifts, budget_buckets, budget_fund_entries, budget_expenses, documents, carer_notifications, budget_threshold_notifications, audit_log (ARCHITECTURE.md §6).

## 11. Security and privacy
CONFIRMED: RLS on every client-scoped table; session-forwarded Supabase access; service-role key only in jobs; TLS; hashed credentials; session expiry; input validation; OWASP Top 10; privacy aligned with Australian Privacy Principles; downloads only with family/POA approval (parked). MFA for admins — AMBIGUOUS (OQ-08). Medical history and documents are sensitive health information.

## 12. UI/UX requirements
CONFIRMED (Figma Foundations, UI-§5, DD): teal token palette with enforced contrast rules; IBM Plex Sans with tabular numerals; 88px gradient rail, 76px header, 1440×1024 frame, 4px grid; Planned/Done/Overdue pills with icon + text; selection solid, hover tint; chips over dropdowns where practical; plain language; destructive actions spell out consequences; normal calendar conventions; week default; WCAG 2.1 AA, 44px targets, visible focus.

## 13. Non-functional requirements
See REQ-N1–N12 in §5.

## 14. Constraints
- Must not reuse 2025 student code (OOS-2, BRIEF). Prior materials for understanding only.
- One-semester student delivery; handover to a non-technical client.
- Stack decided: Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase (ADR-01–03).
- Desktop web primary.
- Repository currently an essentially empty Next.js scaffold (human statement; conflicts with TM-0409 — OQ-20).

## 15. Assumptions (PROPOSED, to be validated)
- All times are Australia/Melbourne (OQ-32).
- Seed/demo data follows the design content (Banksia Home Care, Margaret, Helen, Aisha R., Priya).
- Designs supplied as images on 17 Sep 2026 are the latest approved versions (client was shown new UI on 4 Sep — standup 04/09).

## 16. Out of scope (CONFIRMED)
| Item | Source |
|---|---|
| Formulating care needs clinically | OOS-1 |
| Reusing prior-year code | OOS-2, BRIEF |
| Government / NDIS system integration | OOS-3 |
| Payment processing | OOS-4 |
| Clinical decision support / AI diagnosis | OOS-6 |
| Native mobile app | OOS-7 |
| General accounting system | OOS-8 |
| Translated UI | OOS-9 |
| Formal compliance certification | OOS-10 |
| Funding-source-specific spending rules | CM-0309 |
| Purchase verification | CM-0409 |
| Task completion approval workflow | CM-0309 |
| Recurring shifts | UI-D31 |
| In-app budget notifications (email only) | UI-D23 |
| Carer profile pages | TM-2108 (Won't) |
| Organisation-level SSO | ADR-03 |
Note: OOS-5 (rostering out of scope) is superseded by later client meetings and designs — see OQ-21.

## 17. Parking lot (confirmed or requested, not scheduled)
| ID | Candidate work | Sources | Why not scheduled |
|---|---|---|---|
| PL-01 | Standard email templates and sending to Family/POA with auto-filled salutation | CIS3 Data 6b; US A-16 SHOULD, A-17 COULD; E-4–E-6 | No design; E-6 rated MUST in stories |
| PL-02 | Warning Notification Entities registry | CIS5 Notifications | OQ-28 |
| PL-03 | Health appointment reminder emails (e.g. one week before) | CIS5 Notifications; US C-8; UC-F04 | No design |
| PL-04 | Staff discussion board with accepted answers | CIS5 FAQ answer | OQ-25 |
| PL-05 | Contextual help tooltips and editable FAQ | CIS3 Access 6; CIS5; CM-0309 | OQ-25 |
| PL-06 | Audit log viewer (search, filter, CSV export) | FR-10.2; US A-13 COULD; DD §5 | No final design |
| PL-07 | Care history and financial reports | FR-9.1, 9.2; US A-14 COULD | No design |
| PL-08 | Printable schedule; client data export with family/POA approval | TM-2808; US A-15, P-16; CIS3 Data 7 | OQ-18 |
| PL-09 | Family change requests to carers/admin | US P-8; UC-P04 | Family edits directly in final design; confirm still needed |
| PL-10 | Funding source restrictions, multiple accounting periods, inter-bucket transfers, categories/sub-elements | BRIEF IV, item 5; CIS5; FR-6.1–6.4 | Descoped CM-0309; OQ-04 |
| PL-11 | Procurement and bulk purchase with staged release | BRIEF item 3C; FR-2.2; FR-7.1–7.2 | No design |
| PL-12 | Care item categories (health, clothing, technology …) | BRIEF examples; CM-0708; CM-0309 | No design |
| PL-13 | Organisation proforma forms upload with archive on provider change | CIS3 Data 2B; US A-11, A-12 | OQ-38 |
| PL-14 | Organisation-defined staff role labels separate from permissions | CIS3 #3–4 | OQ-13 |
| PL-15 | Client switcher for family accounts with multiple clients | CM-2108; US P-10 | OQ-30 |
| PL-16 | View-only family members distinct from POA authority | US P-11; FR-5.3 | OQ-16 |
| PL-17 | Mobile/phone-optimised views and phone warnings | CIS5 Q&A | REQ-N10 |
| PL-18 | Add/Delete organisation by an operator (self-serve organisation **registration** moved into F0-17 by CHG-010) | CM-0309 | OQ-06; CHG-010 |
| PL-19 | Organisation-configurable shift patterns | CIS5 Rostering | OQ-21 |
| PL-20 | Admin/Carer task log and task detail equivalents | UI-Q14 | OQ-37 |
| PL-21 | Comments/notes and evidence on events and completions | BRIEF item 4; CIS5 Q&A; US C-3, C-10 | OQ-34 |
| PL-22 | Front-page extras: 'last updated' indicator, change summary, renameable program title | CIS3 Data 1; CIS5 Front page | OQ-38 |
| PL-23 | Alert Family (email or Home alert) when a carer switches a task to a plain event | Human, 2026-09-24 (CHG-009) | Audit log records it; no design or notification type yet |
| PL-24 | Unique identifier for every organisation (e.g. ABN), and verifying a self-registered organisation before it appears in the family organisation picker (lookalike-provider risk) | Human, 2026-09-24 (CHG-010 risk 2) | Identifier to be chosen; no design |


## 18. Dependencies
- Missing sources required: Client Information Sheet No 4 (budgeting); workshop decks W3, w4-5; UI Spec v1 §7 / `care-compass-spec-v3.md`; `CLAUDE-CODE-HANDOFF.md`; Domain Model PDF; wireframes PDF; Figma pages 02–06 via MCP (OQ-19). Place them in `docs/sources/` when obtained.
- Hosting and email accounts (OQ-17).
- Client answers to blocking decisions (DECISIONS.md).

## 19. Release considerations
- Releases go dev branch → `main` with human approval (docs/DEVELOPMENT_WORKFLOW.md §10).
- Supabase free tier is not acceptable for the NFR-8 availability/backup target (ADR-01).
- Handover pack and running-cost explanation required before final release (INT-08).

## 20. Traceability
Chain: **Source → REQ-xx → Phase → Feature (F0/FAM/CAR/ADM/INT) → User story (US-xx) → Acceptance criterion (AC-xx) → Test (T-xx) → Implementation**. REQ ↔ feature mapping is in §5; feature ↔ story ↔ AC ↔ test mapping is inside each feature folder.
