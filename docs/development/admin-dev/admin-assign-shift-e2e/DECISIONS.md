# Decisions — INT-04 End-to-end: admin rostering journey

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES — ANSWERED (root DECISIONS.md) | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-33 | Carer calendar and task semantics | YES — ANSWERED (root DECISIONS.md) | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |

## Feature decisions log

### FD-01 — Tests-first for a verification feature
- Date: 2026-10-01
- Context: INT-04 adds no production code (PRD Out of Scope: new functionality); everything it exercises (ADM-07, CAR-02, CAR-05, FAM-01) is already merged to `main`. There is no implementation step for the tests to go red against.
- Decision: the spec was written first from TEST_PLAN.md and run against the merged code. First run: T-01 passed, T-02 failed on the spec's own selector (the Carer Home range label '30 Nov – 6 Dec 2026' is text, not a heading); fixed in the spec, then all green. No `src/**` or `supabase/**` change was needed: no integration gap found.
- Human confirmation required: no

### FD-02 — How the "new shift" notification is asserted (AC-01 text vs CHG-032)
- Date: 2026-10-01
- Context: AC-01 quotes '… 09:00–11:00 (Margaret).'. CAR-02 builds the message in the `shifts_notify_carer` trigger (SECURITY DEFINER, fires on every `shifts` insert) with the client's **full** name (CAR-02 FD-03, CHG-032, human-answered 2026-09-30), so the real text is '… (Margaret Doyle).'.
- Decision: no extra wiring or querying is needed: ADM-07's `assignShift` inserts the row under the admin's session, the trigger writes the `carer_notifications` row, and Carer Home lists it. T-01 asserts the exact trigger text with the seeded client's full name (`Margaret Doyle-<stamp>`, unique per run) inside the Notifications list, plus the bell reading 'Notifications, 1 unread'. AC-01's wording is left as written (controlled doc); the difference is CHG-032, already decided.
- Human confirmation required: no (follows CHG-032); worth a one-line note in the PR.

### FD-03 — Family step and overlap edge case as [PRD] tests (T-03, T-04)
- Date: 2026-10-01
- Context: Scope is a journey "across three contexts" and the PRD lists the overlap edge case, but the two ACs cover only the carer side.
- Decision: added T-03 (REQ-26: Helen opens Margaret's Tue 1 Dec 09:30 task from Family · Calendar week view and reads 'Assigned to Aisha Rahman', the assignee FAM-01's occurrence builder derives from the covering shift) and T-04 (Priya picks 10:00–12:00 the same day: the ADM-07 warning names '09:00 - 11:00' and 'You can still assign it.', Assign stays enabled, the second shift is saved, Aisha gets a second notification). Titled `[INT-04][PRD]` as other features do for PRD-only checks; no AC added or changed.
- Why Family · Calendar, not Family Home: Home's Today timeline only shows the real today, and the journey's shift is on 1 Dec 2026 (AC dates).
- Human confirmation required: no

### FD-04 — Journey shape and environment
- Date: 2026-10-01
- Decision: one `test.describe` in serial mode with one seeded organisation (Priya admin, Aisha carer, Helen family, Margaret client, one 'Morning medication' task at Tue 1 Dec 09:30 Melbourne) and three browser contexts signed in once in `beforeAll`; Priya enrols TOTP there (F0-07/F0-20 forced MFA). No shifts are seeded: the admin creates them through the UI. Everything is removed in `afterAll`. Gate identical to `admin-assign-shift.spec.ts` (local URL + `E2E_DATA_SOURCE=supabase` + service-role key), so the default mock e2e run skips it. Run on a dedicated `E2E_PORT` (INT-02 FD-01).
- Human confirmation required: no

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
