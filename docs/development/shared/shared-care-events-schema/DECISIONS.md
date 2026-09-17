# Decisions — F0-11 Care events, occurrence overrides and append-only completions

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-10 | Status behaviour and undo | YES | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-22 | Event fields | YES | Add Title, Start time and Duration fields to the event form (design update). |
| OQ-29 | Which nurse is shown on an event | YES | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |
| OQ-09 | Carer access model | YES | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-33 | Carer calendar and task semantics | YES | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |
| OQ-34 | Event notes and comments | no | Parked (PL-21) until designed. |

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
