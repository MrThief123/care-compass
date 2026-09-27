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

### FD-01 — Scope rewritten for CHG-020 / CHG-021 / CHG-022
- Date: 2026-09-27
- Context: PRD.md, ACCEPTANCE_CRITERIA.md, TEST_PLAN.md and DATA_MODEL.md described the original model (three fixed kinds, overdraft, expenses recorded by carers). PD-058, PD-059 and PD-060 changed it, and CHG-020 / CHG-021 say Lane B rewrites them when F0-12 starts.
- Decision: rewrite them as listed in the PRD Scope. AC-03 (negative remaining) is replaced by "a removal cannot exceed the balance"; AC-02 uses 75 / 85 / 100; AC-07 to AC-15 are new. The original AC-01, 02, 04, 05, 06 keep their intent.
- Reason: the plan itself instructs this; the earlier ACs would now assert behaviour the human removed.
- Alternatives considered: leave the ACs and note the exceptions (rejected: tests would assert overdraft).
- Consequences: F0-11 gains `cost` and `bucket_id` on `care_events`, done here in the F0-12 migration as CHG-020 asks. INT-01 reads pending costs for its email.
- Human confirmation required: yes (Prajeet, review of this rewrite before implementation).
- Test changes caused: none (no tests existed).

### FD-02 — Human answers to the two questions CHG-020 left open, and no accounting period yet
- Date: 2026-09-27 · Decided by: Prajeet (in-session)
- Decision: (1) deleting or deactivating an event never deletes its costs: the care was already done; a cost can be removed separately if needed. (2) A pending cost carries over until it is paid; it never expires or resets.
- Follow-on (Claude's proposal, needs confirmation): the original `period_start` / `period_end` are NOT built. PD-059's Edit budget form has no period field, no decision says how a period starts or ends, and period filtering would make a top-up dated outside the period fail to raise the balance. The PRD edge case "entries outside the period excluded" is therefore dropped and pending carry-over is trivially true. INT-01's "period = bucket period" (PD-035) will need a period decision later.
- Human confirmation required: yes for the follow-on.

### FD-03 — Assumptions made where the decisions are silent (each needs confirmation)
- A cost is charged once per occurrence (unique `(event_id, original_start)`). Undoing a completion does not refund or cancel the cost, and re-completing does not charge again.
- Strict oldest-first also applies to new costs: while any cost is pending on a bucket, a newer cost is pending too, even if the balance could cover it.
- An event's cost and bucket are set together or not at all, and the bucket must be the same client's.
- Removing a bucket clears `cost` and `bucket_id` on events pointing at it (future completions then cost nothing).
- Admin writes to `care_events` (so an admin can set an event's cost, PD-058) are not part of this feature: F0-11's RLS still says an admin never writes events. Raised for the human; needs its own change.
- The UI amount parser in `src/features/family-budget/budget-edit.ts` already validates amounts; `src/lib/money/schema.ts` is the server-side twin. Deduplicating is a follow-up (lib cannot import features).
- Human confirmation required: yes.
