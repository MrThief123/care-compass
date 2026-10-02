# Decisions — FAM-11 Family — Update funds (Edit budget)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

None. OQ-04, OQ-05, OQ-19 and OQ-03 are ANSWERED in root DECISIONS.md (PD-033, PD-034, PD-058 to PD-060; CHG-020 to CHG-022 rewrite this feature).

## Feature decisions log

### FD-01 — One `save_budget_edit` database function applies the whole save
- Date: 2026-10-02
- Context: PD-059 says a save with any wrong field is refused whole. F0-12 has only one-change functions (`add_funds`, `remove_funds`, `add_bucket`, `rename_bucket`, `remove_bucket`), so an action looping over them could leave a half-applied save when the second call fails.
- Decision: a new migration adds `save_budget_edit(p_client_id, p_buckets jsonb, p_added jsonb, p_note text)`, one transaction that calls the existing functions, in the order removals, renames, fund changes, added buckets. A refusal raises the existing errcode and message with the field path (`buckets.<i>.amount|name|remove`, `added.<i>.name|startingAmount`) in `detail`.
- Reason: all-or-nothing in the database; every F0-12 rule (amount checks, balance limit, pending settlement, who recorded it) stays in one place. The order lets a name freed by a removal or a rename be reused in the same save, which the page already allows.
- Alternatives considered: the action calling the RPCs in sequence (rejected: partial saves, no rollback); one big new function re-implementing the rules (rejected: a second copy of the rules).
- Consequences: a migration under `supabase/**` (Lane B's folder) from a Lane F feature, additive only, same route FAM-13 took; `database.types.ts` regenerated. No existing function or table changes.
- Human confirmation required: yes. CONFIRMED 2026-10-02 (Dhruv Verma, in-session).

### FD-02 — Mock mode keeps Phase 1 local state; supabase mode persists
- Date: 2026-10-02
- Context: FAM-UI-05's 2,500 lines of tests describe the local-state page.
- Decision: the Edit budget route passes `persist` (true when `DATA_SOURCE=supabase`). With it, Save calls `saveBudgetEdit` and the page returns to Budget, which re-reads the database; the route holder is not used. Without it, nothing changes. The action itself returns `NOT_AVAILABLE` in mock mode (as FAM-13 does).
- Reason: no assertion in FAM-UI-05's tests changes; screens still run on fixtures until the switch.
- Alternatives considered: remove the local-state path and add a mock store (rejected: rewrites many FAM-UI-05 tests, HUMAN REVIEW cost for no user value).
- Human confirmation required: yes. CONFIRMED 2026-10-02 (Dhruv Verma, in-session).

### FD-03 — Errors: field messages come from the database, everything else is fixed text
- Date: 2026-10-02
- Context: the page already catches every wrong field before calling, so a database refusal means a race or a client that skipped the page.
- Decision: a `22023` or `23505` whose `detail` is exactly a field path becomes a field error with the database's message (the over-balance message carries the bucket's own balance, which only its family or admins can reach). Any other failure is a fixed message: `42501` "Only the client’s family or their organisation’s admins can change the budget."; anything else "Couldn’t save the budget. Try again." Nothing from the database text, no ids, no client names. The log carries a feature tag and the error's class only.
- Alternatives considered: fixed text for field errors too (rejected: loses "Only $X available").
- Human confirmation required: no (inside the PD-059 rules).

### FD-04 — A save with no changes writes nothing and does not call the action
- Date: 2026-10-02
- Decision: the page uses `applyBudgetEdit(...).changed` to skip the call; the database function also writes nothing for rows with amount 0, no rename and no removal. A typed `0` stays refused on the page (PD-059); the stored edit uses 0 for "no change".
- Human confirmation required: no.

### FD-05 — Tests changed (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-02
- Context: running `supabase/tests/budget_save_edit.test.sql` against the real function, 8 of 60 assertions failed on wrong expected values written before the function existed. The F0-12 functions behave as documented.
- Decision: genuine test bugs fixed; no assertion removed, no behaviour weakened. Human chose this (Dhruv Verma, in-session). FAM-UI-05's tests and every other existing test are untouched.

| Test | Before | After | Reason |
|---|---|---|---|
| 6, 8, 30 (baseline / "write nothing" / "no History row") | 17 rows | 7 rows | seed is 6 `funds_added` rows plus the one top-up |
| 26 (AC-04 wrong amount) | "an amount must be more than $0…" | "enter an amount more than $0…" | F0-12 `budget_check_amount` message; AC-02's test already expects it |
| 46-48 (AC-06 Government top-up) | $100 top-up, $0 pending, remaining $30 | $150 top-up, remaining $40 | $240 - $40 + $100 = $300 cannot pay the $310 pending cost; $150 can ($200 + $150 - $310) |
| 58 (AC-03 "nothing changed") | 30 rows | 17 rows | equals the 17 asserted just before the permission checks |

### FD-06 — History tie-break: newest recorded first
- Date: 2026-10-02
- Context: History sorted by date only, so entries on the same day came out in no fixed order (found testing Edit budget saves). Seeded entries are dated after the real clock, so they also sit above today's entries; that part is seed data, not a fault.
- Decision: `getFundHistory` sorts by date (newest first), then by `created_at` (newest first). Rows written by one save share a timestamp and still tie.
- Reason: a save's entries should read in the order they were made.
- Alternatives considered: sort by recorded time first (rejected: changes FAM-10 date ordering); fix seed dates only.
- Consequences: touches the FAM-10 query `src/server/budget/queries.ts`; no test changed; ordering by date is unchanged.
- Human confirmation required: yes. Option 1 chosen by the user on 2026-10-02.

### FD-07 — Controlled change: an event's cost and bucket are saved, and an ended plain event is charged
- Date: 2026-10-02
- Context: the Add/Edit event form already collects Cost and Paid from, but `createEvent` and `updateEvent` drop them and nothing calls `set_event_cost`, so no event cost is ever stored. Tasks are charged by the F0-12 trigger when ticked Done. Plain events (CHG-009) are never ticked, so they were never charged.
- Decision (human, in-session): (1) the event actions save the cost and bucket through `set_event_cost`; (2) a plain event with a cost is charged once, in full, after it ends: the same paid-or-pending rule as a Done task (PD-058). No scheduled job: `settleEndedEventCosts(clientId)` runs when Budget or Family home loads, finds ended occurrences of plain events with a cost, and calls the new `charge_ended_event_occurrences` function. Only occurrences that start after the cost was set are charged (new `care_events.cost_set_at`), so a past-dated event is not charged retroactively. A cancelled occurrence is not charged.
- Alternatives considered: a scheduled job (rejected by the user: "it'd just be an event"); writing a `done` completion for plain events (rejected: CHG-009).
- Consequences: new additive migration (one column, one function); edits the events-lane file `src/server/events/actions.ts` (human confirmed); new ACs AC-09 to AC-12; `charge_ended_event_occurrences` trusts the caller's list of ended occurrences (checked only to be in the past and after the cost was set), as family can already edit the budget freely.
- Human confirmation required: yes. Given by the user on 2026-10-02.

### FD-08 — Scope addition: Task detail shows what Edit event shows (read-only)
- Date: 2026-10-02
- Context: clicking an event opened a card set with Status, Description and Documents only; repeat, times, tick-off, cost and bucket were visible only inside Edit event.
- Decision (human, in-session): Task detail gets a read-only Details card: Repeats, Start time, End time, Tick-off, Cost, Paid from. Read from `getEvent` and `getBudgetSummary` in the Family page only; the carer page is unchanged.
- Alternatives considered: none.
- Consequences: out of the PRD scope, added on the human's instruction. Edits `src/features/family-task-detail/**` and the family task page.
- Human confirmation required: yes. Given by the user on 2026-10-02.
- Test changes caused: `tasks/[occurrenceKey]/page.edge.test.tsx`: added `getEvent` and `getBudgetSummary` to its module stubs (the page now calls them). No assertion changed. Approved by the user; flagged for review: yes.

<!-- Template
### FD-xx — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
