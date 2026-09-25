# Session State — FAM-13 Family — Change organisation

Last session date: 2026-09-25
Current branch: `feature/family-change-organisation` (from `origin/family-dev`), claimed and pushed
Worked on: START FEATURE. Gate checked (F0-06, F0-10, FAM-UI-06 merged; OQ-06 and OQ-15 ANSWERED; OQ-28 non-blocking). Branch claimed. Code and schema inspected. No code written.
Tests run: none
Current blocker: needs the human's answer on the `supabase/**` change and a running local database (below). Also sequencing with FAM-12 (below).
Important discoveries:
- The PRD Scope needs a new Postgres function `transfer_client_organisation(client_id, new_org_id)` (SECURITY DEFINER, single transaction: family authority check, update `clients.organisation_id`, end active `carer_client_assignments`, cancel shifts starting after now(), audit). That is a new migration under `supabase/**`, which is Lane B's folder (docs/AGENT_REFERENCE.md); CLAUDE.md §4.2 and §10 say stop and ask.
- The picker must list every organisation, but `organisations_select_member` lets a user read only their own. A new policy or a SECURITY DEFINER listing function is needed (same folder question). The picker itself is undesigned (OQ-19); FAM-UI-06 FD-01 currently has Confirm say "not available yet".
- Dependencies exist: F0-10 (shifts table and active-shift function) and F0-08 (audit log) are on `main`. F0-16 seed data is not, so the pgTAP tests must create their own fixtures (Margaret, Helen, Aisha, Priya, two organisations, 3 future shifts, 1 assignment).
- Sequencing: FAM-12 and FAM-13 both change `src/features/family-settings/` and `src/app/(family)/family/[clientId]/settings/`. Building FAM-13 on top of FAM-12 (after it merges, or with FAM-12 merged in) avoids conflicts.
- The Docker daemon was not running, so `supabase test db` (T-01, T-02, T-03, T-06) cannot run until it is.
Exact next action: after the human answers, write the pgTAP tests T-01, T-02, T-03, T-06 and the component tests T-04, T-05 first, run them and confirm they fail for the right reason, commit `test(family): …`.
