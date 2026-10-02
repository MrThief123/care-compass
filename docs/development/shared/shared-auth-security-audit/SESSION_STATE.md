# Session State — F0-21 Auth security audit

Last session date: 2026-10-02
Current branch: `feature/shared-auth-security-audit` (pushed)
Worked on: the whole audit. Tests first for every gap, fixes, AUDIT_REPORT.md. See PROGRESS.md for status.

## Close-out (2026-10-02)
- #195 merged 2026-10-01. Decision commit `42b52c1` (left on the feature branch) brought to `main` via
  `docs/f0-21-closeout`, with the confirmations re-recorded as the human's (Dhruv561).
- FD-09 (open redirect), FD-10 (`/api/test`) FD-11 (HSTS) and FD-12 (password toggle) and FD-13 (QR centred) done at the human's
  request. Sign-in "can't type until refresh" reported but not reproduced (PROGRESS item 6).
- FD-05/06 confirmed in scope; FD-07 decided (a) + (b) follow-up; migrations approved (FD-08).
- Hosted check method: see DECISIONS.md FD-08. `.env.local`'s anon key has a stray leading `e`
  (local file, not committed); hosted rejects it as-is.

## Test environment (reproduce)
- **Isolated local Supabase stack**, not the shared `care-compass` one (an AAL2 migration there
  would break other sessions' admin tests). Built from a copy of `supabase/` with:
  - `project_id = "cc-f021-audit"`, ports +100 (API 54421, DB 54422, Inbucket 54424, SMTP 54425,
    POP3 54426);
  - studio, realtime, edge runtime and analytics off;
  - seed off (CLI 2.6.8 cannot run `seed.sql`'s temp table);
  - `supabase/.temp/gotrue-version` and `storage-version` copied from the main checkout, so GoTrue
    is v2.197.0 like the hosted project. No project-ref copied.
- Env for vitest and Playwright: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421` plus the standard
  local demo anon/service keys. E2E: `npx next build` with those, then
  `E2E_PORT=3121 E2E_DATA_SOURCE=supabase npx playwright test …`.
- The worktree needs a real `npm ci`. Turbopack rejects a symlinked `node_modules`.

## Rate-limit probe (AC-04 evidence)
- Wrong password: a loop of POSTs to `/auth/v1/token?grant_type=password` (anon key, an
  `x-forwarded-for` per run) for an unknown email: 300× HTTP 400, no 429.
- Password reset: `/auth/v1/recover` 5×, all 200.
- Wrong TOTP: a fresh user signed in with supabase-js, enrolled TOTP, then 60× challenge plus verify
  with `000000`: all `422 mfa_verification_failed`, no 429.
- GoTrue env: `GOTRUE_RATE_LIMIT_EMAIL_SENT=360000`, `GOTRUE_SMTP_MAX_FREQUENCY=1s`, no rate-limit
  header configured.

## Important discoveries
- **Admin authority:** every admin grant flows through three helpers (FD-01).
- **IDOR gaps found:**
  - shift reassignment (FD-03);
  - `overlapping_shifts` (FD-04, from ADM-07);
  - `createStaff` service-role invite (FD-05);
  - guarded pages prerendered as static mock when built without `DATA_SOURCE` (FD-06).
- **Shared stack, one-off red run:** T-01 was run once against the shared stack (54321, unmigrated)
  for red evidence. Its users were deleted afterwards; its org/client/ledger rows remain, as with
  other integration tests.

## Exact next action
- Human: review the two migrations, decide FD-07 (AC-04), record the hosted rate limits. Then run
  F0-16 seed tests on a seeded stack with the migrations, and move to READY FOR PR.
