# Decisions — F0-06 Identity, organisation and client access schema with RLS

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-07 | Client record creation and family linking | YES | Admin adds client + family contact email → family receives an invitation to set a password; confirm. |
| OQ-09 | Carer access model | YES | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-16 | Family role granularity | YES | Single Family role with full family authority for MVP; view-only family parked (PL-16). |
| OQ-30 | Multi-client family accounts | no | Routes include clientId; switcher parked (PL-15). |

## Feature decisions log

### FD-01 — Cross-organisation profile display-name view not built
- Date: 2026-09-22
- Context: PRD.md scope lists "nobody reads other organisations' profiles except display names needed on shared records" as a PROPOSED view. No AC in ACCEPTANCE_CRITERIA.md and no case in TEST_PLAN.md covers it.
- Decision: not implemented in F0-06. `profiles_select_same_org` restricts reads to active profiles within the same organisation; no cross-organisation view exists.
- Reason: human confirmed it isn't needed.
- Alternatives considered: build the view now speculatively (rejected — no AC backs it, would be scope creep per CLAUDE.md §6).
- Consequences: if a later feature (e.g. an admin- or carer-facing screen showing another organisation's staff/family display name on a shared record) needs this, it must be scoped and added as its own change, not assumed to already exist.
- Human confirmation required: yes — CONFIRMED 2026-09-22 (not needed).
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
