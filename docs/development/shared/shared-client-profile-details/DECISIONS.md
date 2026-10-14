# Decisions — F0-28 Client personal details

## Open decisions affecting this feature
None.

## Feature decisions log

### FD-01 — Columns on `clients`, written through a family-only function
- Date: 2026-10-14
- Decision: the eight fields live on `clients` (two already exist), so the existing select policies give family, assigned carer and org admin read access with no new policy. Families have no UPDATE policy on `clients`; `save_client_details` (SECURITY DEFINER, `is_family_of`) writes only these columns, as `transfer_client_organisation` does.
- Alternatives: a 1:1 `client_profiles` table (rejected: a second place for client identity); an UPDATE policy for families (rejected: RLS cannot limit columns, so it would let a family rewrite `organisation_id`).

### FD-02 — Sign-up saves details after `register_account`
- Date: 2026-10-14
- Decision: `signUp` calls `save_client_details` with the new client id after `register_account` succeeds, instead of widening `register_account`'s signature (that would mean dropping and recreating a function F0-17 and its tests own). If that second call fails the account stays (the details are optional) and the person can add them in Settings (AC-05). Nothing is logged but the feature tag and error class.

### FD-03 — Age is computed, never stored
- Date: 2026-10-14
- Decision: store `date_of_birth`; show age with the existing `ageFromDob` (Australia/Melbourne).

### FD-04 — Cross-lane edits kept in this PR
- Date: 2026-10-14
- Decision: `src/features/family-settings/`, `src/features/family-info/`, `src/features/carer-patients/` and `src/app/(auth)/sign-up/` are edited here so one PR ships the feature (precedent: CHG-058, CHG-061).

### FD-05 — 2FA parked
- Date: 2026-10-14
- Decision: the human's request also asked for optional 2FA for family and carers; they parked it ("lets worry about the optional 2fa later"). It would reverse CHG-040 and needs its own CHG.

### FD-06 — Own tests corrected before implementation finished
- Date: 2026-10-14
- `supabase/tests/client_details.test.sql` T-04, two assertions: before `'true|…'`, after `'t|…'`. Postgres renders a boolean as `t` in `concat_ws`; a genuine test bug, no behaviour change.
- T-04 and T-08 first seeded `carer_client_assignments`, which CAR-03 dropped (carer access is now an unfinished shift, `is_assigned_carer`). Both now give Aisha an upcoming shift; fixed before any implementation, no behaviour change.

### FD-07 — Generated types patched by hand
- Date: 2026-10-14
- The local Supabase CLI is newer than the one that last generated `database.types.ts`, and its output rewrites unrelated parts of the file (`ComputedFields`, formatting). Only the six `clients` columns and `save_client_details` were added, exactly as the CLI generates them. Like `set_event_cost`, the generated Args are non-null strings although the function takes null to clear; the action casts.
