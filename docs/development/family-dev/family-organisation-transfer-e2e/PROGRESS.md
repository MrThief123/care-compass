# Progress — INT-02 End-to-end: organisation transfer journey

Status: READY FOR PR
Owner: MrThief123
Lane: I — Integration
Sprint: SPRINT · planned D12
Branch: `feature/family-organisation-transfer-e2e`
PR target: `main` (CHG-036; `family-dev` is retired)
Last updated: 2026-10-01

## Blockers
- None — OQ-06, OQ-15 ANSWERED

## Dependencies status
- FAM-13 — MERGED TO DEV
- ADM-04 — MERGED TO DEV
- CAR-03 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- None — all 3 ACs covered by one Playwright journey, run green 3 times in a row against a real
  local Supabase stack.

## Acceptance criteria status
- 3 / 3 MET

## Tests
- Written: 3 / 3 (T-01/T-02/T-03, all exercised in one test — the journey is one continuous
  transfer, so splitting them into separate tests would mean repeating the whole seed+transfer for
  each)
- Passing: 3 / 3, run 3 times in a row (`npx playwright test tests/e2e/organisation-transfer.spec.ts`,
  local stack, `E2E_DATA_SOURCE=supabase`, `E2E_PORT=3101`) — no flakes
- Failing: none

## Files changed
- New: `tests/e2e/organisation-transfer.spec.ts`

## Decisions
- See DECISIONS.md FD-01 (port conflict with a running dev server) and FD-02 (admin MFA
  pre-enrollment needed for the test's two admin accounts)

## Problems encountered
- **A stale `npm run dev` on port 3000 (someone else's session, not this test's) caused
  `reuseExistingServer: true` to silently attach to it instead of spinning up a fresh build.**
  That dev server, pointed at the hosted Supabase project, produced a bizarre symptom: clicking
  "Sign in" fell back to a native GET form submission (the URL grew `?email=&password=` query
  params) rather than running the client handler, causing every `waitForURL` to hang forever
  with no error. Did not touch that process; used `E2E_PORT=3101` instead (the same escape hatch
  `admin-mfa.spec.ts`'s own header comment already documents) — see DECISIONS.md FD-01.
- **Every admin sign-in hits F0-07's forced TOTP flow** (`/mfa/enroll` the first time, then
  `/mfa/verify` on every subsequent sign-in) — F0-20's hardening isn't merged yet but the gate
  itself is live. Pre-enrolled and verified a TOTP factor for each seeded admin via the API
  (reusing `tests/helpers/totp.ts`, the same technique `admin-mfa.spec.ts` uses), and the test's
  own `signIn()` additionally completes the sign-in-time challenge when one is pending. See
  DECISIONS.md FD-02.
- The local Supabase container initially answered "MFA enroll is disabled for TOTP" despite
  `config.toml` having it enabled — the same stale-container symptom F0-17's PROGRESS.md already
  recorded; `supabase stop && supabase start` fixed it (data was preserved, "Starting database
  from backup").
- Several earlier failed attempts (before the port fix) left orphaned test organisations/clients
  behind in the local database — harmless (isolated to local dev, and clients with completions
  can't be deleted by design anyway) but the final test's selectors were made exact (by id/full
  generated name) specifically so leftover cruft from prior runs can never make a selector
  ambiguous again.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- None — human review of FD-01/FD-02 (informational, nothing to decide), then open the PR.

## Ready for PR
- Yes
