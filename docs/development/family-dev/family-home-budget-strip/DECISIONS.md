# Decisions — FAM-03 Family Home — Budget strip

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-03 | Budget threshold percentages | YES | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. |
| OQ-04 | Funding model: buckets, categories and periods | YES | MVP: per-client buckets of kinds NDIS / Fixed / Government with one period each; categories and restrictions parked (PL-10). Obtain CIS4 before F0-12. |
| OQ-24 | Undesigned empty states | no | Use the EmptyState primitive with proposed copy flagged for review. |

## Feature decisions log

### FD-01 — Regenerated `database.types.ts`, stale since before F0-12 merged
- Date: 2026-09-28
- Context: F0-18 (merged 2026-09-27T08:41) regenerated the types file and, per its own FD-02,
  fixed the recurring blocker (`src/app/api/test/route.ts` pointed at a real table) that had
  made three earlier features revert their own regeneration. F0-12 (budget) merged later the
  same day, adding `budget_buckets`/`budget_fund_entries`/`budget_costs`,
  `care_events.cost`/`bucket_id`, and `budget_bucket_summary()` — none of which made it into
  the committed types file, since F0-12's own regeneration had been reverted before that fix
  existed (its PROGRESS.md "Problems encountered" / FD-04, never resolved before merge).
  Writing FAM-03's Supabase branch needs `budget_bucket_summary`'s real return type.
- Decision: ran `npm run db:types` again now that the blocker is actually fixed. ~1,030 lines
  changed (mechanical, generated).
- Reason: this feature cannot be typed correctly against a schema the types file doesn't know
  about; regenerating is the same trivial, low-risk cleanup F0-18's FD-02 already judged safe.
- Alternatives considered: a local typed-cast wrapper around the RPC call, the workaround three
  prior features used — rejected, since the actual blocker is gone and re-adding a cast the
  next feature would have to remove again serves no one.
- Consequences: `database.types.ts` now reflects `main` as of this feature's start. No other
  code needed to change (no existing typed-cast wrappers referenced budget tables to remove).
- Human confirmation required: no — mechanical, verified with `tsc --noEmit`, the full Vitest
  suite and `npm run build`.
- Test changes caused: none.

### FD-02 — Integration tests added beyond TEST_PLAN.md's component-only list
- Date: 2026-09-28
- Context: TEST_PLAN.md's T-01–T-04 are component-level, already satisfied by FAM-UI-01's own
  tests against `BudgetStrip`/`BudgetBucketTile` (which take `BudgetBucketSummary[]` as a prop
  — they cannot reach `getBudgetSummary`'s Supabase branch, the actual gap this feature closes).
  Proving the real wiring — the `budget_bucket_summary` RPC call, its field mapping, and that
  access is RLS-only — needs a local-Supabase integration test, the same pattern FAM-04/05/06/14
  each used for their own data-source wiring.
- Decision: added `tests/integration/family-home-budget-strip.test.ts` (7 tests: AC-02/AC-03's
  exact figures and states, AC-04's empty client, and four `[Scope]` RLS cases — assigned carer
  on shift, org admin, carer with no shift, unrelated family member).
- Reason: TESTING.md §6 treats an added test at a different level as a level change, not a
  behaviour change; no existing test was modified, removed or weakened.
- Human confirmation required: no.
- Test changes caused: none — new tests only.

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
