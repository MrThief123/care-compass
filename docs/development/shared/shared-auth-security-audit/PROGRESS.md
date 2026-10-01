# Progress — F0-21 Auth security audit

Owner: MrThief123
Status: BLOCKED (DECISION FD-07; was IMPLEMENTED)
Jira: —
Branch: `feature/shared-auth-security-audit`
PR target: `main`
Last updated: 2026-10-01

## HUMAN REVIEW (required before READY FOR PR)
1. **Migrations, PRD requirement: shown to the human before they are applied.** Tested on an
   isolated local stack only:
   - `supabase/migrations/20261001121303_admin_aal2_rls.sql`: admin authority needs AAL2; shift
     reassignment guard.
   - `supabase/migrations/20261001123254_overlapping_shifts_caller_check.sql`: caller check on
     `overlapping_shifts`.
2. **AC-04 rate limits: decision needed** (DECISIONS.md FD-07, AUDIT_REPORT.md §4). Also record the
   hosted dashboard's Auth rate-limit values.
3. **HUMAN REVIEW: test expectation changed.** Existing pgTAP and integration admin sessions now
   present AAL2 (TC-01, TC-02), and F0-10 T-04 calls `overlapping_shifts` as the admin (TC-03). No
   assertion was removed. TC-04 (post-merge): ADM-07's own `admin-assign-shift.test.ts` merged to
   `main` after this branch was cut and needed the same AAL2 step-up plus a signOut-scope fix.
4. **Scope check on audit fixes outside the 5 listed items**: `createStaff` guard (FD-05) and
   request-time guard (FD-06).

## Blockers
- AC-04 needs a human decision (FD-07).

## Acceptance criteria status
- 5 / 6 MET in tests (AC-01 and AC-03 depend on the HUMAN REVIEW migrations being approved).
  AC-04 NOT MET.

| AC | Status | Evidence |
|---|---|---|
| AC-01 | MET (pending migration approval) | pgTAP `auth_security_audit.test.sql`; integration T-01 |
| AC-02 | MET | unit `cookie-options.test.ts`; e2e T-02 |
| AC-03 | MET (pending migration approval) | pgTAP; integration T-03/T-04; unit `queries.request-time.test.ts`; e2e T-04 |
| AC-04 | NOT MET | limits measured, gap recorded, decision needed (FD-07) |
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

## Next action
- Human: review both migrations and decide FD-07. Then run `tests/integration/shared-dev-seed-data.test.ts`
  on a seeded stack with the migrations, and set READY FOR PR.

## Ready for PR
- No (HUMAN REVIEW items above). PR not opened.
