# Decisions — CAR-06 Carer — Mark tasks done

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES | (ANSWERED, PD-041/CHG-027) Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-10 | Status behaviour and undo | YES | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-33 | Carer calendar and task semantics | YES | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |
| OQ-34 | Event notes and comments | no | Parked (PL-21) until designed. |

## Feature decisions log

Blocking OQ-09, OQ-10 and OQ-33 are ANSWERED in root DECISIONS.md (PD-041, PD-044 as amended by CHG-009, CHG-025/026). OQ-34 (comments) stays parked.

### FD-01 — CAR-06 wires Home, Calendar and Care log, with an additive base path in Lane F files
- Date: 2026-10-01
- Context: the carer Calendar tab is a 'Coming soon' placeholder, and the Family modules hardcode `/family/…` links.
- Decision: see root CHG-043. Optional `basePath` and read-only flags, defaults unchanged.
- Alternatives considered: a copy of the views under `carer-patients` (rejected: ~1,500 duplicated lines, second pattern); Calendar only (rejected by the human).
- Human confirmation required: done (Dhruv Verma, 2026-10-01).

### FD-02 — Task detail opens read-only inside the carer area (assumption)
- Date: 2026-10-01
- Context: Care log and Calendar rows open Task detail; no carer route exists, and a `/family/` link would bounce the carer.
- Decision: add `/carer/patients/[clientId]/tasks/[occurrenceKey]` reusing the Family Task detail with Edit event hidden. No ticking there.
- Human confirmation required: yes. Flag in the PR; reverse by hiding the row links if the human disagrees.

### FD-03 — Test mapping changed from the planning pack
- Date: 2026-10-01
- Context: the pack's T-02 and T-03 targeted Carer Home, which CHG-025/026 removed from this feature.
- Decision: T-01 to T-03 retargeted at the patient's Calendar tab; T-04 to T-08 added for AC-04 to AC-08. No test existed, so no HUMAN REVIEW flag is needed.

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
