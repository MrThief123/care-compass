# Decisions — F0-08 Append-only audit log capture

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared work | YES | ANSWERED (root DECISIONS.md, PD-041 / 2026-09-17): `feature/shared-<name>` from `main`, PR → `main`. |

## Feature decisions log

### FD-01 — Append-only enforced by a guard trigger as well as grants
- Date: 2026-09-25
- Context: PRD says REVOKE UPDATE/DELETE from authenticated and anon. The service role and table owner bypass grants and RLS, but the feature goal is that nobody, including admins, can rewrite history.
- Decision: revoke all privileges from anon/authenticated, enable RLS with no policies, and add BEFORE UPDATE/DELETE row and BEFORE TRUNCATE statement triggers that raise `42501` for every role.
- Reason: makes AC-02 hold for every role, not only the two named in the PRD.
- Alternatives considered: grants only (leaves the service role able to edit history).
- Consequences: a legitimate purge (e.g. a future retention job) needs a controlled migration that drops the guard.
- Human confirmation required: no.
- Test changes caused: none (supplementary T-02b added).

### FD-02 — record_id and client_id derivation
- Date: 2026-09-25
- Context: DATA_MODEL says `record_id uuid`, but `client_family_members` and `client_info_sections` have composite keys and no `id`.
- Decision: `record_id` is the row's `id` when present, else null (the keys remain in before/after). `client_id` is `clients.id` for the clients table, else the row's `client_id`, else null.
- Reason: keeps one generic trigger function with no per-table arguments.
- Alternatives considered: trigger arguments naming the key column; a text record_id.
- Consequences: `record_id` is nullable. Later tables should have an `id` uuid PK (already the convention, ARCHITECTURE.md §6.1).
- Human confirmation required: no.
- Test changes caused: none (T-04 covers it).

### FD-03 — Triggers attached to all seven existing tables; actor role lookup
- Date: 2026-09-25
- Context: PRD says attach to F0-06 tables; F0-10 (shifts) merged first and ARCHITECTURE.md §6.1 requires the trigger on every client-scoped table.
- Decision: attach to organisations, profiles, clients, client_family_members, carer_client_assignments, client_info_sections and shifts, in this feature's migration. `actor_role` is the actor's `profiles.role`, `'system'` when `auth.uid()` is null, and `'unknown'` if a session user has no profile.
- Reason: one migration owns the pattern; avoids editing merged migrations.
- Alternatives considered: editing the F0-06/F0-10 migrations (rejected: history).
- Consequences: F0-11, F0-12 and F0-13 attach their tables with the one-liner in ARCHITECTURE.md §6.1.
- Human confirmation required: no.
- Test changes caused: none.
- Note: F0-06 has no UPDATE policy on `clients` yet, so T-01 runs the update as the table owner with Helen's JWT claims set (the trigger reads `auth.uid()`).

### FD-04 — Generated types not regenerated (needs human decision)
- Date: 2026-09-25
- Context: see PROGRESS.md "Problems encountered". `database.types.ts` is stale (has a `test` table, lacks `shifts`); regenerating breaks `typecheck` via `src/app/api/test/route.ts`.
- Decision: leave `database.types.ts` unchanged in this PR.
- Reason: fixing it needs an edit under `src/app`, outside lane B.
- Alternatives considered: deleting or repointing the smoke route; hand-editing the generated file.
- Consequences: `audit_log` and `shifts` are missing from the generated types until someone resolves the route.
- Human confirmation required: yes — decide who removes `src/app/api/test/route.ts` (or recreates a `test` table) and regenerates types.
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
