# Decisions — FAM-17 Family — Info tips on main buttons

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-25 | Editable FAQ and discussion board | no | Stay parked (PL-04, PL-05 remainder) |

## Feature decisions log

### FD-01 — Toggletip, not a hover-only tooltip
- Date: 2026-10-06
- Decision: opens on hover, focus and click/tap; Esc, blur, leave and outside click close it.
- Reason: hover-only fails keyboard and touch users and WCAG 1.4.13 (dismissible, hoverable, persistent).
- Alternatives considered: native `title` (no keyboard/touch); inline helper text (clutter).
- Human confirmation required: no (human chose a hover-over "info button"; behaviour widened for accessibility).

### FD-02 — Hand-rolled `InfoTip` in `src/components/ui` (flagged Lane S edit)
- Date: 2026-10-06
- Decision: one new file `src/components/ui/info-tip.tsx`, additive, kept in this PR (as CHG-051 and CAR-07 did). No new dependency.
- Reason: human chose hand-rolled over a library; shared kit is where primitives live; Carer and Admin can reuse it later.
- Human confirmation: the human owner, 2026-10-06 (in-session).

### FD-03 — Help text in one map in a Family folder
- Date: 2026-10-06
- Decision: `src/features/family-help/help-text.ts`, keyed by id, one sentence, at most 100 characters. Not editable in the UI.
- Reason: reviewable copy in one place; leaves room for OQ-25 later.

### FD-04 — No Figma design; built from tokens
- Date: 2026-10-06
- Decision: icon via the kit's `info` icon; surface, border and text colours from tokens; contrast checked.
- Human confirmation required: yes, a design check at PR review.

### FD-05 — Tip sits before "Enter event" on the Calendar toolbar; 150ms leave grace
- Date: 2026-10-06
- Decision: on the Calendar toolbar the "i" goes before the link, not after, so the existing FAM-UI-02 T-09 invariant (the link is directly before D/W/M) holds with no test change. Elsewhere it sits after the button. The tip closes 150ms after the pointer leaves, so crossing from the "i" to the tip does not lose it.
- Test changes caused: none.
