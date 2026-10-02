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
