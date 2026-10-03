# INT-12 — Cross-role integration journey

| Field | Value |
|---|---|
| Feature ID | INT-12 |
| Dashboard / stream | Shared (all three dashboards) |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/shared-cross-role-integration` |
| Documentation | `docs/development/shared/shared-cross-role-integration/` |
| Lane | I — Integration |
| Sprint | SPRINT · planned D20–D21 |
| Status / owner | See PROGRESS.md |
| Added by | CHG-054 (human request, 2026-10-03) |

## Purpose
One integration suite that proves every main feature works end to end in a real browser, and that a change made by any one role is seen by the other two.

## Problem
Each feature has its own tests, and INT-02, INT-03, INT-04, INT-05 and ADM-11's cross-role check each prove one slice. Nothing proves the whole product works together: sign-in and 2FA, the calendar, events, budgets, cost deductions, shifts and organisation changes, with Family, Carer and Admin all reading the same data. That shared data is the core of the product.

## Description
A phased Playwright suite under `tests/e2e/int-12/` that runs against a local Supabase stack with real sign-ins. Each run creates its own synthetic organisation, admin (with TOTP), carer, family and client, and removes them afterwards. Three browser contexts (Family, Carer, Admin) stay signed in at once, so every write by one role is checked from the other two.

The feature is worked one phase at a time (Phase 0 to Phase 8). Each phase is a separate spec file that can run alone, and is finished, committed and recorded in PROGRESS.md before the next starts. Each phase ends with a short manual walkthrough of its main journey in a real Chrome window.

### Phases
| Phase | Name | What it proves |
|---|---|---|
| 0 | Harness | Local-only guard, per-run seed and clean-up, three signed-in contexts, mail-catcher reader, one command to run all phases |
| 1 | Accounts, sign-in, 2FA and passwords | Family and organisation sign-up, admin TOTP enrolment and sign-in, carer invite and first sign-in, password reset for all three roles, role routing |
| 2 | Family core | Calendar views, create, open, edit events, documents, budget view and Update funds, Settings and client info |
| 3 | Family → Admin and Carer | Every Family change from Phase 2 is seen by Admin and by the carer on shift |
| 4 | Admin → Family and Carer | Shifts, admin-made events, ticks and top-ups, cancel shift, deactivate carer, remove client, Staff and Clients lists agree |
| 5 | Carer → Family and Admin | Carer sees only their clients, no edits off shift, ticks and costs deduct the budget once, pending costs, carer-made events, carer settings |
| 6 | Organisation change | Family moves organisation: old admin and carer lose the client, new admin gains it, history kept |
| 7 | Budget emails | Threshold and pending-cost emails reach the right people after a carer's completion |
| 8 | Whole-suite run and sign-off | All phases green three runs in a row, no leftover rows, real-browser walkthrough recorded, defects listed |

## User value
The team and the client can trust that what one person does on the app is what everyone else sees. Regressions in the core loop (schedule → deliver → record → pay) are caught before release.

## Users
- Family
- Carer
- Admin

## Scope
- Playwright e2e specs, one per phase, under `tests/e2e/int-12/`, plus a shared helper `tests/e2e/int-12/support.ts` (seed, clean-up, contexts, sign-in with TOTP, mail reader).
- An npm script `test:journey` that runs the phases in order with one worker.
- Checks only through the UI, as each role sees it, except: seed and clean-up use the service-role key; Phase 5 AC-30 also attempts a direct write with the carer's own session to prove RLS refuses it.
- Emails are read from the local Supabase mail catcher (Inbucket, port 54324). Budget email jobs are triggered by calling their secret-checked job routes, not by waiting for cron.
- "Sees the change" means: the other role, already signed in with the screen open, reaches the new data by moving to another screen and back through the app's own links (no browser reload), and again after a fresh sign-in. This matches ADM-11's `tests/e2e/shared-cross-role-sync.spec.ts`.
- A manual walkthrough of each phase's main journey in Chrome, with screenshots in `docs/development/shared/shared-cross-role-integration/evidence/`.
- Recording every defect found in PROGRESS.md and as a new Parking lot item or feature proposal for the human.

## Out of Scope
- Fixing product defects. A failing check that shows a real bug is recorded, marked `test.fail()` with a link to the defect entry, and raised with the human; it is not fixed inside INT-12 (CLAUDE.md §6).
- Live push updates (Supabase Realtime). The app has no live push today; a screen that is left open without navigation is not expected to change. If the human wants live push, that is a new feature.
- Overdue and upcoming care alert emails (INT-09, blocked on OQ-40).
- Accessibility (INT-06) and performance (INT-07) checks.
- Running against the hosted Supabase project.
- CI wiring (CI is off; the suite is run locally and results are listed in the PR).

## Functional Requirements
- FR-01: The suite refuses to start unless `NEXT_PUBLIC_SUPABASE_URL` is a local address and `E2E_DATA_SOURCE=supabase`.
- FR-02: Every person and organisation the suite creates has an `int-12-<runId>` marker in its email or name, and clean-up removes them all, also when a test fails.
- FR-03: All times are checked in `Australia/Melbourne`. Dates are chosen relative to "now" so shifts can be current, future or past on any day the suite runs.
- FR-04: Every displayed person name is checked as first and last name (CHG-032).
- FR-05: Test titles start `[INT-12][AC-xx]` and carry a `@phase-N` tag.

## UI / UX Requirements
- None. No UI is built.

## Dependencies
- Features: F0-17, F0-18, F0-20, F0-24, FAM-04, FAM-06, FAM-07, FAM-08, FAM-09, FAM-10, FAM-11, FAM-12, FAM-13, FAM-15, CAR-02, CAR-03, CAR-04, CAR-05, CAR-06, CAR-07, CAR-09, ADM-01, ADM-02, ADM-03, ADM-05, ADM-07, ADM-08, ADM-09, ADM-11, INT-01, INT-10, INT-11
- Not yet merged on 2026-10-03: F0-24 (carer invite and reset links), ADM-11 (admin-made events, ticks and top-ups). INT-12 starts when both are merged.
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-40 (care alert emails; out of scope here, see Out of Scope)

## Inputs
- Local Supabase stack with all migrations from `main` applied.
- `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `supabase status -o env`.
- A production build (`next build`) started by Playwright's web server.

## Outputs
- `tests/e2e/int-12/*.spec.ts` and `support.ts`; `test:journey` script.
- Per-phase results and a defects list in PROGRESS.md; screenshots in `evidence/`.

## Error / Edge Cases
- A costed task ticked twice, or two roles ticking the same occurrence, charges once.
- A cost larger than the bucket balance is held as pending, then paid when funds are added.
- A carer whose shift has not started, has ended, or was cancelled sees the client but has no edit controls.
- A deactivated carer cannot sign in; their past completions still show their name.
- A client moved to another organisation keeps its full history.
- Wrong TOTP code, expired reset link, wrong password: refused with a clear message and no account-enumeration signal.

## Security / Permissions
- Synthetic data only; no real names, phone numbers or emails.
- The service-role key is used only in `support.ts` for seed and clean-up, never in a check of what a role can see.
- Never runs against the hosted project (`.env.local` points at the hosted project; the local env must be passed explicitly).

## Technical Considerations
- Reuse the patterns in `tests/e2e/shared-cross-role-sync.spec.ts`, `tests/e2e/admin-rostering.spec.ts`, `tests/e2e/organisation-transfer.spec.ts` and `tests/helpers/totp.ts`; do not add a second e2e pattern.
- Phases run serially (`workers: 1` for this folder) because they share one seeded world per phase; each phase seeds its own world so it can run alone.
- No new dependency is expected. Reading Inbucket uses `fetch` on its HTTP API.

## Traceability
- Product requirements: REQ-04, REQ-17, REQ-18, REQ-19, REQ-23, REQ-24, REQ-25, REQ-26, REQ-28, REQ-31, REQ-32, REQ-37, REQ-N4, REQ-N5, REQ-N6
- Source: human request in session, 2026-10-03 (CHG-054)

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements.
