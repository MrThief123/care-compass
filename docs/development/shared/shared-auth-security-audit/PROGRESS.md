# Progress — F0-21 Auth security audit

Owner: MrThief123
Status: MERGED TO DEV (merged to `main` in #195, 2026-10-01; AC-04 NOT MET — FD-07 follow-up open)
Jira: —
Branch: `feature/shared-auth-security-audit`
PR target: `main`
Last updated: 2026-10-02

## HUMAN REVIEW — all closed 2026-10-02 (Dhruv561)
1. **Migrations — approved** (DECISIONS.md FD-08). Both were found already applied to the hosted
   project before approval was recorded; who applied them is not recorded.
   - `supabase/migrations/20261001121303_admin_aal2_rls.sql`: admin authority needs AAL2; shift
     reassignment guard.
   - `supabase/migrations/20261001123254_overlapping_shifts_caller_check.sql`: caller check on
     `overlapping_shifts`.
2. **AC-04 rate limits — decided: options (a) + (b) as a follow-up** (DECISIONS.md FD-07). AC-04
   stays NOT MET until the hosted Auth > Rate Limits values are recorded and the MFA/password
   verification Auth Hooks are enabled.
3. **HUMAN REVIEW: test expectation changed.** Existing pgTAP and integration admin sessions now
   present AAL2 (TC-01, TC-02), and F0-10 T-04 calls `overlapping_shifts` as the admin (TC-03). No
   assertion was removed. TC-04 (post-merge): ADM-07's own `admin-assign-shift.test.ts` merged to
   `main` after this branch was cut and needed the same AAL2 step-up plus a signOut-scope fix.
4. **Scope check — confirmed.** `createStaff` guard (FD-05) and request-time guard (FD-06) belong
   in F0-21.

5. **Close-out fixes, asked for by the human (2026-10-02).** FD-09 (open redirect in
   `/auth/confirm`) and FD-10 (`/api/test` hidden in production). Tests first: 10 red for the right
   reason, then green. FD-11 (HSTS header) added the same way: 1 red (no header), then green.
   FD-12 (password show/hide toggle): 4 red (no toggle) plus 2 guards, then green. FD-13 (QR
   centred): 1 red, then green.
6. **Reported, not reproduced (2026-10-02):** the human sometimes can't type into the sign-in fields
   until a refresh. Not reproduced in Chromium on the dev server: cold load, typing with JS held
   back 4 s, sign-up → sign-in link, sign-out → sign-in, Back after sign-in. Skipped at the human's
   request; reopen with exact steps if it recurs.

## Blockers
- None for the merged work. AC-04 waits on the FD-07 follow-up (hosted-project settings).

## Acceptance criteria status
- 5 / 6 MET. AC-04 NOT MET (FD-07 follow-up).

| AC | Status | Evidence |
|---|---|---|
| AC-01 | MET | pgTAP `auth_security_audit.test.sql`; integration T-01 |
| AC-02 | MET | unit `cookie-options.test.ts`; e2e T-02 |
| AC-03 | MET | pgTAP; integration T-03/T-04; unit `queries.request-time.test.ts`; e2e T-04 |
| AC-04 | NOT MET | limits measured, gap recorded; closing it is the FD-07 follow-up (a) + (b) |
| AC-05 | MET | unit `auth-forms-post.test.tsx`; e2e T-06 |
| AC-06 | MET | `AUDIT_REPORT.md` |

## Tests
- Written: 6 / 7 test IDs (T-05 has no automated test: no throttle to test until FD-07 is decided).
- Red first, confirmed for the right reason:
  - pgTAP 23 AAL1 failures, then shift reassignment and `overlapping_shifts`;
  - integration T-01 red on an unmigrated stack;
  - `createStaff` red (accounts created);
  - cookie, form and request-time unit tests red;
  - e2e T-04 red (static mock admin pages).
- Passing: all F0-21 tests. Suites: pgTAP 658/658, unit 2334/2334, integration 166/170 (4 = F0-16
  seed tests, no seed on the isolated stack), e2e auth specs 22/22.
- **Post-merge re-verification (this session), after merging `origin/main` (ADM-07 #193, INT-03
  #194 had landed after this branch was cut):** found and fixed TC-04 (above), then re-ran
  everything on the merged branch against the isolated stack: pgTAP 658/658; unit (`DATA_SOURCE=mock
  vitest run src`) 2349/2349; integration (`--maxWorkers=2`) 172/176 (same 4 unrelated F0-16
  failures); `tsc --noEmit` clean; `lint` 0 errors (2 pre-existing warnings); `prettier --check`
  clean; e2e `admin-assign-shift.spec.ts` (ADM-07) and `organisation-transfer.spec.ts` (INT-02) both
  green against a production build with the AAL2 migrations applied — both already do real TOTP
  through the browser, so they reach genuine AAL2 unaffected by the RLS change.
- Flakiness (10 consecutive runs each):
  - pgTAP 10/10, unit 10/10, e2e 50/50 (`--repeat-each=10`).
  - Integration: the first 10 runs were 7/10 clean. I couldn't reproduce failures afterwards
    (27 clean runs), and GoTrue logged no errors during them. The likely cause was the before/after
    snapshot comparing rows in query order (ties on client id). Fixed to compare as a set
    (`220eeb6`); then 10/10 clean.

- **Close-out PR (2026-10-02):** unit `DATA_SOURCE=mock vitest run src` 2366/2366 (placeholder
  local env vars; this worktree has no `.env.local`); `tsc --noEmit` clean; `eslint` 0 errors
  (2 pre-existing warnings); `prettier --check` clean. Production build against the local stack:
  `/api/test` 404; `/auth/confirm` with real recovery tokens redirects `/reset-password`,
  `https://evil.example`, `//evil.example/x`, `/\evil.example` and `javascript:alert(1)` all to
  `/reset-password`.
- **FD-11 (HSTS):** unit 2367/2367; `tsc --noEmit` clean; `eslint` 0 errors (2 pre-existing
  warnings); `prettier --check` clean. Production build: `/sign-in` returns
  `Strict-Transport-Security: max-age=63072000`.
- **FD-12 (password toggle):** unit 2373/2373; `tsc` clean; `eslint` 0 errors; checked in Chromium
  on the dev server: hidden by default, eye reveals, eye-off hides.
- **FD-13 (QR centred):** unit 2374/2374; `tsc` clean; `eslint` 0 errors; checked in Chromium on
  `/mfa/enroll` as the local seed admin: equal space either side of the QR.
- **FD-13 follow-up (wider enrolment card):** 1 red, then green; unit 2375/2375; `tsc` clean;
  `eslint` 0 errors. Chromium: enrolment card 448px with the key on one line; sign-in card still
  384px; no horizontal scroll at 768px or 390px.
- **FD-13 follow-up (centred text):** 1 red, then green; unit 2376/2376; `tsc` clean; `eslint` 0
  errors. Chromium at 1280px and 390px: heading, intro and key centred, code field left-aligned.

## Next action
- FD-07 follow-up (hosted project, needs the human): record the dashboard's Auth > Rate Limits
  values in AUDIT_REPORT.md §4, enable the MFA Verification Attempt and Password Verification
  Attempt Auth Hooks, then re-probe and set AC-04 MET.
- Run `tests/integration/shared-dev-seed-data.test.ts` on a seeded stack with the migrations applied
  (the seeded admin Priya now needs TOTP to see admin data).

## Ready for PR
- Merged in #195. Close-out PR: decision docs plus the FD-09 to FD-13 fixes. Not opened yet.
