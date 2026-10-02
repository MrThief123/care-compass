# Decisions — INT-11 Email Family and admins when an event cost goes pending

## Open decisions affecting this feature
None. FD-03, FD-07 and FD-09 were confirmed as proposed by the human on 2026-10-02.

## Controlled change
CHG-052 in the root `DECISIONS.md` (confirmed by the human 2026-10-02) promotes PL-25 to INT-11.

## Feature decisions log

### FD-01 — Trigger
- Date: 2026-10-02 · Human-approved (final).
- Decision: send when a cost is first held as pending, i.e. it could not be paid in full when charged. Not when it is later paid.
- Real trigger point: `care_event_completions_charge_cost()` (after-insert trigger on `care_event_completions`, migration `20260927000000_budget.sql`) inserts `budget_costs` with `status = 'pending'` when an older cost is already pending or the cost exceeds `budget_bucket_balance`. It is the only place a cost is created pending. Whole, never part-paid.
- Consequence: no schema change needed to detect the event; the job selects `status = 'pending'` rows.

### FD-02 — Idempotency
- Date: 2026-10-02 · Human-approved (final): one email per pending cost, never repeated, never resent on retries or re-runs.
- Mechanism: see FD-05.

### FD-03 — Digest for several costs in one run (human-confirmed 2026-10-02)
- Proposal: per run, per client, one email per recipient listing one line per newly pending cost, then the closing sentence once. A single cost is the approved sentence exactly.
- Reason: a catch-up after several completions (or the first-run backlog, FD-09) would otherwise send one email per cost to every recipient.
- Alternatives: one email per cost always (simplest, noisiest); one digest per client across all buckets (this proposal) vs per bucket.
- Human confirmation required: yes (default if unanswered: digest as proposed).

### FD-04 — Recipients
- Date: 2026-10-02 · Human-approved (final): Family for that client plus admins of the client's organisation; carers do not get it. Implemented as INT-01 does (active, with email, current organisation read fresh).

### FD-05 — Durable notified marker: separate table (least invasive additive option)
- Proposal: new table `budget_pending_cost_notifications (cost_id uuid primary key references budget_costs(id) on delete cascade, sent_at timestamptz not null default now())`, RLS on, no policies, revoked from anon/authenticated, written only by the service-role job after all recipients succeed, insert `on conflict do nothing`. Plus function `budget_pending_costs_to_notify()` returning pending costs with no marker.
- Rejected: `notified_at` column on `budget_costs`. `budget_costs_guard_update` rejects any update other than pending to paid, so the job could not set it without editing that guard and the append-only protection, and `budget_costs` is read by Budget screens and F0-12 pgTAP. A new table changes no table another feature reads (CLAUDE.md §3). `on delete cascade` is safe: costs are never deleted (delete is rejected by `budget_reject_change`), so the cascade is moot but harmless.
- Same shape as INT-01's `budget_threshold_notifications`.
- Human confirmation required: no (least-invasive default; human may amend).

### FD-06 — Wording
- Date: 2026-10-02 · Human-approved (final): "A cost of $X for <event> could not be covered by <BUCKET> and is pending. Add funds to pay it. Log in and refer to plan." Names the bucket and event only.
- Detail chosen here: digest lines repeat the first sentence per cost; the second and third sentences close the email once. Subject "Schedule of Care Program — pending cost". Amount as `$80.00`. Event name is `budget_costs.description` (title when charged).

### FD-07 — Cadence and stale pending (human-confirmed 2026-10-02)
- Jobs run on schedule (PD-050/CHG-046), not on completion, so an email may lag up to one interval. Proposal: a second daily Vercel cron entry `0 21 * * *` like INT-01 (Vercel Hobby limits crons to daily; a tighter interval needs a plan or an extra trigger).
- A cost paid off before the run is skipped (the email would say "is pending" falsely) and is never emailed, even though it was once held pending. This slightly departs from "first held as pending". Alternative: email it anyway. Proposal chosen: skip.
- Human confirmation required: yes for the skip rule; cadence follows CHG-046.

### FD-08 — Recipient code is not shared with INT-01's job
- INT-01's `resolveRecipients` is private to `budget-thresholds.ts` and INT-10 edits that file. To avoid a merge conflict and a contract change, INT-11 starts with its own small copy. Extracting a shared helper (also useful to INT-09 care alert emails) is a refactor for a later feature, not folded in (CLAUDE.md §6).

### FD-09 — First-run backlog (human-confirmed 2026-10-02: option a, email them once)
- Costs already pending on deploy have no marker and would be emailed once on the first run. Options: (a) email them (they are real and unresolved; the digest keeps it to one email per client); (b) the migration seeds a marker for every currently pending cost so only new ones notify. Recommendation: (a), synthetic/dev data only at this stage of the project. Human to confirm.

## Conflicts and notes found while drafting
- PRD.md §17 PL-25 and DEVELOPMENT_PLAN.md's INT-01 card line already point here; neither is edited by this draft.
- INT-10's wording change is not on `main` yet; INT-11 does not depend on it.
- DEVELOPMENT_PLAN.md §7's "next number" line is stale on `main` (still lists INT-11 as free; INT-10 and FAM-16 are in flight).

## Implementation notes (2026-10-02)
- FD-10: the job result is `{ emailsSent, costsRecorded, failures: [{ costId }] }`. Provider error text is not copied into the result (it could carry an address).
- FD-11: `database.types.ts` regenerated with `npm run db:types` (additive: new table and function only).
- FD-12 (HUMAN REVIEW: test expectation changed): INT-01's `route.test.ts` cron assertion `toEqual([one entry])` became `toContainEqual(INT-01 entry)`. Before: crons equal exactly INT-01's entry. After: INT-01's entry is present. Reason: INT-11 requires a second cron entry (recorded requirement change, CHG-052). No assertion about the job's behaviour changed.
- FD-13: costs in the integration tests are inserted pending directly (as INT-01's tests do), not through the completion trigger; paying off adds matching funds first so no bucket passes 100% and trips INT-01's threshold tests when files run in parallel on the same database.
- FD-14: digest layout. One cost: the approved sentence, a space, the closing. Several: one line per cost (oldest first), a blank line, the closing once.
