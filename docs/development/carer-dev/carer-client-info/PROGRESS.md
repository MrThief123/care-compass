# Progress — CAR-04 Carer — Client info

Status: READY FOR PR (awaiting human approval to open it)
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D9
Branch: `feature/carer-client-info` (from `main`)
PR target: `main` (CHG-036)
Last updated: 2026-09-30

## Blockers
- None. OQ-09 answered (PD-041, CHG-027). FAM-09 overlap settled (FD-01).

## Dependencies status
- F0-06, F0-10, F0-13, F0-18, CAR-UI-02, CAR-03 — MERGED

## Completed
- Docs rewritten, tests written first and run red for the right reasons
- Migration, Supabase reads, `saveClientInfoSection`, redirect, carer Info components (FD-01 to FD-09)

## In progress
- None

## Remaining
- Mock-mode browser check and width sweep; human "yes" to open the PR
- `docs/DEVELOPMENT_PLAN.md` card status left for the PR owner (controlled file)
- DB types unchanged (no table or column changes)

## Acceptance criteria status
- 9 / 9 MET

## Tests
- Written: 9 / 9; all passing
- Local stack (supabase status -o env, never the hosted .env.local):
  - `npm test`: 181 files, 2208 tests pass
  - `supabase test db`: 15 files, 470 tests pass
  - `tests/integration/carer-client-info.test.ts`: 5/5 (on-shift save and upload succeed; off-shift refused NOT_ALLOWED)
  - `tests/e2e/carer-client-info.spec.ts`: 3/3 (production build, DATA_SOURCE=supabase)
  - typecheck: only the stale `.next/types/validator.ts` error; lint: 0 errors, 3 warnings in untouched files; prettier: only `care-compass-status.html` (not mine)

## Files changed
- `src/features/carer-patients/carer-client-info.test.tsx`, `carer-patients.test.tsx` (AC-09 ×2, HUMAN REVIEW)
- `src/server/clients/info-sections.test.ts`
- `supabase/tests/carer_client_info.test.sql`
- `tests/integration/carer-client-info.test.ts`, `tests/e2e/carer-client-info.spec.ts`

## Decisions
- See DECISIONS.md (FD-01 to FD-07)

## HUMAN REVIEW: test expectation changed
- `carer_client_info.test.sql`: admin section write/read now accepted (FD-07)
- `carer-patients.test.tsx` [CAR-UI-02][AC-09] ×2: `notFound()` became `redirect("/carer/patients")` (FD-03). A patient URL that isn't the carer's now returns them to the Patients list.
- `src/server/clients/queries.test.ts` and `src/server/documents/queries.test.ts`: the "not implemented" Supabase assertions removed, replaced by [CAR-04][AC-08] (FD-08).

## Problems encountered
- An early `npm test` ran without the local env, so the F0-07 and F0-04 integration suites hit the hosted project and may have left `f0-07-*@example.test` users there; not cleaned, reported to the human.
- `.env.local` is the hosted project: integration/e2e must be run with the local stack's variables (`supabase status -o env`).

## Assumptions
- Copy and the 5,000-character cap are the PRD's PROPOSED values.

## Next action
- Browser check, then wait for the human "yes" before opening the PR to `main`.

## Ready for PR
- Yes, pending the browser check and human approval
