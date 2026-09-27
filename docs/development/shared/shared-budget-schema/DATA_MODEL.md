# Data Model — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Status: DESIGNED 2026-09-27 against `supabase/migrations/*` (tenancy, audit_log, care_events) and PD-058 / PD-059 / PD-060. Migration: `supabase/migrations/<timestamp>_budget.sql`.

## Tables

| Table | Key columns | Notes |
|---|---|---|
| budget_buckets | id uuid pk, client_id fk → clients, name text (1–40 after trim), kind text null (ndis / fixed / government), removed_at timestamptz null, created_by, created_at, updated_at | Open buckets (PD-059). Unique (client_id, lower(btrim(name))) where removed_at is null. Soft-removed so History still resolves. No period columns (FD-02). |
| budget_fund_entries | id, seq identity, bucket_id fk, client_id, kind ('funds_added' \| 'funds_removed' \| 'bucket_added' \| 'bucket_removed'), amount numeric(12,2) signed, note text null, description text, recorded_by uuid (no FK), recorded_by_name text, entry_date date (Australia/Melbourne), created_at | Append-only. Sign by kind: funds_added > 0, funds_removed < 0, bucket_added >= 0, bucket_removed <= 0. Net funds = sum(amount). |
| budget_costs | id, seq identity, bucket_id fk, client_id, event_id fk → care_events on delete set null, original_start timestamptz, description text (event title snapshot), amount numeric(12,2) > 0, status ('paid' \| 'pending'), incurred_on date, paid_on date null, note null, recorded_by, recorded_by_name, created_at | One row per completed occurrence: unique (event_id, original_start). Only pending → paid is allowed after insert. Never deleted. |
| care_events (altered) | + cost numeric(12,2) null check > 0, + bucket_id fk → budget_buckets null | Both set or both null. Bucket must belong to the event's client. Changes apply to future completions only (a cost is read at completion). |

## Functions (all SECURITY DEFINER, fixed search_path, actor = auth.uid())

- `can_read_budget(client_id)`: family, assigned carer, admin of the client's organisation. `can_edit_budget(client_id)`: family or admin (PD-058).
- `add_bucket(client_id, name, starting_amount, kind default null, note default null)`, `rename_bucket(bucket_id, name)`, `remove_bucket(bucket_id, note default null)`.
- `add_funds(bucket_id, amount, note default null)` (then settles pending costs oldest first, whole), `remove_funds(bucket_id, amount, note default null)` (refused above the balance).
- `budget_bucket_summary(client_id)` (SECURITY INVOKER so RLS applies): bucket_id, name, kind, total, used, remaining, percent_used, threshold_state, pending_total, pending_count.
- Trigger on `care_event_completions` (AFTER INSERT, action = 'done') charges the event's cost, once per occurrence.
- `budget_threshold_state(percent, pending_count)`: the one place the 75 / 85 / 100 constants live (PD-032).

## Rules
- total = sum(fund entry amounts); used = sum(paid costs); remaining = total − used (never below 0); percent_used = round(used / total × 100), null when total = 0.
- threshold_state: 'depleted' when percent ≥ 100 or any cost is pending; 'alert' ≥ 85; 'warning' ≥ 75; else 'normal'.
- Every table has RLS enabled in the same migration; authenticated users can only select; all writes go through the functions; money is numeric(12,2); timestamps timestamptz; F0-08 audit trigger attached to all three tables.
