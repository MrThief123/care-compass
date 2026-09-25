# Progress — FAM-12 Family — Settings: family info and password reset

Status: READY FOR PR
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-settings-profile` (created from `origin/family-dev` at 9f4de15)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. Blocking decisions are ANSWERED in DECISIONS.md (FAM-12: OQ-35; FAM-13: OQ-06, OQ-15).

## Dependencies status
- F0-07 — MERGED TO DEV
- FAM-UI-06 — MERGED TO DEV

## Completed
- Tests first (T-01 to T-04 plus supporting tests), then implementation, 2026-09-25 (commits `test(family): …`, `feat(family): …`).
- Migration `20260925010000_profiles_self_update.sql`: own-row update policy and column grant (FD-01).
- `src/server/profiles/`: `actions.ts` (`updateFamilyContactDetails`, `requestOwnPasswordReset`), `contact-schema.ts`, `contact-details.ts`, Supabase branch of `getFamilyContactDetails`.
- `FamilySettingsView` saves and resets through the actions, with failure states.

## In progress
- None

## Remaining
- Human review, then PR (needs the human's approval to open).
- When `getClientHeaderSummary` is wired for Supabase (not this feature), add the e2e for AC-01 (FD-05).

## Acceptance criteria status
- 4 / 4 MET (AC-01 to AC-04)

## Tests
- Written: 4 / 4 planned (T-01 to T-04) plus supporting tests: pgTAP 9, server 23 (incl. queries), component 15+, integration 4
- Passing: all. `npx vitest run src/server/profiles src/features/family-settings`: 5 files, 71 tests. `tests/integration/family-settings-profile.test.ts` against the local stack: 4. `supabase test db`: 40 (4 files)
- Failing: 0 of ours. Full `npm run test` (default env): only the pre-existing `day-timeline` failure

## Files changed
- `supabase/migrations/20260925010000_profiles_self_update.sql`, `supabase/tests/profiles_update.test.sql` (Lane B folder, FD-01)
- `src/server/profiles/`: `actions.ts`, `contact-schema.ts` (moved from the feature), `contact-details.ts`, `queries.ts`, tests
- `src/features/family-settings/`: `family-settings-view.tsx`, `settings-schema.ts` (re-export), `family-settings-wiring.test.tsx`, `family-settings.test.tsx` (one wait added, FD-06)
- `tests/integration/family-settings-profile.test.ts`
- This feature's docs

## Decisions
- FD-01 migration from Lane F (HUMAN REVIEW); FD-02 rules on the server; FD-03 name split; FD-04 reset to the login email; FD-05 two tests at a lower level (HUMAN REVIEW); FD-06 two FAM-UI-06 tests changed (HUMAN REVIEW: test expectation changed); FD-07 defaults and wording.

## Problems encountered
- `.env.local` points at a **hosted** Supabase project (`cxxvrrdzftjpuefcmqxx`), not the local stack. Integration tests (this feature's and F0-07's) create and delete users there. My first run wrote temporary users to it and deleted them; a read-only check afterwards found 0 users and no leftovers. The FAM-12 integration test now runs only when the URL is local; run it with the three variables from `supabase status -o env`. **The FAM-12 migration is applied to the local database only.**
- The local stack was running with no migrations applied; `npx supabase migration up --local` (non-destructive) applied them. No `db reset` was run.
- F0-07 AC-10 (TOTP) fails on the running local stack: "MFA enroll is disabled for TOTP", although `config.toml` enables it; the stack looks started from older config (restart it). Unrelated to this feature.
- `src/components/shared/calendar/day-timeline.test.tsx` fails on `family-dev` without these changes too.
- `getClientHeaderSummary` has no Supabase branch, so the Settings page cannot render against the database yet (FD-05).

## Assumptions
- The reset link goes to the login email (FD-04); the name splits at the first space (FD-03).

## Next action
- Human reviews (migration, test levels, changed FAM-UI-06 tests, wording), then approves opening the PR to `family-dev`.

## Ready for PR
- No
