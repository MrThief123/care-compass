# Decisions — UI-00 Domain types, data-access contracts and design fixtures

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-13 | Staff names and job titles | no | Store first and last name; display first name + initial everywhere (matches design); job titles are a per-organisation editable list seeded with the three design values. |
| OQ-22 | Event fields | no | Add Title, Start time and Duration fields to the event form (design update). |
| OQ-29 | Which nurse is shown on an event | no | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |
| OQ-33 | Carer calendar and task semantics | no | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |

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
