# Data Model — F0-12 Budget buckets, fund top-ups, spending and summary calculation

Status: PROPOSED (validate against ARCHITECTURE.md and existing migrations before implementing).

| Table | Key columns | Notes |
|---|---|---|
| budget_buckets | id uuid pk, client_id fk, kind text, label text, period_start date, period_end date | Kinds pending OQ-04. |
| budget_fund_entries | id, bucket_id fk, amount numeric(12,2) check > 0, description text, entry_date date, recorded_by fk, created_at | Budget 'History' table in design (+$6,000 NDIS quarterly plan top-up). |
| budget_expenses | id, bucket_id fk, client_id fk, amount numeric(12,2) check > 0, description, spent_on date, event_id null fk, receipt_document_id null fk, recorded_by fk, created_at | Auto-deducts via summary (CM-0409). |


Rules: every table has RLS enabled in the same migration; money uses numeric(12,2); timestamps are timestamptz; audit trigger attached (F0-08 pattern).
