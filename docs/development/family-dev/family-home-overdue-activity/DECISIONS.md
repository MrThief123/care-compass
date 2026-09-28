# Decisions — FAM-02 Family Home — Overdue card and Recent activity

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-10 | Status behaviour and undo | no | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-31 | Task log range | no | Occurrences up to end of today, newest first. |

## Feature decisions log

### FD-01 — Overdue card empty-state copy corrected to the controlled AC-02 wording
- Date: 2026-09-27
- Context: FAM-UI-01 (DECISIONS.md FD-16/OQ-24, OPEN, non-blocking) shipped the Overdue empty state with body "Nothing is overdue right now.", flagged "design gap, built from tokens, please review." FAM-02's own controlled AC-02 requires "There are no overdue tasks right now."
- Decision: changed `overdue-card.tsx`'s empty-state body to "There are no overdue tasks right now.", matching AC-02 exactly. This also resolves the design-gap flag FAM-UI-01 left open for this string.
- Reason: AC-02 is this feature's own controlled acceptance criterion; the mismatch would otherwise leave AC-02 permanently unmeetable without a CHG.
- Alternatives considered: raise a CHG against FAM-02's AC-02 to match FAM-UI-01's copy instead — rejected, since FAM-UI-01 itself flagged its copy as an unreviewed design gap, not a confirmed decision.
- Consequences: none — no test in FAM-UI-01's suite asserted the old body text (only the "All caught up" title), so nothing broke.
- Human confirmation required: no (copy-only, corrects an already-flagged design gap to the controlled spec).
- Test changes caused: none.

### FD-02 — `getTaskLog`'s Supabase read bounds "unbounded" task history to a fixed early sentinel date
- Date: 2026-09-27
- Context: `getTaskLog` (unlike `getOccurrences`) takes no date range from its caller, but `loadOccurrences`/`buildOccurrences` (F0-11) need one to expand recurrence. OQ-31 (Task log range, OPEN, non-blocking) proposes reading "up to end of today"; it does not address a lower bound, and a perpetual recurrence has no natural one.
- Decision: read from a fixed constant `TASK_LOG_EARLIEST_DATE = "2000-01-01"` through the end of today (Melbourne). `expandOccurrences` (src/lib/recurrence `expand.ts`) always steps forward from each event's own anchor, never from `range.from`, so an earlier bound never truncates real history and never costs extra iterations — it only has to predate every `care_events` row this app will ever hold.
- Reason: `getTaskLog` needs *a* bound to call `loadOccurrences`; this one is provably safe (see Consequences) rather than an arbitrary lookback window.
- Alternatives considered: compute the client's earliest event `starts_at` per call (adds a query, no behavioural difference since expansion already starts at the anchor); leave `getTaskLog` unimplemented for Supabase until OQ-31 is answered (blocks FAM-02 entirely, and OQ-31 is non-blocking).
- Consequences: correct for any event created after 2000-01-01 (i.e. always, in practice). Filtering, ordering, paging and `total` reuse the mock's own pure `queryTaskLog` so both data sources answer identically for the same rows.
- Human confirmation required: no (implementation detail, not user-facing; OQ-31 itself stays open for the human to answer).
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
