# Progress — ADM-05 Admin — Remove client

Status: IN PROGRESS (tests written, not implemented)
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D18
Branch: `feature/admin-client-remove`
PR target: `main` (CHG-036)
Last updated: 2026-10-03

## Blockers
- None. OQ-06, OQ-07 and OQ-19 are ANSWERED (PD-036, PD-037, PD-052).

## Dependencies status
- ADM-04 — MERGED
- FAM-13 — MERGED (its picker and `transfer_client_organisation` are reused)

## Completed
- Claimed; docs rewritten (PRD, ACs AC-01 to AC-10, US-02, TEST_PLAN, DECISIONS FD-01 to FD-06).
- Tests written first (T-01 to T-11) and run: all fail for the expected reasons (missing function and column, missing `clients-actions` module, missing banners).

## In progress
- None

## Remaining
- Migration (`supabase migration new`): `clients.organisation_removed_at`, clearing trigger, `admin_remove_client`; regenerate `database.types.ts`.
- `src/server/admin/clients-actions.ts`, `clients-mock-store.ts`; mock branch of `getAdminClients`.
- Wire Remove in `clients-screen.tsx` (alert on failure, dialog wording, no "reload" text).
- `ClientHeaderSummary.organisationRemoved` in `src/server/clients/queries.ts`; Settings banner and Choose organisation button; Home banner and props; the two Family pages.
- Update the two ADM-04 preview tests (FD-05), flag HUMAN REVIEW.
- Full suite, `supabase test db`, e2e (`--grep-invert "F0-07"`), width sweep, axe; status page; plan card.

## Acceptance criteria status
- 0 / 10 MET

## Tests
- Written: 11 / 11 (T-01 to T-11)
- Passing: 0 (the guards that assert absence pass trivially today: 9 of 20 Vitest cases)
- Failing: all that assert the new behaviour

## Files changed
- Docs in this folder; `supabase/tests/admin_client_remove.test.sql`; `tests/integration/admin-client-remove.test.ts`; `src/server/admin/clients-actions.test.ts`; `src/features/admin-clients/client-remove.test.tsx`; `src/features/family-settings/organisation-removed.test.tsx`; `src/features/family-home/organisation-removed-banner.test.tsx`.

## Decisions
- See DECISIONS.md (FD-04 and FD-03 need human review at PR)

## Problems encountered
- The integration file runs only against local Supabase (override the three env vars from `supabase status -o env`); it was run that way and fails for the expected reason.

## Assumptions
- Banner copy and placement (FD-04) are built from tokens and flagged for review.

## Next action
- Implementation session: follow SESSION_STATE.md.

## Ready for PR
- No
