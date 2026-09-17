# Data Model — F0-08 Append-only audit log capture

Status: PROPOSED (validate against ARCHITECTURE.md and existing migrations before implementing).

| Table | Key columns | Notes |
|---|---|---|
| audit_log | id bigint identity pk, occurred_at timestamptz default now(), actor_id uuid null, actor_role text, table_name text, record_id uuid, action text, before jsonb, after jsonb, client_id uuid null | Append-only; no update/delete grants. |


Rules: every table has RLS enabled in the same migration; money uses numeric(12,2); timestamps are timestamptz; audit trigger attached (F0-08 pattern).
