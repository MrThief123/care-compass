# Decisions — F0-10 Shifts schema, active-shift function and conflict query

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-09 | Carer access model | YES | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-21 | Rostering scope and shift patterns | no | Shift assignment in scope per later sources; fixed chips for MVP, configurable patterns parked (PL-19). |
| OQ-27 | Shift edit, extend and cancel workflow | no | Design required. |

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
