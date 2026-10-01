# Decisions — ADM-07 Admin — Assign shift

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES — ANSWERED (root DECISIONS.md) | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-21 | Rostering scope and shift patterns | no — OPEN, default used | Shift assignment in scope per later sources; fixed chips for MVP, configurable patterns parked (PL-19). |
| OQ-39 | Design copy and visual inconsistencies | no — OPEN, default used | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

Non-blocking defaults used: OQ-21 — the fixed common-shift chips ADM-UI-02 built, no configurable patterns, no Repeat control. OQ-39 — the warning text is generated from the real overlapping shift (carer, client, times), never the design's example copy.

## Feature decisions log

### FD-01 — Overlap warning: same rule as `overlapping_shifts`, computed from RLS-read shifts (not by calling the RPC)
- Date: 2026-10-01
- Context: PRD says the warning is "generated from `overlapping_shifts`". F0-10's `overlapping_shifts(carer, from, to)` is `SECURITY DEFINER` and has **no caller check**: any signed-in user (carer, family) can call it with any carer's id and get that carer's shifts, including client ids. Calling it from Manage would also bypass RLS rather than use it.
- Decision: `getAdminManage` reads the organisation's shifts under the admin's own session (RLS `shifts_select_admin`), and the screen keeps ADM-UI-02's overlap check, which is the same predicate as `overlapping_shifts`: same carer, not cancelled, half-open `start < other.end && end > other.start` (touching shifts don't overlap). `tests/integration/admin-assign-shift.test.ts` (AC-02) checks that `overlapping_shifts` and the loaded Manage data report the same shift for the AC-02 case.
- Reason: Authorisation lives in RLS (ARCHITECTURE.md §12); no new SECURITY DEFINER exposure from this feature; no per-keystroke round trip.
- Alternatives considered: a server action calling `overlapping_shifts` on every date/time change (more faithful wording, but relies on an unguarded definer function); a new guarded RPC (needs a Lane B migration — out of lane).
- Consequences: **Security follow-up for Lane B (not fixed here — `supabase/**` is Lane B):** `overlapping_shifts` should check the caller is an admin of the carer's organisation (or be `SECURITY INVOKER`), or have `execute` revoked from `authenticated`. Recommend a shared PR.
- Human confirmation required: yes — confirm this reading of "generated from `overlapping_shifts`" and whether to raise the Lane B fix.
- Human confirmation: MrThief123, 2026-10-01 (in-session) — accepted as the fix for this feature. The Lane B follow-up (guard `overlapping_shifts` itself) has been raised with the F0-21 (Auth security audit) session, in progress concurrently, rather than tracked as a separate new item.

### FD-02 — Permissions through F0-10's existing RLS and trigger; no migration
- Date: 2026-10-01
- Decision: `assignShift` inserts under the admin's session. `shifts_insert_admin` (RLS) requires an admin of the client's organisation; `shifts_before_insert` requires the carer to be in that same organisation and sets `organisation_id` itself. Together: the admin must be an admin of both the carer's and the client's organisation. RLS refusal (`42501`) and the trigger's exception (`P0001`) map to `UNAUTHORISED` "You can't assign this carer to this client." (no names). Integration tests cover: other-org admin refused; own-org admin with other-org carer refused; own carer to other-org client refused; other-org admin sees none of the shifts.
- Consequences: no migration, no schema change. `organisation_id` isn't sent by the action (the trigger owns it); the insert carries a typed cast with a comment because generated types mark it required. Note for Lane B: the trigger does not check the carer `is_active`; the Manage list only offers active carers, but a crafted request could assign a deactivated carer.
- Human confirmation required: no

### FD-03 — Which shifts Manage loads
- Date: 2026-10-01
- Decision: non-cancelled shifts in the admin's organisation that end on or after Melbourne midnight on the 1st of the previous month, with carer and client names (`profiles!shifts_carer_id_fkey`, `clients`, the embed pattern `src/server/admin/queries.ts` already uses). Loaded independently of the selection, so selecting people (URL change) doesn't drop the screen's state.
- Consequences: dots aren't shown for months earlier than last month. Fine for MVP rostering; revisit if data volume grows.
- Human confirmation required: no

### FD-04 — Shifts crossing midnight
- Date: 2026-10-01
- Decision: the panel only creates same-day shifts (end after start on one date). A stored shift that runs past midnight is shown on its start date ending "24:00".
- Human confirmation required: no

### FD-05 — Success message (PRD: PROPOSED)
- Date: 2026-10-01
- Decision: keep ADM-UI-02's human-reviewed copy (its FD-06): "Shift assigned: Aisha Rahman → Margaret Doyle, 2026-12-01, 07:00 - 11:00." Shown only after the server confirms. Failure shows the server's plain-English message ("Couldn't assign the shift. Try again." / "You can't assign this carer to this client.").
- Human confirmation required: yes — confirm copy (OQ-39 territory).
- Human confirmation: MrThief123, 2026-10-01 (in-session) — kept as-is.

### FD-06 — Assign button disabled, not absent (PRD: PROPOSED/confirm)
- Date: 2026-10-01
- Decision: keep ADM-UI-02's behaviour: "Assign shift" is visible and disabled until a staff member and a client are chosen (date and time always have a value), and while a save is in flight. CLAUDE.md §7's "absent, not disabled" rule is about controls the user isn't authorised to use; this is form completeness, not authorisation.
- Human confirmation required: yes — confirm.
- Human confirmation: MrThief123, 2026-10-01 (in-session) — disabled, not hidden, confirmed as correct (form completeness, not authorisation).

### FD-07 — Time entry as built by ADM-UI-02 (no separate "Custom" chip)
- Date: 2026-10-01
- Context: PRD Scope describes slot chips plus a 'Custom' chip revealing start/end inputs (marked PROPOSED, not drawn). ADM-UI-02 (merged) built start/end hour and minute dropdowns that are always shown, plus common-shift chips that fill them.
- Decision: Phase 3 doesn't redesign the screen (CLAUDE.md §6); AC-03 ("Custom with end 10:00 before start 12:00") is tested via those dropdowns. The validation schema moved from the screen to `src/server/admin/assign-shift-schema.ts` so the screen and the action share one schema and one message.
- Human confirmation required: no

### FD-08 — Mock mode and tests
- Date: 2026-10-01
- Decision: with `DATA_SOURCE=mock`, `assignShift` validates and returns the shift with a `mock-<uuid>` id without persisting (ADM-UI-02 FD-03 behaviour). No existing tests were changed; the existing ADM-UI-02/ADM-06 Manage component, query and integration tests pass unchanged. No new dependencies.
- Human confirmation required: no
