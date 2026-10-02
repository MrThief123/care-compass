# Decisions — ADM-09 Admin — Edit, extend or cancel a shift

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status |
|---|---|---|---|
| OQ-27 | Shift edit, extend and cancel workflow | YES | ANSWERED — PD-053 |
| OQ-19 | Figma access and remaining design gaps | YES | ANSWERED — PD-052 (build from tokens, flag in PR) |
| OQ-39 | Design copy and visual inconsistencies | no — OPEN, default used | Success and dialog copy in the PRD is PROPOSED; confirm in the PR. |

## Feature decisions log

### FD-01 — Edit and Cancel are row actions in "Current shifts"; Edit is inline, Cancel asks first
- Date: 2026-10-03 · Human confirmation: Dhruv Verma, 2026-10-03 (in-session, options chosen).
- Decision: Edit and Cancel buttons on each shift row of the existing panel; Edit opens an inline panel using Assign's time controls; Cancel opens a confirmation dialog. No new route. Design gap built from tokens (PD-052); flag in the PR.
- Alternatives: a separate edit page (rejected: more new UI, new route); cancel without confirm (rejected).

### FD-02 — What Edit changes; what the database enforces
- Date: 2026-10-03 · Human confirmation: Dhruv Verma, 2026-10-03.
- Decision: Edit changes start, end and carer on the shift's own date (PD-053: time or carer; extending = editing the end). Moving date or client is cancel plus assign. Because ADM-07's `shifts_update_admin` allows any update and the F0-21 trigger only guards carer/client/organisation changes, a migration (additive, `supabase migration new`) adds: policy `USING` requires `cancelled_at is null and ends_at > now()` (so ended and cancelled shifts are frozen and cannot be un-cancelled); `WITH CHECK` requires `ends_at > now()` (a shift cannot be edited to end in the past; cancel instead); a before-update trigger refusing a deactivated carer on reassign and any `client_id` change. `transfer_client_organisation` and `admin_deactivate_staff` are SECURITY DEFINER and are unaffected (tests must prove it).
- Lane note: `supabase/**` is Lane B's folder; ADM-03 (FD-06/FD-08) set the precedent of an admin-lane migration for its own rule. Say so in the PR; no other table's behaviour changes.
- Alternatives: enforce only in the action (rejected: the update endpoint is public, CLAUDE.md §7 puts authorisation in RLS).

### FD-03 — Shifts that have ended are locked
- Date: 2026-10-03 · Human confirmation: Dhruv Verma, 2026-10-03.
- Decision: only shifts that have not ended can be edited or cancelled; an in-progress shift can be extended or cancelled. The UI hides the buttons; the database refuses (FD-02). `ManageShift.editable` is computed server-side.
- Reason: protects the care record (tasks are ticked against shift time).

### FD-04 — Overlap on edit is a soft warning
- Date: 2026-10-03 · Human confirmation: Dhruv Verma, 2026-10-03.
- Decision: same predicate and wording as Assign (D30), over the carer's other shifts; the shift being edited is excluded. Computed from RLS-read shifts, as ADM-07 FD-01 (no call to `overlapping_shifts`).

### FD-05 — Acceptance criteria, PRD and test plan updated before implementation
- Date: 2026-10-03
- Decision: AC-01 kept verbatim; AC-02 to AC-09 added; PRD Scope, UI, Edge, Security and Technical rewritten to record FD-01 to FD-04 and PD-053; PR target corrected from the retired `admin-dev` to `main`. `DEVELOPMENT_PLAN.md` card (1 criterion, 1 db) and totals not edited here; update with the PR docs commit once totals are settled (see ADM-03 FD-05).
- Human confirmation required: no (records answers above).

### FD-06 — `ManageShift.editable` is optional; an Assign warning waits while a failure shows
- Date: 2026-10-03
- Decision: (a) `ManageShift.editable` is typed `editable?: boolean` (PRD says `boolean`). `getAdminManage` always sets it; the shape returned by `assignShift` / `updateShift` does not carry it (the screen keeps the row's value), and ADM-07's component tests build shifts without it. Absent means not editable, so no button is offered by accident. (b) While a failure message (a failed save or cancel) is on screen, the Assign form's overlap warning is not shown; it returns as soon as the form changes. T-09 requires exactly one `alert` after a failed cancel, and its fixture's ended 07:00-09:00 shift overlaps the Assign form's default 07:00-11:00. The Assign overlap rule itself (D30) is unchanged and never blocks.
- Human confirmation required: no (implementation detail), flagged for review in the PR.

### FD-07 — Existing assertion changed: ADM-07 integration test now includes `editable`
- Date: 2026-10-03
- Test: `tests/integration/admin-assign-shift.test.ts`, "[ADM-07][AC-02] the existing 11:30-13:00 shift with Robert is loaded with names…".
- Before: `getAdminManage` shifts `toContainEqual` an exact object without `editable`. After: the same object plus `editable: true` (a 2026-12-01 shift has not ended).
- Reason: ADM-09 AC-07 / FD-03 requires `getAdminManage` to return `editable`; an exact-shape assertion cannot hold. No assertion removed, nothing relaxed.
- **HUMAN REVIEW: test expectation changed** (flagged in PROGRESS.md and the PR).

### FD-08 — Editing and extending a shift dropped; cancel only (CHG-053)
- Date: 2026-10-03 · Human confirmation: Dhruv Verma, 2026-10-03: "remove it just because it makes the UI so clunky ... if this main functionality already exists, then it's all right. I don't think there's any benefit."
- Decision: removed the Edit panel, `updateShift`, `edit-shift-schema.ts` and the shared `time-range-picker.tsx` (Manage's Assign form is back to its ADM-07 shape). Kept: Cancel, `cancelShift`, `ManageShift.editable`, and the whole migration, including the trigger refusing a client change or a reassign to an inactive carer (hardening; the human may ask for it to be removed). Criteria count stays 9 (AC-02, AC-06, AC-07, AC-08 reworded), so the plan totals are unchanged.
- Tests removed or changed (**HUMAN REVIEW: test expectation changed**; the removed behaviour no longer exists):
  - `src/features/admin-manage/edit-shift.test.tsx` [ADM-09][AC-08] T-08: the Edit-panel tests (pre-filled panel, Save payload, list and dots update, overlap warning excluding the edited shift, time validation, failed save keeps old times) removed. Before: Edit and Cancel buttons expected on editable rows. After: Cancel only, and no Edit button. The Cancel dialog tests (T-09) are unchanged except axe, which now runs with the dialog open only.
  - `src/server/admin/shift-edit-actions.test.ts` [AC-06] T-06: the `updateShift` validation, NOT_FOUND and success cases removed; `cancelShift` cases unchanged.
  - `tests/integration/admin-edit-shift.test.ts` [AC-07] T-07: the update tests (Melbourne times, extend, overlap not blocked, reassign) removed; the ended-shift test is cancel only and also asserts `editable`; cancel and other-organisation cases unchanged.
  - `tests/e2e/admin-edit-shift.spec.ts` T-10: the extend-to-13:00 steps removed; it now cancels the 14:00 shift and asserts the 07:00 shift is untouched.
  - pgTAP `admin_edit_shift.test.sql` (T-01 to T-05) unchanged and passing: the database rules still hold.
- Alternatives: keep Edit (recommended earlier; the human decided against it).
- Open for the human: the client's "extend a shift" need (CIS5) is now met by cancel and assign again; confirm that with the client.

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
