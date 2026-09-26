# Session State — F0-18 Carer view access derived from shifts

Last session date: none (no implementation session yet)
Current branch: n/a — `feature/shared-carer-shift-access` not created
Exact next action: Run `START FEATURE F0-18`.
Files likely to be touched next: new migration in `supabase/migrations/`, `supabase/tests/{tenancy_rls,care_events,transfer_client_organisation}.test.sql`, `src/lib/supabase/database.types.ts`, ARCHITECTURE.md.
Warning for next session: keep the `is_assigned_carer` name and signature so existing policies pick up the new rule. Changing existing pgTAP setup from assignments to shifts is an infrastructure change: record each in DECISIONS.md.
