# Decisions — F0-10 Shifts schema, active-shift function and conflict query

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | ANSWERED | Option B: `feature/shared-<name>` branched from `main`, PR → `main`. See root DECISIONS.md OQ-01. |
| OQ-09 | Carer access model | ANSWERED | Superseded by PD-041 (root DECISIONS.md), not the original proposed default: no separate assignment table — carer read/edit access to a client is derived directly from `shifts` rows (any current/future shift = read; `start_time ≤ now < end_time` = edit). |
| OQ-21 | Rostering scope and shift patterns | no | Shift assignment in scope per later sources; fixed chips for MVP, configurable patterns parked (PL-19). |
| OQ-27 | Shift edit, extend and cancel workflow | no | Design required. |

## Feature decisions log

_No feature-level decisions recorded yet — see root DECISIONS.md PD-041 for the OQ-09 answer this feature implements._

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
