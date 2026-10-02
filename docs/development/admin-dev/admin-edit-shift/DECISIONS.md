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
