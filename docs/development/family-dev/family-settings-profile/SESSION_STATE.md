# Session State — FAM-12 Family — Settings: family info and password reset

Last session date: 2026-09-25
Current branch: `feature/family-settings-profile` (from `origin/family-dev`), claimed and pushed
Worked on: START FEATURE. Gate checked (F0-07 and FAM-UI-06 merged; OQ-35 ANSWERED, PD-054; OQ-08 non-blocking). Branch claimed. Code and schema inspected. No code written.
Tests run: none
Current blocker: needs the human's answer on the `supabase/**` change and a running local database (below).
Important discoveries:
- `profiles` already has `first_name`, `last_name`, `phone`, `email`, `address` (`supabase/migrations/20260922053821_tenancy.sql`), but the only policies on it are SELECT (`profiles_select_self`, `profiles_select_same_org`). **There is no UPDATE policy**, so AC-01 (save) and AC-04 (RLS rejects another profile's row) need a migration.
- A plain `for update using (id = auth.uid())` policy would let a family user change their own `role`, `organisation_id` or `is_active`. The migration must limit what a user can change to the contact columns (column-level `grant update (...)`, or a trigger) and pgTAP-test that.
- `supabase/**` is Lane B's folder (docs/AGENT_REFERENCE.md); CLAUDE.md §4.2 and §10 say stop and ask. `src/server/**` additions for this feature are allowed.
- The Docker daemon was not running (`supabase status` failed), so `supabase test db`, T-03 and T-04 and the e2e cannot run until it is.
- `requestPasswordReset({ email })` (F0-07, `src/server/auth/actions.ts`) takes an email. PD-054 says the link goes to the login email; the screen shows the contact email. Decide which address it uses: the session's login email is the safe one.
- `getFamilyContactDetails` (`src/server/profiles/queries.ts`) has no Supabase branch yet, and the profile Save has no contract function; both are added here.
Exact next action: after the human answers the migration question and Docker is up, write T-01 to T-04 from TEST_PLAN.md first (the pgTAP test for AC-04, component test for AC-02, integration test for AC-03, e2e for AC-01), run them and confirm they fail for the right reason, commit `test(family): …`.
