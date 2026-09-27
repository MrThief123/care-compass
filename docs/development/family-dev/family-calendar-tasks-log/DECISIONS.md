# Decisions — FAM-05 Family Calendar — Tasks panel and Log panel

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-10 | Status behaviour and undo | YES — now ANSWERED (root DECISIONS.md, 2026-09-27) | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-31 | Task log range | no | Occurrences up to end of today, newest first. |

## Feature decisions log

### FD-01 — Unticking (undo) implemented alongside ticking, though no AC names it directly
- Date: 2026-09-27
- Context: PRD.md Scope lists "Unticking behaviour per OQ-10 (not implemented until answered)" as an in-scope item, conditional on OQ-10. OQ-10 is now ANSWERED, with an answer that specifically covers undo ("Done can be undone by the same actor or family via an append-only 'undone' entry") — written to unblock this feature. None of FAM-05's 4 formal ACs name untick/undo directly (only tick, in AC-01/AC-02).
- Decision: implemented `setOccurrenceUndone` (server action, mock mutation, and the `set_occurrence_undone` RPC call) symmetrically with `setOccurrenceDone`, and wired the Tasks panel's untick to call it, optimistic-with-revert, the same as a tick.
- Reason: the UI (`apply-ticks.ts`, already built by FAM-UI-02) already presents unticking as a normal, bidirectional interaction. Wiring only the tick direction to persistence would leave unticking silently unsaved — a user who unticks a mistaken completion would see it revert on their next visit, which is a worse and more surprising outcome than not having built tick/untick at all. The Scope bullet's condition ("not implemented until answered") is now satisfied.
- Alternatives considered: leave unticking local-only (Scope's literal minimum reading) — rejected for the reason above; add a CHG entry to formally add an AC for it — the Scope already covers it pending OQ-10, so this is fulfilling existing scope, not adding new scope.
- Consequences: added `setOccurrenceUndone` to `src/server/events/actions.ts` and `src/mocks/queries/events.ts` (new files: none). New tests: `[FAM-05][AC-01] unticking a Done task calls setOccurrenceUndone...`, `[FAM-05][AC-02] a failed undo reverts...`, and two integration cases.
- Human confirmation required: **yes — HUMAN REVIEW requested.** This extends the feature's built behaviour beyond what AC-01–AC-04 literally test, on the reasoning above; flagging for the human to confirm the scope reading before merge.
- Test changes caused (if any): none removed or weakened, only added.

### FD-02 — FAM-UI-02's "tick is display only" test updated to reflect FAM-05's persistence
- Date: 2026-09-27
- Context: `family-calendar.test.tsx`'s `[FAM-UI-02][AC-08]` suite included a test asserting `expect(mocks.setOccurrenceDone).not.toHaveBeenCalled()` — true before FAM-05, since ticking was local-only display (FAM-UI-02's own PRD explicitly deferred saving to FAM-05).
- Decision: relabelled the test `[FAM-05][AC-01]` and changed its assertion to `toHaveBeenCalledWith(PHYSIO)`, keeping its other assertions (Log unchanged on one tick, no navigation) unchanged, since those remain true.
- Reason: recorded requirement change (TESTING.md §6) — FAM-UI-02 explicitly scoped saving to FAM-05, so this is the expected, planned change once FAM-05 lands, not a misread or regression.
- Alternatives considered: none — the old assertion is now simply false.
- Consequences: none beyond the relabel; no other FAM-UI-02 test asserted the old "not saved" behaviour.
- Human confirmation required: no (this was FAM-UI-02's own documented plan).
- Test changes caused: `[FAM-UI-02][AC-08] the tick is display only...` → `[FAM-05][AC-01] ticking saves via setOccurrenceDone...`, `family-calendar.test.tsx`, reason above, **flagged for review** (test expectation changed on behaviour, per CLAUDE.md §5).

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
