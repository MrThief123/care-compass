# Decisions — UI-00 Domain types, data-access contracts and design fixtures

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

All decisions below are recorded ANSWERED in the root `DECISIONS.md` as of 2026-09-17 (verified there before starting this session). None remain open for this feature.

| ID | Decision needed | Blocking? | Status (root DECISIONS.md) | Answer used here |
|---|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | ANSWERED (PD-030) | Option B: `feature/shared-<name>` from `main`, PR → `main`. Used to create this branch. |
| OQ-13 | Staff names and job titles | no | ANSWERED (PD-038) | Store first and last name; **display the full name everywhere** (supersedes the "first name + initial" default — see FD-01 below); job titles are a per-organisation editable list seeded with Registered Nurse / Enrolled Nurse / Support Worker. |
| OQ-22 | Event fields | no | ANSWERED (PD-047) | Title, Start time and Duration fields added to the event form/data model. |
| OQ-29 | Which nurse is shown on an event | no | ANSWERED (PD-029/PD-041-adjacent) | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |
| OQ-33 | Carer calendar and task semantics | no | ANSWERED (PD-043) | (a) blocks = events, not shift slots; (b) no separate structured checklist sub-task entity — descriptive text only; (c) Carer Home shows events for clients the carer is currently/upcoming rostered to. |

## Feature decisions log

### FD-01 — `displayName` returns the full name, not "First I." (per PD-038)
- Date: 2026-09-17
- Context: UI-00's PRD.md Scope and ACCEPTANCE_CRITERIA.md AC-01 / TEST_PLAN.md T-01 were drafted against the older "Aisha Rahman" → "Aisha R." abbreviation shown in the current design mockups. Root `DECISIONS.md` PD-038 (answering OQ-13, CONFIRMED 2026-09-17) later decided staff names are stored as first+last and **displayed in full everywhere**, explicitly superseding the "Aisha R." / "Daniel K." abbreviated display convention.
- Decision: implement `displayName(fullName)` to return the trimmed, whitespace-normalised full name unchanged (e.g. `displayName('Aisha Rahman') === 'Aisha Rahman'`), not the abbreviated "Aisha R." form. Updated ACCEPTANCE_CRITERIA.md AC-01 and TEST_PLAN.md T-01 to match PD-038's confirmed answer.
- Reason: PD-038 is a human-confirmed decision (CLAUDE.md §9/§5 permit updating a controlled doc — PRD.md/ACCEPTANCE_CRITERIA.md — to record a decision the human has already answered). Implementing the stale abbreviation would ship code that contradicts a CONFIRMED decision.
- Alternatives: keep `displayName` abbreviating to "First I." per the original AC text (rejected — directly contradicts PD-038, which is later and CONFIRMED); leave `displayName` unimplemented pending human re-confirmation (rejected — blocks the whole feature over a decision that is already on record).
- Consequences: `PRD.md` Scope's formatter example, `ACCEPTANCE_CRITERIA.md` AC-01, and `TEST_PLAN.md` T-01 are updated to state the full-name behaviour. No other PRD.md scope item is affected.
- Human confirmation required: **HUMAN REVIEW: test expectation changed** — AC-01/T-01 assertion changed from an abbreviated to a full-name expected value; flagged in PROGRESS.md and to be flagged again in the PR description.
- Test changes caused: T-01 ([UI-00][AC-01]) — before: `displayName('Aisha Rahman') === 'Aisha R.'`; after: `displayName('Aisha Rahman') === 'Aisha Rahman'`; reason: recorded requirement change (PD-038 postdates and supersedes the original AC text).

### FD-02 — `src/server/<domain>/queries.ts` / `actions.ts` created by UI-00 despite AGENT_REFERENCE.md's default folder ownership
- Date: 2026-09-17
- Context: `PRD.md` Scope explicitly lists creating `src/server/<domain>/queries.ts` and `actions.ts` function signatures as UI-00 work. However `docs/AGENT_REFERENCE.md`'s folder-ownership table assigns `src/server/**` (except `data-source.ts`) to **Lane B**, and `ARCHITECTURE.md` §3.1 tags only `types/domain.ts`, `mocks/`, and `server/data-source.ts` with "(UI-00)" — it does **not** tag `server/<domain>/queries.ts`/`actions.ts` with UI-00. This is a genuine inconsistency between three controlled docs, and AC-04 (which this feature must meet) cannot be tested without a callable `getBudgetSummary(clientId)` contract function living somewhere under `src/server/`.
- Decision: create only the minimum `src/server/<domain>/` files needed to satisfy this feature's explicit PRD examples and ACs — `src/server/budget/queries.ts` (`getBudgetSummary`) and `src/server/events/queries.ts` + `actions.ts` (`getTodayOccurrences`, `getTaskLog`, `setOccurrenceDone`) — as brand-new files (no existing Lane B work touched or overwritten). Both files simply route to the mock implementation via `src/server/data-source.ts` and throw a clear "not implemented until Phase 3" error for `DATA_SOURCE=supabase`, exactly matching PD-028's adapter description.
- Reason: PRD.md is UI-00's own controlling, F0-01-validated document and explicitly names this as Scope; without at least the `budget` domain file, AC-04 (required for Definition of Done) cannot be met. Since no Lane B feature has started yet (F0-06 onward are all "NOT STARTED" per `plan-status.mjs`), creating new files in an as-yet-untouched path carries no real collision risk — a later Lane B PR can extend these files normally.
- Alternatives: skip creating `src/server/**` entirely and leave AC-04 BLOCKED pending a human ruling (rejected — silently fails Definition of Done for a documented conflict that has a low-risk resolution); edit `docs/AGENT_REFERENCE.md`/`ARCHITECTURE.md` ownership tags myself to resolve the conflict (rejected — those are human/controlled docs per CLAUDE.md §9 and the "Root plan docs" row of the ownership table itself).
- Consequences: **HUMAN REVIEW** — please reconcile `AGENT_REFERENCE.md`'s folder-ownership table and `ARCHITECTURE.md` §3.1's "(UI-00)" tags with `PRD.md`'s Scope so future features don't hit the same ambiguity. No functional risk: only new, additive files were created.
- Human confirmation required: yes (flagged in PROGRESS.md and the PR description).

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
