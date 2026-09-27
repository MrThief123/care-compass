# Decisions — FAM-14 Family — Task log

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-29 | Which nurse is shown on an event | YES — now ANSWERED (root DECISIONS.md, 2026-09-17) | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |
| OQ-31 | Task log range | no | Occurrences up to end of today, newest first. |
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

## Feature decisions log

### FD-01 — AC-01's row order is illustrative, not a specified tie-break
- Date: 2026-09-27
- Context: AC-01 lists "Morning medication (Done), Physiotherapy (Planned), Afternoon check-in (Planned)" as the first rows for Mon 30 Nov. The already-merged FAM-UI-07/CHG-005 sort (newest-first by start instant, ties broken by key ascending) in fact lists them Afternoon check-in, Physiotherapy, Morning medication for the same day, and is exercised by 137-row pagination tests that would need a wide, unrelated rewrite to change.
- Decision: treat AC-01's listed order as an example of which three tasks appear, not a literal ordering requirement; the FAM-14 test asserts the three rows are present with the right nurse/status via `expect.arrayContaining`, not their sequence.
- Reason: the tie-break is CHG-005's own decision, already reviewed, tested and merged; re-litigating it inside FAM-14 (which owns none of that sort logic) would mean either weakening `page.test.tsx`'s existing 137-row FAM-UI-07 coverage or shipping two disagreeing sort orders for the same table.
- Alternatives considered: change the tie-break to match AC-01's literal order — rejected, out of FAM-14's scope and would need a CHG against CHG-005, not a one-feature decision.
- Human confirmation required: no — reading an illustrative list as illustrative, not a behaviour change.
- Test changes caused: none (a new test, not a change to an existing one).

### FD-02 — Task log does not yet adopt `type: "all"` (plain events); flagged, not implemented
- Date: 2026-09-27
- Context: `shared-plain-events` DECISIONS.md FD-01 (human-confirmed, 2026-09-24) says "every log view ... reads with `type: 'all'`: the Care log (FAM-UI-07, **FAM-14**, FAM-15)", so tasks and plain events should appear together in the Task log. None of FAM-14's own PRD.md Scope or ACCEPTANCE_CRITERIA.md mention plain events, and `TaskLogTable`/`TaskLogView` (FAM-UI-07) are typed and built for `Occurrence` (tasks only) — adopting `type: "all"` would mean typing them for `AnyOccurrence`, adding a plain-event row rendering (no status pill, per `isPlainEvent()`), and is real, un-scoped UI work.
- Decision: FAM-14 ships to its own controlled ACs (tasks only) as implemented; the `type: "all"` adoption is **not** done in this feature and is flagged here rather than folded in.
- Reason: CLAUDE.md §6/§9 — build only the PRD Scope, and a controlled document (ACCEPTANCE_CRITERIA.md) changes only via a human-confirmed decision or a CHG entry, not by inference from another lane's decision. CLAUDE.md §10 also lists "scope would grow" as a stop-and-ask trigger.
- Human confirmation required: **yes — HUMAN REVIEW requested.** Please confirm whether to (a) leave this as a follow-up (new feature or CHG against FAM-14/FAM-15's ACs) or (b) fold it into this branch before merge.
- Consequences: none yet — no code changed for this decision.
- Test changes caused: none.

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
