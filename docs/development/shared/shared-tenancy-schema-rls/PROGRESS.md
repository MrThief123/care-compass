# Progress — F0-06 Identity, organisation and client access schema with RLS

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D3–D4
Branch: `feature/shared-tenancy-schema-rls` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-07 — Client record creation and family linking
- OQ-09 — Carer access model
- OQ-16 — Family role granularity

## Dependencies status
- F0-04 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Enums: `app_role` (family, carer, admin).
- Tables: `organisations`, `profiles` (1:1 auth.users; role, organisation_id nullable for family, first_name, last_name, phone, job_title, is_active), `clients` (current organisation_id, name, date_of_birth, suburb, avatar_path), `client_family_members` (client_id, profile_id, relationship_label), `carer_client_assignments` (carer profile, client, organisation, started_at, ended_at).
- SQL helper functions (SECURITY DEFINER, stable, search_path fixed): `current_profile()`, `is_family_of(client_id)`, `is_admin_of_client(client_id)`, `is_assigned_carer(client_id)`.
- RLS enabled on every table with policies: family reads own linked clients; admin reads clients whose current organisation is theirs; carer reads clients with an active assignment; nobody reads other organisations' profiles except display names needed on shared records (PROPOSED view).
- Inactive profiles (is_active = false) match no policy.
- pgTAP tests in `supabase/tests/` covering every role × table × allowed/denied case.
- `client_info_sections` table (client_id, key description|habits|medical_history, body, updated_by, updated_at) with RLS: family read/write, assigned carer read (write per OQ-09), admin none. Moved here from FAM-09 in plan v0.2 so Family and Carer wiring can run in parallel.

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 0 / 8
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_tenancy.sql`, `supabase/tests/tenancy_rls.test.sql`, `src/lib/supabase/database.types.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-07, OQ-09, OQ-16; then complete dependencies, run START FEATURE F0-06, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
