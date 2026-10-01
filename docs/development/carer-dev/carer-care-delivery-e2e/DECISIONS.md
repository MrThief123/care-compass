# Decisions — INT-03 End-to-end: carer care delivery journey

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-33 | Carer calendar and task semantics | YES — ANSWERED (PD-043, amended by CHG-025) | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |

## Feature decisions log

### FD-01 — AC-01's "Done · Aisha R." is asserted as "Done · Aisha Rahman" (PD-038)
- Date: 2026-10-01
- Context: AC-01/T-01 were drafted from the design copy "Done · Aisha R.". PD-038 (answering OQ-13, confirmed 2026-09-17) later fixed staff names to the full name everywhere and explicitly supersedes the "Aisha R." convention; `set_occurrence_done` stores `actor_display_name` as first + last name and FAM-01's Today timeline renders `Done · <actor>`. CAR-06's own e2e asserts "Done · Aisha Rahman".
- Decision: T-01 asserts "Done · Aisha Rahman". AC-01's text is controlled (CLAUDE.md §9), so it is left as written; its status note points here.
- Reason: a human-answered decision outranks design copy; asserting "Aisha R." would test against a superseded convention (it fails, verified).
- Alternatives considered: asserting "Aisha R." (wrong per PD-038); editing AC-01 text (needs a human-confirmed CHG).
- Consequences: HUMAN REVIEW (wording only): AC-01/T-01 text could be aligned to "Done · Aisha Rahman" by a CHG when convenient. No behaviour question.
- Human confirmation required: yes, wording-only alignment of AC-01 (owner, at PR review)
- Test changes caused: none (T-01 written this way from the start)

### FD-02 — Clock control for shift windows: real clock, seeded windows, shift ended by moving the row
- Date: 2026-10-01
- Context: PRD Technical Considerations: "Clock control for shift windows". On/off shift is decided in Postgres (`carer_on_active_shift`, `now()`), and the page's `onShift` comes from the server, so Playwright's browser clock cannot move it, and there is no app-level clock seam.
- Decision: seed shift windows relative to the real clock with wide margins (in progress = now−1 h to now+1 h); produce "the shift has ended" by updating the shift row via the service-role client (now−2 h to now−5 min). The task starts a few minutes ago but never before Melbourne midnight (`taskStartToday()`), so it is always "today" on both the carer Calendar and the family Today timeline. No shared helper — same technique as CAR-06's spec (`at(offset)`), kept local like INT-02.
- Reason: deterministic without mocking the database clock; no app or migration change needed.
- Alternatives considered: Playwright `page.clock` (does not affect server/DB time); a DB-level time override (would need new test-only code in `supabase/`, out of scope).
- Consequences: T-02b also covers a real edge case: a page loaded on shift that is still open when the shift ends — the tick box is still rendered, the database refuses (42501 → "Not permitted to tick off this task."), the box reverts.
- Human confirmation required: no (informational)
- Test changes caused: none

### FD-03 — CAR-07 / CAR-08 steps not included
- Date: 2026-10-01
- Context: PRD Scope: include CAR-07/CAR-08 steps only if merged. CAR-07 (carer adds/edits events) is NOT STARTED; CAR-08 (record an expense) is RETIRED (CHG-020).
- Decision: the journey covers sign in → open rostered patient → tick a task → family sees it; no "add a task with cost and documentation" step.
- Consequences: if CAR-07 merges later, its step belongs in a follow-up to this spec (or CAR-07's own e2e). CAR-08's step will never apply.
- Human confirmation required: no
- Test changes caused: none

### FD-04 — Off-shift case seeds an upcoming shift so the carer can still open the patient
- Date: 2026-10-01
- Context: F0-18 (PD-041, `is_assigned_carer`) gives a carer read access only while she has a non-cancelled shift with the client that has not ended. With only an ended shift, Aisha can't open Margaret at all, so "tries to tick" has no UI to try.
- Decision: T-02/T-02b add a shift tomorrow, the realistic case (regular carer between shifts). T-02 additionally calls `set_occurrence_done` directly with Aisha's own session to prove the database refuses, not just that the UI hides the control.
- Human confirmation required: no
- Test changes caused: none

### FD-05 — No integration gap found between CAR-06 and FAM-01
- Date: 2026-10-01
- Decision: the journey passed on first run against the merged code; no `src/**`, migration or shared helper change was made. Mutation check: changing the expected label to "Done · Aisha R." and the expected RPC code to a wrong value made T-01/T-02 fail, so the assertions are live.
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
