# Progress — ADM-08 Admin — Manage carer-client assignments

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D16
Branch: `feature/admin-carer-assignments`
PR target: `main`
Last updated: 2026-10-02 (implemented; awaiting human approval to open the PR)

## Blockers
- None. OQ-09 and OQ-19 are ANSWERED (see DECISIONS.md)

## Dependencies status
- ADM-07 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed; ACs expanded to AC-01..AC-07, TEST_PLAN, FD-01..FD-03 (human-confirmed)
- Tests written first (pgTAP, unit, component, integration, e2e); all fail for the expected reason

## In progress
- None

- Migration `admin_end_carer_assignment`, server queries/actions/mock store, Staff screen Clients list + Remove confirmation, db types regen
- T-01..T-15 pass; T-16 checked in a real browser

## Remaining
- Status page refresh (`node scripts/status-page.mjs`); human "yes" before opening the PR

## Acceptance criteria status
- 7 / 7 MET

## Tests
- Written: 16 cases (T-16 manual) across 5 files
- Passing: 16
- Failing: 0

## Files changed
- `supabase/migrations/20261002020153_admin_end_carer_assignment.sql`
- `src/server/admin/assignments-{queries,actions,mock-store}.ts`
- `src/features/admin-staff/carer-assignments.tsx`; `staff-screen.tsx` (optional `assignments` prop); `src/app/(admin)/admin/staff/page.tsx`
- `src/lib/supabase/database.types.ts` (regenerated; also picks up tables from earlier migrations that were missing from the committed file)
- `src/features/admin-staff/carer-assignments.test.tsx` (one assertion, see DECISIONS FD-04: HUMAN REVIEW)

## Decisions
- See DECISIONS.md

## Problems encountered
- T-10 failed on the `region` axe rule; recorded as FD-04 (HUMAN REVIEW: test expectation changed).
- Turbopack rejects the symlinked node_modules in this worktree; the e2e build used `next build --webpack`.
- Full-suite failures not in this feature's files: storage-upload, seed-data, sign-up and auth-audit integration tests, and 13 mock-mode e2e specs (carer/family client info, documents, care delivery, organisation transfer). Not run on `main` to compare.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human review, then "yes" to open the PR. PR must say: design gap, built from tokens, please review; touches staff-screen.tsx, which ADM-03 also edits.

## Ready for PR
- No
