# Decisions — F0-01 Validate planning pack against repository, Figma and sources

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-20 | Repository and infrastructure reality | YES | Treat the current repository as authoritative; ask whether any Supabase project/schema exists to adopt. |
| OQ-19 | Figma access and remaining design gaps | no | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. |
| OQ-02 | Dashboard phase order | no | Family → Carer → Admin (source build order). Seed data (F0-16) removes cross-dashboard data dependencies. |

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
