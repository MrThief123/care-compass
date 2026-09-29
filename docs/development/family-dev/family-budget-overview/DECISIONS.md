# Decisions — FAM-10 Family — Budget overview and history

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-04 | Funding model: buckets, categories and periods | YES | MVP: per-client buckets of kinds NDIS / Fixed / Government with one period each; categories and restrictions parked (PL-10). Obtain CIS4 before F0-12. |
| OQ-05 | Who can add funds and record spending; Budget History contents | YES | Family adds funds; carers record expenses during shifts; admins read — confirm, and design the Update flow. |
| OQ-24 | Undesigned empty states | no | Use the EmptyState primitive with proposed copy flagged for review. |
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

## Feature decisions log

### FD-01 — Removed the "getFundHistory throws not-implemented in supabase mode" test
- Date: 2026-09-29
- Context: `src/server/budget/queries.test.ts`'s `[FAM-UI-05][PRD] supabase mode` describe block asserted
  `getFundHistory` throws `notImplementedForSupabase("budget", "getFundHistory")` when
  `DATA_SOURCE=supabase`. FAM-10's scope is wiring that exact function to Supabase, so the assertion
  is now false by design — the function no longer throws in supabase mode.
- Decision: removed the test (was: `[FAM-UI-05][PRD] getFundHistory throws the not-implemented error
  naming its domain and function`); replaced with a comment pointing to the new coverage. The real
  Supabase-mode behaviour (mapping of `budget_fund_entries`/`budget_costs` to `FundEntry`, ordering,
  RLS) is covered by `tests/integration/family-budget-overview.test.ts` (T-05) against a local Supabase
  instance, following the pattern `tests/integration/family-home-budget-strip.test.ts` set for
  `getBudgetSummary`.
- Reason: TESTING.md §6 (recorded requirement change) — the feature this session implements makes the
  removed assertion's premise wrong, not a misread requirement.
- Alternatives considered: keeping the test and asserting on the new behaviour in the same file with a
  mocked Supabase client (rejected: every other domain's supabase-mode coverage in this codebase — e.g.
  `documents`, `budget` `getBudgetSummary` — is asserted through `tests/integration/**` against a real
  database, not a mocked client; matching that convention keeps one pattern per problem, CLAUDE.md §7).
- Consequences: `src/server/budget/queries.test.ts` no longer has a `getFundHistory` supabase-mode
  case of its own; that coverage lives in the new integration test file instead.
- Human confirmation required: yes — flagged HUMAN REVIEW in PROGRESS.md and the PR (an assertion was
  removed, CLAUDE.md §5).
- Test changes caused: `[FAM-UI-05][PRD] getFundHistory throws the not-implemented error naming its
  domain and function` removed from `src/server/budget/queries.test.ts`; flagged for review, yes.

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
