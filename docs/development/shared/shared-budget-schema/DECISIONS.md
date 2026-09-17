# Decisions — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-03 | Budget threshold percentages | YES | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. |
| OQ-04 | Funding model: buckets, categories and periods | YES | MVP: per-client buckets of kinds NDIS / Fixed / Government with one period each; categories and restrictions parked (PL-10). Obtain CIS4 before F0-12. |
| OQ-05 | Who can add funds and record spending; Budget History contents | YES | Family adds funds; carers record expenses during shifts; admins read — confirm, and design the Update flow. |
| OQ-24 | Undesigned empty states | no | Use the EmptyState primitive with proposed copy flagged for review. |
| OQ-28 | Budget email recipients and budget period | no | Family + current organisation admins; registry parked (PL-02); period = bucket period. |

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
