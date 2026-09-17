# Data Model — F0-06 Identity, organisation and client access schema with RLS

Status: PROPOSED (validate against ARCHITECTURE.md and existing migrations before implementing).

| Table | Key columns | Notes |
|---|---|---|
| organisations | id uuid pk, name text, abn text, phone text, address text, created_at | Fields from Admin Settings design (Organisation info). |
| profiles | id uuid pk = auth.users.id, role app_role, organisation_id uuid null fk, first_name, last_name, phone, email, address, job_title text null, is_active bool default true | job_title holds org-specific label e.g. 'Registered Nurse' (Admin Staff design; CIS3 #3–4). |
| clients | id uuid pk, organisation_id uuid null fk (current org), first_name, last_name, date_of_birth date, suburb text, avatar_path text null, created_at, updated_at | One organisation at a time (UI-D3). |
| client_family_members | client_id fk, profile_id fk, relationship_label text, pk(client_id, profile_id) | Family authority model subject to OQ-16. |
| carer_client_assignments | id, carer_id fk profiles, client_id fk, organisation_id fk, started_at, ended_at null | Definition of 'assigned' subject to OQ-09. |
| client_info_sections | client_id fk, key text check in ('description','habits','medical_history'), body text, updated_by fk, updated_at; pk(client_id, key) | Moved from FAM-09 (plan v0.2). |


Rules: every table has RLS enabled in the same migration; money uses numeric(12,2); timestamps are timestamptz; audit trigger attached (F0-08 pattern).
