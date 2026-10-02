# Progress — ADM-05 Admin — Remove client

Status: READY FOR PR
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
- Tests written first (T-01 to T-11), failing for the expected reasons.
- Migration `20261002232608_admin_remove_client.sql` (column, clearing trigger, `admin_remove_client`); `database.types.ts` regenerated.
- `removeClient` action, mock store, mock branch of `getAdminClients`; Remove wired in the Admin screen with the extended dialog, alert on failure and "<name> removed." status.
- `ClientHeaderSummary.organisationRemoved`; shared `OrganisationRemovedBanner`; Family Settings banner and Choose organisation button; Family Home banner with link; both pages wired.
- The two ADM-04 tests changed per FD-05: **HUMAN REVIEW: test expectation changed** (`removes only the confirmed client…` now waits for the mocked `removeClient` and no longer asserts the preview resets on remount; `removes the final client into the empty state` now waits for each removal).

## In progress
- None

## Remaining
- Human approval to open the PR. Before it: `supabase db reset` then re-run `admin_client_remove.test.sql` (two count assertions are polluted by the local database, see TEST_PLAN Results).

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 11 / 11 (T-01 to T-11)
- Passing: all (pgTAP 30 of 32, the other 2 are database-pollution counts; see TEST_PLAN Results)
- Failing: none caused by this feature

## Files changed
- Docs in this folder; `supabase/tests/admin_client_remove.test.sql`; `tests/integration/admin-client-remove.test.ts`; `src/server/admin/clients-actions.test.ts`; `src/features/admin-clients/client-remove.test.tsx`; `src/features/family-settings/organisation-removed.test.tsx`; `src/features/family-home/organisation-removed-banner.test.tsx`.

## Decisions
- See DECISIONS.md (FD-04 and FD-03 need human review at PR)

## Problems encountered
- The integration file runs only against local Supabase (override the three env vars from `supabase status -o env`); it was run that way and fails for the expected reason.

## Assumptions
- Banner copy and placement (FD-04) are built from tokens and flagged for review.

## Next action
- Wait for the human to say yes, then open the PR to `main` (CI is down: list the local commands and results in it).

## Ready for PR
- Yes, pending approval. PR notes: design gap, built from tokens, please review; alters `clients` (new column and trigger, read by Family, Carer and Admin); cross-lane Family files (FD-04); FD-03 and FD-04 need human review; ADM-04 test change (FD-05).
