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

### FD-01 — F0-06's carer RLS still reads `carer_client_assignments`, not `shifts` (non-blocking for F0-10)
- Date: 2026-09-23
- Context: PD-041 (root DECISIONS.md) says carer read/edit access should be derived directly from `shifts` rows, with no separate assignment table. F0-06 (merged to `main`, `supabase/migrations/20260922053821_tenancy.sql`) was implemented against the earlier, superseded proposed default instead: `clients_select_carer` and `client_info_sections_select` read a persistent `carer_client_assignments` table (`started_at`/`ended_at`) that nothing currently populates.
- Decision: F0-10 proceeds standalone, exactly to its own PRD/ACs (the `shifts` table, `carer_on_active_shift()`, `overlapping_shifts()`, and RLS on `shifts` itself). It does not modify F0-06's migration or RLS policies — none of F0-10's ACs depend on `clients`/`client_info_sections` access.
- Reason: the conflict doesn't affect any built feature today — `carer_client_assignments` is empty (no feature writes to it yet) — and fixing it is out of F0-10's scope (CLAUDE.md §6). It does not block F0-10's own tests/ACs.
- Consequences: this is a real gap for later. Once carer-facing features land — CAR-01, CAR-03, CAR-04, CAR-06, ADM-07 (all depend on F0-10) — `clients_select_carer`/`client_info_sections_select` must be repointed at `shifts` per PD-041 before carers can see any client, or those features will silently return zero rows for every carer. Flagging here so whichever feature/controlled-change picks this up isn't surprised.
- Human confirmation required: yes — human said "ok" to proceeding this way in-session (2026-09-23), scope of the fix itself not yet assigned to a feature.
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
