# Progress — CAR-04 Carer — Client info

Status: IN PROGRESS (migration done; reads, action, redirect, components remaining)
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
- Docs rewritten (PRD Scope, 9 ACs, TEST_PLAN, USER_STORIES, DECISIONS FD-01 to FD-06)
- Tests written first and run red for the right reasons

## In progress
- None

## Remaining
- Migration (`supabase migration new`): carer write on `client_info_sections`, `documents`, `client-documents` only while `carer_on_active_shift`
- `getClientInfoSections`, `getClientDocuments` Supabase reads; `saveClientInfoSection` action
- `findCarerPatient` redirects to `/carer/patients`
- Carer Info wrappers (edit-in-place save, Add file upload) in `src/features/carer-patients/`
- Replace the two "not implemented" assertions; update `docs/DEVELOPMENT_PLAN.md` card; regenerate DB types if needed

## Acceptance criteria status
- 0 / 9 MET

## Tests
- Written: 9 / 9 (component 12, unit 14, db 21 assertions, integration 5, e2e 3)
- Passing: 0 new (the CAR-UI-02 AC-09 tests are changed to expect a redirect and fail until implemented)
- Failing (red, expected): all of the above

## Files changed
- `src/features/carer-patients/carer-client-info.test.tsx`, `carer-patients.test.tsx` (AC-09 ×2, HUMAN REVIEW)
- `src/server/clients/info-sections.test.ts`
- `supabase/tests/carer_client_info.test.sql`
- `tests/integration/carer-client-info.test.ts`, `tests/e2e/carer-client-info.spec.ts`

## Decisions
- See DECISIONS.md (FD-01 to FD-07)

## HUMAN REVIEW: test expectation changed
- `carer_client_info.test.sql`: admin section write/read now accepted (FD-07)

## Problems encountered
- `.env.local` is the hosted project: integration/e2e must be run with the local stack's variables (`supabase status -o env`).

## Assumptions
- Copy and the 5,000-character cap are the PRD's PROPOSED values.

## Next action
- Human review of tests, then implement in a fresh session.

## Ready for PR
- No
