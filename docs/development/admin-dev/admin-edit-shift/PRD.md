# ADM-09 — Admin — Edit, extend or cancel a shift

| Field | Value |
|---|---|
| Feature ID | ADM-09 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| PR target | `main` |
| Feature branch | `feature/admin-edit-shift` |
| Documentation | `docs/development/admin-dev/admin-edit-shift/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D17 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Let an admin correct the roster: change a shift's start, end or carer (which covers extending it when a manager asks a carer to stay longer), or cancel it.

## Problem
ADM-07 can only create shifts. A shift entered wrongly, or one that runs long, can only be fixed in the database. Edit rights follow actual working time (F0-10), so an extension has to reach `ends_at` for the carer to keep recording care.

## Description
Supports the client's need to extend a shift when a manager asks a carer to stay longer. PD-053 (OQ-27 answered): one edit action, no separate "Extend" action; cancellation soft-deletes (`cancelled_at`, row kept).

## User value
Rosters reflect reality; edit rights follow actual working time.

## Users
- Admin

## Scope
Built on the Admin Manage screen (ADM-UI-02, wired by ADM-07). **Design gap built from tokens (PD-052); flag "design gap, built from tokens, please review" in the PR.** Answers recorded in FD-01 to FD-05.
- **Row actions.** Each shift row in the "Current shifts on selected day" panel gets **Edit** and **Cancel** buttons, only on shifts that have not ended (FD-03). Ended shifts show no buttons (absent, not disabled, CLAUDE.md §7).
- **Edit panel.** Edit opens an inline panel (replacing the Assign panel's form while open) pre-filled from the shift: carer picker (active, signed-up carers of the organisation), start and end using the same hour/minute dropdowns and common-shift chips as Assign, the date shown but fixed. Buttons: Save changes, Cancel editing. The same soft overlap warning as Assign (D30), computed over the carer's other shifts and excluding the shift being edited. Never blocks.
- **Cancel shift.** A confirmation dialog: "Cancel this shift?" naming carer, client, date and times, with "Keep shift" and "Cancel shift" buttons. Confirm sets `cancelled_at`; the row leaves the panel and the date's dot goes if it was the carer's last shift that day.
- **Server Actions** in `src/server/admin/manage-actions.ts` (extend, not recreate): `updateShift({ shiftId, carerId, start, end })` and `cancelShift(shiftId)`. The date is read from the stored shift (Melbourne), never sent by the client. Result shape per ARCHITECTURE.md §4.
- **Migration** (`supabase migration new`): tighten `shifts_update_admin` so an admin cannot change a shift that has ended or is cancelled, or move its end into the past; add a before-update guard so a shift cannot be reassigned to a deactivated carer. Additive, no column change (FD-02).

## Out of Scope
- Recurring shifts (D31). Moving a shift to another date or to another client (cancel and assign again). Un-cancelling. Editing or cancelling an ended shift. Overnight shifts (FD-04 of ADM-07). Notifying the carer of a change (not requested).

## Functional Requirements
- Edit changes `starts_at`, `ends_at` and/or `carer_id` of one shift; extending is editing `ends_at` (PD-053).
- Cancel sets `cancelled_at = now()`; the row is never deleted.
- Both are audited by the existing `audit_shifts` trigger (before and after, actor).
- After an extension, `carer_on_active_shift` is true for the carer until the new end (half-open interval).
- A carer who is reassigned away loses, and the new carer gains, edit rights for that window.

## UI / UX Requirements
- Built from tokens and the patterns already on Manage (OQ-19 / PD-052). 44x44 px targets; buttons have visible text plus the shift in their accessible name ("Edit shift, Aisha Rahman, Margaret Doyle, 07:00 - 11:00"). Status never colour alone. Nothing overlaps from 1920 to 768 px; long names wrap.
- Success message after save: "Shift updated: Aisha Rahman → Margaret Doyle, 2026-12-01, 07:00 - 13:00." (role=status). After cancel: "Shift cancelled: Aisha Rahman → Margaret Doyle, 2026-12-01, 07:00 - 11:00." PROPOSED copy, confirm (OQ-39 territory).
- Failures show a plain-English alert and leave the screen as it was. Empty/loading states are Manage's existing ones.

## Dependencies
- Features: ADM-07 (Admin — Assign shift) — MERGED
- Blocking open decisions: OQ-27 = PD-053 and OQ-19 = PD-052, both ANSWERED
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-39 — copy above

## Inputs
- `updateShift`: shift id, carer id, start and end (`HH:MM`, Melbourne). `cancelShift`: shift id.

## Outputs
- The updated `ManageShift`; for cancel, the cancelled shift's id.

## Error / Edge Cases
- Extension or move that overlaps another shift of that carer → soft warning, still saves (D30).
- End not after start → "End time must be after start time." (shared schema).
- Shift already ended, already cancelled, deleted, or in another organisation → `NOT_FOUND` "That shift can't be changed." Nothing changes.
- Carer deactivated, not signed up yet, or in another organisation → `UNAUTHORISED`.
- End moved into the past → `VALIDATION`: "A shift can't end in the past. Cancel it instead."
- Time skipped at daylight-saving start → same message as Assign.
- Two admins edit at once: last write wins; the audit log keeps both.

## Security / Permissions
- Admin of the shift's organisation at AAL2 only (existing `is_admin_of_client`). Carers and family cannot update shifts; another organisation's admin changes nothing. Authorisation is RLS plus the guards in FD-02; the action runs under the admin's own session, no service role.

## Technical Considerations
- Server Actions with Zod; reuse `shiftTimeRangeSchema` and `localToMelbourneIso`. `ManageShift` gains `editable: boolean`, set by `getAdminManage` (Supabase: `ends_at > now()`; mock: `date >= referenceDate`). Mock mode validates and returns without persisting, as `assignShift` does (ADM-07 FD-08), except an unknown id returns NOT_FOUND.
- Existing guard `shifts_before_update_assignment_trg` (F0-21) already refuses an other-organisation carer on update; do not duplicate it.

## Traceability
- Product requirements: REQ-24 (Shifts can be edited and extended.)
- Sources: CIS5 Staff Time Table Rostering (extend shift); CM-0309 (shifts editable; confirm extension workflow)
- Decisions: PD-053, PD-052; feature FD-01 to FD-05.
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
