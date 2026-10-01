# Decisions — F0-21 Auth security audit

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| — | Which claim RLS reads for the AAL check | no | `auth.jwt() ->> 'aal'` (used, FD-01) |
| FD-07 | AC-04 rate limiting: how to close the gap (hosted Auth Hooks, app throttle, or accept per-IP) | **yes, for AC-04 only** | (a) confirm hosted limits + (b) Auth Hooks. Human to decide |

## HUMAN REVIEW — migrations (PRD: "shown to the human before it is applied")
- `supabase/migrations/20261001121303_admin_aal2_rls.sql`: admin authority requires AAL2 (FD-01) and
  the shift reassignment guard (FD-03).
- `supabase/migrations/20261001123254_overlapping_shifts_caller_check.sql`: caller check on
  `overlapping_shifts` (FD-04).

Both were tested on an isolated local stack only. Not applied to the shared local stack, and not to
the hosted project. They change behaviour for every feature that reads admin data. No table or column
is changed, renamed or dropped.

## Feature decisions log

### FD-01 — AAL claim and where the check lives
- Date: 2026-10-01
- Decision:
  - Use the PRD's non-blocking default, `auth.jwt() ->> 'aal'`, through `session_is_aal2()`. Only
    the exact value `aal2` counts.
  - Add the check to the three helpers every admin grant flows through (`is_admin_of_client`,
    `admin_current_org_id`, `current_organisation_id`), rather than to ~40 policies and functions.
- Alternatives:
  - RESTRICTIVE policies per table. Rejected: SECURITY DEFINER functions bypass RLS, so the admin
    RPCs would stay open, and a restrictive policy on `profiles` would hide the admin's own row from
    the route guard.
- Consequences:
  - Any future admin policy must use these helpers to inherit the check.
  - An admin's own profile stays readable at AAL1.
- Human confirmation required: **yes, before the migration is applied anywhere shared**.

### FD-02 — Session cookie flags
- Decision: HttpOnly, SameSite=Lax, and Secure in production except on a loopback host.
- Reason:
  - No browser-side Supabase client is used (`browser.ts` has no callers).
  - Lax keeps emailed links working.
  - The loopback exception lets the local production build (e2e) sign in over http.
- Consequence: `src/lib/supabase/browser.ts` cannot read the session. Do not use it for auth without
  revisiting this.

### FD-03 — Shift reassignment guard (AC-03 gap)
- Finding: `shifts_before_insert` (F0-10) only runs on INSERT, so an UPDATE could move a shift to
  another organisation's carer or relabel its organisation.
- Decision:
  - Run the same rule on UPDATE of `carer_id`, `client_id` or `organisation_id` (42501), and
    re-derive the organisation.
  - `transfer_client_organisation` (cancelled_at/ends_at only) does not fire it.
  - Same-organisation reassignment still works.

### FD-04 — `overlapping_shifts` caller check (AC-03 gap, reported by ADM-07)
- Decision:
  - Only an active admin of the carer's organisation at AAL2 may call it, through
    `admin_current_org_id()`. It is documented as an admin warning (D30), so even the carer is
    refused.
  - It returns only that organisation's shifts.
  - EXECUTE is revoked from PUBLIC/anon.
- Test change caused: see TC-03.

### FD-05 — `createStaff` checks the caller before the service-role invite (AC-03 gap)
- Finding: the Server Action checked only "signed in" before `inviteUserByEmail` (service role).
- Decision: require an active `admin` profile and `currentLevel === 'aal2'` (read from the token
  `getUser()` just verified), and return `NOT_ALLOWED` otherwise.
- Scope note: `src/server/admin/**` is ADM-02's contract file. This is a guard in front of a
  privileged call, found by this audit. **HUMAN REVIEW: confirm it belongs here and not in a
  separate fix PR.**
- Human confirmation: Dhruv561, 2026-10-02 — belongs in F0-21 (merged in #195). Splitting it out
  would have shipped `main` with a known privilege-escalation hole in between.

### FD-06 — Guarded pages never prerendered (AC-03 gap)
- Finding: building without `DATA_SOURCE` (the project `dockerfile` does) prerendered `/admin/home`,
  `/admin/clients`, `/admin/staff`, `/admin/settings` and `/carer/settings` as static mock pages,
  served unguarded.
- Decision:
  - `getCurrentUser` awaits `connection()` (Next 16 API, `node_modules/next/dist/docs/.../connection.md`)
    before anything else.
  - Outside Next entirely (unit tests rendering a layout), the "outside a request scope" error is
    ignored. Every other error is rethrown.
- Alternative: `export const dynamic = "force-dynamic"` in each dashboard layout. Rejected because it
  edits Lane A/C/F folders and is easy to forget on a new layout.
- Related recommendation (not done): set `DATA_SOURCE=supabase` as a build ARG in the dockerfile too.
- Human confirmation: Dhruv561, 2026-10-02 — belongs in F0-21 (merged in #195), same reasoning as FD-05.

### FD-07 — AC-04 rate limits: no app throttle added
- Finding: local GoTrue throttles nothing (300 wrong passwords, 60 wrong TOTP codes). Hosted values
  are not confirmed.
- Reasons for not adding an app throttle:
  - GoTrue is callable directly with the public anon key, so an app throttle covers only the UI path.
  - Hosted per-IP limits see our server's single IP for all users.
- Decision: no app-level throttle without the human; the options are in AUDIT_REPORT.md §4.
- **Blocks AC-04.**
- Human decision: Dhruv561, 2026-10-02 — options (a) + (b) (AUDIT_REPORT.md §4 recommendation), as a
  follow-up: record the hosted dashboard's Auth > Rate Limits values, and enable the MFA Verification
  Attempt and Password Verification Attempt Auth Hooks to lock out per account. No app-level
  throttle. AC-04 stays NOT MET until both are done; F0-21 shipped without it (#195).

### FD-08 — Migrations approved; already applied to hosted
- Both migrations were found already applied to the hosted project on 2026-10-02, before the PRD's
  "shown to the human before they are applied" step was signed off. Who applied them is not
  recorded. Read-only checks:
  - `20261001121303_admin_aal2_rls.sql`: the hosted PostgREST OpenAPI schema (service key) lists
    `/rpc/session_is_aal2`, a function only this migration creates.
  - `20261001123254_overlapping_shifts_caller_check.sql`: `rpc/overlapping_shifts` called with the
    anon key and a random carer id returns `42501 permission denied for function
    overlapping_shifts` (this migration's `revoke … from anon`); before it, anon got `200 []`.
- Human approval: Dhruv561, 2026-10-02 — both migrations approved.

## Test changes (CLAUDE.md §5) — HUMAN REVIEW: test expectation changed
No assertion was removed or loosened. The simulated session changed because the requirement changed
(admin authority now needs AAL2).

| ID | Test | Before | After | Reason |
|---|---|---|---|---|
| TC-01 | All 19 existing `supabase/tests/*.sql` login helpers | claims `{sub, role}` | claims `{sub, role, aal: 'aal2'}` | They simulate a fully signed-in user. For admins that now means TOTP done. Non-admin behaviour does not depend on `aal`. |
| TC-02 | `signIn` in 7 integration files (`admin-clients`, `admin-home`, `admin-manage-selection`, `admin-settings`, `admin-staff`, `family-budget-overview`, `family-home-budget-strip`) | password only | password, then `stepUpIfAdmin` (real TOTP, `tests/helpers/aal2.ts`) | Same as TC-01, for real sessions. Only admins are stepped up. |
| TC-03 | `supabase/tests/shifts.test.sql` F0-10 T-04 | called `overlapping_shifts` with the carer's claims still set | called as the organisation's admin | The function is now admin-only (FD-04). The expected rows are unchanged. |
| TC-04 | `tests/integration/admin-assign-shift.test.ts` (ADM-07, merged to `main` in #193 after this branch was cut) | `signIn` only called `signInWithPassword`; AC-02 called `overlapping_shifts` via the service-role client and then called `priyaClient.auth.signOut()` with the default (global) scope | `signIn` now also calls `stepUpIfAdmin` (TC-02's helper); the RPC is called via a separately signed-in, stepped-up Priya client instead of the service role (which has no acting user for `admin_current_org_id()` to resolve); that client signs out with `{ scope: "local" }` so it doesn't revoke the shared `session` cookie client's (same user) tokens | Found when merging `origin/main` into this branch post-review: ADM-07 merged after this branch was cut, so its tests were never run against this branch's migrations until now. Without the fix, 2 of 6 tests failed for exactly the AC-01/AC-03 reasons TC-01–03 already describe, plus a genuinely new global-signout footgun the fix also avoids. No assertion changed; re-verified 6/6 passing, plus the full existing suites (658 pgTAP, 2349 unit, 172/176 integration — 4 known unrelated F0-16 seed failures, no seed loaded on this stack) and ADM-07's/INT-02's e2e specs, all still green on the merged branch. |

## Other findings and notes
- F0-20's `PROGRESS.md` on `main` still says `READY FOR PR` although PR #177 merged it — **already fixed**: `fix/plan-status-done-matching` (pushed, pending merge) corrects this along with several other stale statuses (FAM-01, ADM-06, FAM-09, CAR-06, F0-22, ADM-07, INT-03) and a `plan-status.mjs` bug that caused them.
- The `admin_discard_staff_invite`, `/family/<id>/settings` parallel fetch and `/api/test` notes are
  in AUDIT_REPORT.md §3.

## Proposed scope addition (needs a human-confirmed CHG before it enters the PRD)
- Missing config is found only when a page first needs data: there is no boot-time env validation
  and no health endpoint. Found in F0-20 manual testing on 2026-10-01 (server started without
  `DATA_SOURCE`: sign-in and 2FA worked, then `/admin/home` showed "This page couldn't load").
  Proposal: validate required env vars at server start and add a health endpoint that checks config
  and database, used by the host's readiness check, plus a required-env list in the deploy
  checklist. FD-06 adds a reason: a build without `DATA_SOURCE` used to prerender guarded pages.
