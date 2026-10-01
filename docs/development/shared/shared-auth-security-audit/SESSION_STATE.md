# Session State — F0-21 Auth security audit

Last session date: 2026-10-01
Current branch: `feature/shared-auth-security-audit` (claimed, pushed)
Worked on: claim; inspection of every migration, auth actions, guards, cookie setup, auth forms.

## Test environment
- An **isolated** local Supabase stack is used, not the shared `care-compass` one (other sessions use it; an
  AAL2 migration there would break their admin tests). Built from a copy of `supabase/` with
  `project_id = "cc-f021-audit"`, ports +100 (API 54421, DB 54422, Inbucket 54424), studio/realtime/edge/analytics
  off, seed off (CLI 2.6.8 cannot run seed.sql's temp table; tests use fresh users anyway), GoTrue pinned to
  v2.197.0 / storage v1.77.5 to match the hosted project (`supabase/.temp/*-version`). Local demo keys only.

## Findings so far (to be confirmed by failing tests)
1. AAL: no policy or helper checks `aal`. Admin authority flows through three SECURITY DEFINER helpers:
   `is_admin_of_client` (every admin table policy, storage, budget/event RPCs), `admin_current_org_id`
   (admin_* RPCs), `current_organisation_id` (profiles_select_same_org, organisations_select_member).
   Plan: require `auth.jwt() ->> 'aal' = 'aal2'` in those three for admins (proposed default claim).
2. Cookies: `@supabase/ssr` 0.12.7 defaults `httpOnly: false`, `sameSite: lax`, no `secure`. The browser
   client (`src/lib/supabase/browser.ts`) is unused, so HttpOnly is feasible.
3. Forms: all six auth forms (`sign-in`, `sign-up`, `forgot-password`, `reset-password`, `mfa/enroll`,
   `mfa/verify`) have no `method`, so a pre-hydration submit is a GET with fields in the URL.
4. `createStaff` (src/server/admin/staff-actions.ts) checks only "signed in", not "admin", before the
   service-role `inviteUserByEmail`: any signed-in user can send invites to arbitrary emails and leave an
   orphan auth user (the discard RPC refuses non-admins). Out of the 5 listed items, needs HUMAN REVIEW.
5. `admin_discard_staff_invite(p_user_id)` deletes any profile-less auth user by id for any admin of any org
   (e.g. someone mid-sign-up). Record only.
6. `shifts` update has no trigger re-validating `carer_id`/`organisation_id` (insert-only trigger) — check.
7. Rate limits: GoTrue calls come from the Next server, so GoTrue's per-IP limits see one IP for all users.

Exact next action: write failing tests (pgTAP + integration) for each gap.
