# Audit Report — F0-21 Auth security audit

Date: 2026-10-01 · Branch: `feature/shared-auth-security-audit` · Auditor: MrThief123 (with Claude Code)

> **HUMAN REVIEW before merge.** Two migrations change who may read and write data:
> `20261001121303_admin_aal2_rls.sql` and `20261001123254_overlapping_shifts_caller_check.sql`. The
> PRD requires the AAL2 migration to be shown to the human before it is applied. Both were tested
> only on an isolated local stack (below). Neither has been applied to any shared or hosted database.

## How it was tested

- **Isolated local Supabase stack** (`project_id = cc-f021-audit`, API on 54421). It is not the
  shared `care-compass` stack, because other sessions use that one and an AAL2 migration there
  would break their admin tests.
- **GoTrue v2.197.0 and storage v1.77.5**, pinned to the hosted project's versions
  (`supabase/.temp/*-version`, no project link copied).
- **Seed disabled.** CLI 2.6.8 cannot run `seed.sql`'s temp table. All F0-21 tests use fresh users.
- **Attacks go through the real data API.** PostgREST, Storage and Auth are called with real user
  JWTs (`tests/integration/shared-auth-security-audit.test.ts`). The database side is checked by
  pgTAP with forged claims (`supabase/tests/auth_security_audit.test.sql`), and the browser side by
  Playwright against a production build (`tests/e2e/auth-hardening.spec.ts`).

## Summary

| # | Item | Finding | Status |
|---|---|---|---|
| 1 | RLS: admin data needs AAL2 | **Gap, fixed** (HUMAN REVIEW): no policy or helper read `aal`. A password-only admin read and wrote everything through the API | Fixed. AC-01 MET pending human sign-off of migration |
| 2 | Session cookie flags | **Gap, fixed**: not HttpOnly, no Secure | Fixed. AC-02 MET |
| 3 | IDOR / cross-tenant | Table RLS already held on every client-scoped table. **Four gaps found and fixed**: shift reassignment, `overlapping_shifts`, `createStaff`, prerendered guarded pages | Fixed. AC-03 MET pending human sign-off of migrations |
| 4 | Rate limits | **Gap, not closed**: local GoTrue throttles nothing. Hosted values unconfirmed. An app-level throttle cannot cover the direct GoTrue endpoint | **AC-04 NOT MET**, needs human decision |
| 5 | Credentials in URL | **Gap, fixed**: all six auth forms submitted as GET before hydration | Fixed. AC-05 MET |
| 6 | This report | — | AC-06 MET |

## 1. Admin data requires an AAL2 session (AC-01)

**Finding.** F0-20 FD-04 was confirmed. Every admin grant flows through three SECURITY DEFINER
helpers, and none of them read `aal`:
- `is_admin_of_client` (every admin table policy, Storage, and the budget/event functions)
- `admin_current_org_id` (the `admin_*` functions)
- `current_organisation_id` (same-organisation profiles and the organisation row)

So an admin who had signed in with a password but not finished TOTP could, through the API:
- read 14 kinds of client data;
- insert and update shifts, client info and documents;
- upload to Storage;
- add or remove funds;
- edit staff and the organisation.

Red evidence: pgTAP tests 1–23 failed. On the shared stack (no migration), integration T-01 saw
`['clients', …13 more]` instead of `[]`.

**Fix.** Migration `20261001121303_admin_aal2_rls.sql`, HUMAN REVIEW.
- Adds `session_is_aal2()` = `coalesce(auth.jwt() ->> 'aal', '') = 'aal2'` (FD-01).
- The three helpers keep their signatures and gain the check:
  - `is_admin_of_client` requires AAL2;
  - `admin_current_org_id` raises 42501 "complete two-factor sign-in first";
  - `current_organisation_id` returns null for an admin below AAL2 (carers unaffected).
- Nothing is dropped or renamed.
- An admin's own profile stays readable at AAL1 (`profiles_select_self`), so the route guard still
  sends them to `/mfa/verify`. Family and carer are never gated (CHG-040).

**Evidence.**
- pgTAP `auth_security_audit.test.sql` (118 tests): AAL1, missing claim and wrong-case claim are
  all refused, AAL2 works, and family and carer at AAL1 are unchanged.
- Integration T-01: real password-only session against real TOTP (`tests/helpers/aal2.ts`).

## 2. Session cookies (AC-02)

**Finding.** `@supabase/ssr` 0.12.7 defaults to `httpOnly: false`, `sameSite: "lax"` and no `secure`.

**Fix.** `src/lib/supabase/cookie-options.ts`, used by `server.ts` and `middleware.ts`. The flags are:
- **HttpOnly: on.** Feasible because no Supabase client runs in the browser; `browser.ts` has no
  callers. Do not start using it for auth while this is set.
- **SameSite=Lax.** Strict would drop the session when someone follows an emailed link.
- **Secure: on in production**, except on a loopback host so a local http production build
  (e2e, `npm start`) still signs in. An unknown host gets Secure.

**Evidence.** Unit `src/lib/supabase/cookie-options.test.ts` (6 tests). E2E T-02 checks the browser's
actual `sb-*` cookies: HttpOnly is true, SameSite is Lax, and `document.cookie` holds no token.

## 3. IDOR / cross-tenant (AC-03)

**Finding: table RLS holds.** Three outsiders were tested against client A on every client-scoped
table, in a full read/insert/update/delete matrix plus Storage list/sign/upload/remove and 14 RPCs:
another organisation's admin at AAL2, another family, and another organisation's carer on shift.
Nothing was returned or changed; a service-role before/after snapshot was identical. Tables covered:
- clients, client_family_members, client_info_sections, shifts, care_events,
  care_event_overrides, care_event_completions;
- budget_buckets, budget_fund_entries, budget_costs, documents, carer_notifications;
- organisations, profiles, audit_log.

**Gaps found and fixed (each with a failing test first).**
1. **Shift reassignment.** The F0-10 trigger checked the carer's organisation on INSERT only. An
   admin could UPDATE a shift's `carer_id` to another organisation's carer, who was then notified
   about, and could read, the client. The admin could also relabel `organisation_id`.
   - Fix: an update trigger in the AAL2 migration applies the same rule and re-derives the
     organisation.
   - Evidence: pgTAP "reassign a shift to another organisation's carer".
2. **`overlapping_shifts`** (reported by ADM-07). It is SECURITY DEFINER, had no caller check, and
   PUBLIC/anon could execute it. Anyone could read any carer's shifts and client ids.
   - Fix: `20261001123254_overlapping_shifts_caller_check.sql` (HUMAN REVIEW). Only an AAL2 admin of
     the carer's organisation may call it, it returns only that organisation's shifts, and EXECUTE
     is revoked from PUBLIC/anon.
   - Evidence: 7 pgTAP tests.
3. **`createStaff` Server Action** (`src/server/admin/staff-actions.ts`). It checked only "signed
   in" before the service-role `inviteUserByEmail`. Any family member, carer or AAL1 admin could
   create an auth account for any email: invite spam, and an orphan account that blocks that email's
   later sign-up.
   - Fix: require an active admin profile and an AAL2 session first.
   - Evidence: integration T-03 (3 refusals, plus 1 AAL2 success).
4. **Guarded pages prerendered at build.** With no `DATA_SOURCE` at build time (the project
   `dockerfile` sets only the `NEXT_PUBLIC_` variables), the build fell back to mock mode and
   prerendered these pages as static mock HTML, served to anyone with no guard: `/admin/home`,
   `/admin/clients`, `/admin/staff`, `/admin/settings` and `/carer/settings`. No real data was
   exposed (synthetic fixtures; RLS still governs real reads).
   - Fix: `getCurrentUser` calls `connection()` first, so every guarded page renders per request.
   - Evidence: unit `src/server/auth/queries.request-time.test.ts`; the build route table now marks
     all of them `ƒ`; e2e T-04.

**Routes.**
- `/family/[clientId]/*` (6 pages): another family is redirected to its own client.
- `/admin/*` (5 pages): family and carers are redirected home.
- Evidence: e2e T-04 (2 tests) and integration T-04 (3 tests).

**Recorded, not fixed (HUMAN REVIEW).**
- `admin_discard_staff_invite(p_user_id)` lets any AAL2 admin delete any auth user that has no
  profile, by id. The window is narrow (an invite or sign-up mid-flight) and the user id must be
  known.
- `/family/<other client>/settings` still runs its own data fetch alongside the layout's redirect.
  RLS refuses it (server log "could not load settings data"); nothing leaks.
- `/api/test` is live in production and returns the caller's own organisation (RLS-bounded).

## 4. Rate limits (AC-04): NOT MET, decided (a) + (b) as a follow-up (FD-07)

**Measured on GoTrue v2.197.0 (hosted version), local config.** The probe method is described in
this folder's SESSION_STATE.md (the scripts were not committed because they embed local keys).
Local results:

| Attempt | Result |
|---|---|
| Wrong password (`/token`) | 300 in a row, **never 429** |
| Wrong TOTP (`/factors/:id/verify`) | 60 in a row, **never 429** (422 each) |
| Password reset (`/recover`) | `GOTRUE_RATE_LIMIT_EMAIL_SENT=360000`, `SMTP_MAX_FREQUENCY=1s`. Effectively unlimited locally |

- `supabase/config.toml` has no `[auth.rate_limit]` section.
- GoTrue's IP limiter only runs when a rate-limit header is configured, which the hosted platform
  does and local does not.

**Hosted values: not confirmed.** I could not read the dashboard (not allowed) or the docs page (fetch
limit hit). The human should record the dashboard's Auth > Rate Limits values for sign-in/sign-up,
token verification, MFA challenge/verify and email sending.

**Why no app-level throttle was added.**
- GoTrue is reachable directly with the public anon key. A throttle in our Server Actions would stop
  only the UI path, and an attacker skips the UI. With a stolen password (AAL1), TOTP can be
  brute-forced directly at `/factors/:id/verify`.
- Our server calls GoTrue on behalf of every user, so hosted per-IP limits see one IP for everyone.
  One attacker could exhaust the shared sign-in budget (lock-out DoS), while per-account brute force
  is not limited per account at all.

**Options for the human.**
- (a) Confirm the hosted limits and accept per-IP limiting.
- (b) Enable Supabase Auth Hooks (MFA Verification Attempt / Password Verification Attempt) to lock
  out after N failures per user. This is a hosted-project change and may depend on plan.
- (c) Add a database-backed per-account throttle for the UI path only, as defence in depth.
- (d) Forward the client IP to GoTrue if the hosted platform honours it.

**Recommendation:** (a) + (b). **Decided** by the human 2026-10-02 (DECISIONS.md FD-07).

## 5. Credentials never in a URL (AC-05)

**Finding.** `sign-in`, `sign-up`, `forgot-password`, `reset-password`, `mfa/verify` and
`mfa/enroll` forms had no `method`. A submit before hydration was a GET with every named field in
the query string.

**Fix.** `method="post"` on all six forms; nothing else changed. Before hydration, the POST returns
200 with the page re-rendered, so the person just retries. Credentials are not in the server log.

**Evidence.**
- Unit `src/app/(auth)/auth-forms-post.test.tsx` (6 tests).
- E2E T-06 with JavaScript disabled, for sign-in and forgot-password: the request method is POST and
  the URL has no query string.

## Results (all on the isolated stack)

| Suite | Result |
|---|---|
| `supabase test db` (20 files) | 658/658 pass |
| F0-21 pgTAP, 10× | 10/10 clean |
| Unit `vitest run src` | 2334/2334 pass |
| F0-21 unit tests, 10× | 10/10 clean |
| Integration `vitest run tests/integration --maxWorkers=2` | 166/170. The 4 failures are F0-16 seed-data tests: no seed on this stack, see Remaining |
| F0-21 integration, 10× | 10/10 clean after the snapshot-ordering fix (see PROGRESS) |
| E2E `auth`, `sign-up`, `root-route`, `admin-mfa`, `auth-hardening` | 22/22 pass |
| E2E `auth-hardening`, `--repeat-each=10` | 50/50 pass |
| `npm run lint` | 0 errors (2 pre-existing warnings in `src/app/dev-preview/page.tsx`) |
| `npx tsc --noEmit` | clean |
| `npx prettier --check .` | clean |

## Remaining

- ~~**Human:** review and approve both migrations~~ — approved 2026-10-02; both were already applied
  to hosted (DECISIONS.md FD-08).
- **Human (FD-07 follow-up):** record the hosted rate-limit values and enable the MFA/password
  verification Auth Hooks; then re-probe and set AC-04 MET.
- **Once a seeded stack is available:** run `tests/integration/shared-dev-seed-data.test.ts`
  (F0-16) on a stack seeded with the migrations applied. The seeded admin Priya will now need TOTP
  for admin data.
- **Deploy note:** after the AAL2 migration, any admin tooling that uses a password-only session
  against the data API (none in `src/`) will see nothing.
