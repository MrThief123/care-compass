# Decisions — UI-03 Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-03 | Budget threshold percentages | no | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. |
| OQ-38 | Client information fields | no | Build the design for MVP; remaining fields parked (PL-13, PL-22) pending client confirmation. |
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

## Feature decisions log

_No decisions recorded yet._

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
