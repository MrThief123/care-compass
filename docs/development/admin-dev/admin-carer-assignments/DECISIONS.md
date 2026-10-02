# Decisions — ADM-08 Admin — Manage carer-client assignments

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES — ANSWERED (root DECISIONS.md, PD-041) | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-19 | Figma access and remaining design gaps | YES — ANSWERED (root DECISIONS.md; build from tokens, flag for review) | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. |

## Feature decisions log

### FD-01 — An "assignment" is a carer's non-cancelled shifts with a client; Remove ends them, no assignment table
- Date: 2026-10-02
- Context: PRD says "Removal ends assignment and future shifts for that pair (PROPOSED)". PD-041 (OQ-09) and F0-18 dropped the assignment table: a carer's read access is `is_assigned_carer()`, true while they have a non-cancelled shift with the client whose end is after now.
- Decision: a pair is "assigned" while at least one such shift exists. `admin_end_carer_assignment(carer, client)` cancels the pair's future shifts and ends the in-progress one at now (same treatment `transfer_client_organisation` gives a client's shifts), returns the number changed, and never deletes. Past shifts, completions and other pairs are untouched. No migration beyond the new function; no new table or column.
- Consequences: the DB function is reusable by ADM-03 (deactivate staff), which also "ends assignments" (its PRD) — ADM-03 may call it per client rather than duplicate the logic. Edits to the `shifts` contract by ADM-09 (edit/cancel shift) are independent: that changes one shift, this ends a pair.
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session, via the question on scope).

### FD-02 — UI lives on the Staff screen, per carer; Remove only, no Reassign
- Date: 2026-10-02
- Decision: selecting a carer in the Staff list (existing Add/Edit panel area) shows a "Clients for <carer>" list with a Remove button per client and a confirmation. Reassign is not built: to move a client the admin removes the carer, then assigns another via Manage (ADM-07). Design gap, built from tokens — please review (OQ-19 pattern; flag in the PR).
- Alternatives considered: per-client list on the Clients screen; a panel on Manage; a Reassign button that moves future shifts to another carer (more functions, ACs and overlap questions).
- Consequences: changes `src/features/admin-staff/staff-screen.tsx` (optional `assignments` prop) and the Staff page, both also touched by ADM-03; whoever merges second resolves the conflict. New files: `src/server/admin/assignments-{queries,actions,mock-store}.ts`, `src/features/admin-staff/carer-assignments.tsx`.
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session).

### FD-03 — Acceptance criteria expanded before implementation
- Date: 2026-10-02
- Decision: AC-01 kept verbatim; AC-02 to AC-07 added to record FD-01/FD-02 (the original single AC could not cover the list, confirmation, permissions or errors). Recorded as a controlled change to this feature's ACs before any code, on the human's answers above. PRD.md is left as written (its "BLOCKED until designed" and `admin-dev` target are stale; OQ-19 and CHG-036 supersede them).
- Human confirmation: Dhruv Verma, 2026-10-02.

### FD-04 — T-10 axe call: `region` rule disabled (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-02
- Test: `[ADM-08][AC-07]` in `src/features/admin-staff/carer-assignments.test.tsx`
- Before: `expect(await axe(document.body)).toHaveNoViolations()`
- After: `axe(document.body, { rules: { region: { enabled: false } } })`
- Reason: with the confirmation open the test audits the whole body. `region` ("all content in a landmark") then flags the existing Staff table and form, which are outside any landmark only because the test renders `StaffScreen` alone. In the app `src/app/(admin)/admin/layout.tsx` wraps pages in `<main>`. Every other rule still runs; the first `axe(container)` call is unchanged. The new Clients list is its own labelled `region`.
- Human confirmation required: yes (flagged in PROGRESS.md and the PR).

### FD-05 — Staff screen: side panel instead of an always-visible form (HUMAN REVIEW: test expectations changed)
- Date: 2026-10-02
- Decision: the human asked (in session) for the Staff screen to show only the list and an always-present Add Staff button. Pressing a name opens a side panel with that person's details and their Clients list (with Remove); Add Staff opens the same panel empty. Close, Cancel-equivalent ("Close"), Escape or a successful Save closes it and clears the draft. The separate per-row Edit buttons are gone; the name is the button (accessible name stays "Edit {name}", which contains the visible text). Success messages show above the list when the panel is closed. Done inside ADM-08 (option 1) rather than as a separate feature. Unlike ADM-02, nothing is selected by default.
- Overlap: this widens the overlap with ADM-03, which also edits `staff-screen.tsx`; the PR says so.
- Test changes (HUMAN REVIEW: test expectation changed):
  - `staff-screen.test.tsx` "shows an empty list and allows adding the first staff member": before, the First name field was present and empty with no staff; after, it is absent until Add Staff is pressed.
  - `staff-screen.test.tsx` "editing a different row discards unsaved draft changes": before, the form was open on the first person at render; after, the test first presses "Edit Aisha Rahman".
  - New: "the panel is closed until Add Staff or a name is pressed, and closing clears it".
  - `carer-assignments.test.tsx` (ADM-08): `renderScreen` now presses "Edit Aisha Rahman" first, because the Clients list is no longer visible by default; "switches to another carer's clients" wording updated; new test that no Clients list shows until a name is pressed and none after Close.
- Human confirmation: Dhruv Verma, 2026-10-02 ("Do it here").

### FD-06 — Mock stores shared through `globalThis` (staff and assignments)
- Date: 2026-10-02
- Context: in mock mode a carer added on the Staff screen, or a client removed from a carer, vanished on refresh or after visiting another page. Next bundles Server Actions and pages separately, so each got its own copy of the module-level store.
- Decision: both mock stores (`assignments-mock-store.ts`, and the ADM-02 `staff-mock-store.ts`, same lane) now keep their rows on `globalThis`. Mock mode only; the database path is unchanged. Verified in a production build: an added carer survives reload, a removed client stays removed after navigating away and back.
- Human confirmation required: no (mock-only defect fix; ADM-02 file touched, noted in the PR).

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
