# Data Model — F0-13 Client document storage

Status: PROPOSED (validate against ARCHITECTURE.md and existing migrations before implementing).

| Table | Key columns | Notes |
|---|---|---|
| documents | id uuid pk, client_id fk, event_id null fk, storage_path text unique, filename text, mime_type text, size_bytes bigint, uploaded_by fk, uploaded_at, detached_at null | Retained in perpetuity. |


Rules: every table has RLS enabled in the same migration; money uses numeric(12,2); timestamps are timestamptz; audit trigger attached (F0-08 pattern).
