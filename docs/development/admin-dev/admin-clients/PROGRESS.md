# Progress — ADM-04 Admin — Clients list and add client

Status: READY FOR PR
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-clients`
PR target: `admin-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-07 is ANSWERED (PD-037); OQ-08 no longer applies (CHG-035).

## Dependencies status
- F0-06 — MERGED TO DEV
- ADM-UI-04 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- **CHG-035** (root DECISIONS.md, applying already-confirmed PD-037/CHG-010): corrected this feature's
  own stale docs before implementing, as CHG-010 itself instructed.
- Removed the Add-client `SidePanelForm` (and its schema/state/`save()`) from
  `src/features/admin-clients/clients-screen.tsx` — not left unwired, removed, since PD-037 rejected
  the flow entirely. Remove stays exactly as ADM-UI-04 built it (local-state preview, ADM-05's real
  scope). Empty-state copy updated (no longer references the removed add action).
- Wired `getAdminClients()` (`src/server/admin/clients-queries.ts`) to Supabase: org-scoped client
  list (RLS via `clients_select_admin`, no manual filter) with each client's family contact's full
  name, derived from `client_family_members` → `profiles`.
- **New migration** `supabase/migrations/20260929020000_admin_clients_family_contact.sql`: a real RLS
  gap surfaced while building the family-contact read — no existing `profiles` SELECT policy covers a
  family member linked to an admin's client (they usually have no `organisation_id` at all, PD-057).
  Added `profiles_select_linked_family`, narrow and additive. See DECISIONS.md FD-02 — flagged, since
  it touches the shared `profiles` table's RLS from a Lane A feature.
- Tests: `queries.test.ts`'s stale not-implemented test removed; `clients-screen.test.tsx` rewritten
  (Add-flow tests removed, a new "no Add-client UI" test added, Remove/rendering tests kept); new
  `tests/integration/admin-clients.test.ts` (list, family contact incl. the "—" no-contact case,
  org-scoping, empty org); new `supabase/tests/admin_clients.test.sql` (5 pgTAP cases for the new
  policy).

## In progress
- None

## Remaining
- None in ADM-04's own scope. ADM-05 (Remove, for real) and ADM-11 (Admin client view, full read/edit
  via a different route) remain separately scoped, unstarted features.

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 1 new migration test file (5 pgTAP cases), 1 new integration file (4 cases), 1 rewritten
  component file, 1 existing unit test file trimmed
- Passing: full `npx vitest run` — 2045 passed, 59 skipped (pre-existing, unrelated); `supabase test db`
  406/406; integration file 4/4; lint 0 errors, typecheck and format clean
- Failing: 0

## Files changed
- `supabase/migrations/20260929020000_admin_clients_family_contact.sql` — new
- `supabase/tests/admin_clients.test.sql` — new
- `src/server/admin/clients-queries.ts` — Supabase branch
- `src/features/admin-clients/clients-screen.tsx` — Add-client panel removed, empty-state copy changed
- `src/features/admin-clients/clients-screen.test.tsx` — rewritten (HUMAN REVIEW: see below)
- `src/features/admin-clients/queries.test.ts` — removed the now-false "not implemented" test
- `tests/integration/admin-clients.test.ts` — new
- `docs/development/admin-dev/admin-clients/{PRD,ACCEPTANCE_CRITERIA,TEST_PLAN,PROGRESS,SESSION_STATE,DECISIONS}.md`
- `DECISIONS.md` (root) — CHG-035

## Decisions
- See DECISIONS.md FD-01 (out-of-lane-adjacent scope corrections: family-contact derivation, Remove
  left unwired, empty-state copy) and FD-02 (the new `profiles_select_linked_family` RLS policy)

## Problems encountered
- The family-contact join initially returned "—" for every client under Supabase mode: RLS silently
  filtered the linked `profiles` row (no policy covered it), not a query bug. Diagnosed by checking
  which `profiles` SELECT policies exist and reasoning about a self-registered family account's
  `organisation_id` (PD-057: none, until they link one) — see DECISIONS.md FD-02.
- `.env.local` in this checkout points at a hosted Supabase project; ran integration/db tests locally
  with `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`
  overridden inline (`supabase status`), same as FAM-10/ADM-01/ADM-02.
- pgTAP's `request.jwt.claim.sub` is transaction-local (persists across `reset role`), so the new
  `admin_clients.test.sql`'s anon-role test had to clear it explicitly before `set local role anon`,
  or anon inherited the previous login's identity. `has_policy()` is not available in this pgTAP
  install; relied on behavioural `is()`/read assertions instead.

## Assumptions
- PROPOSED items in PRD.md (family contact "—" for none; first-alphabetically for multiple) are
  adopted as written since neither is a blocking OQ; see DECISIONS.md FD-01.
- **HUMAN REVIEW: test expectations changed.** `clients-screen.test.tsx`'s Add-flow tests were removed
  because the Add-client panel itself was removed (CHG-035/PD-037), not because of a test bug. See
  DECISIONS.md FD-01.
- **HUMAN REVIEW: shared-table RLS change.** `profiles_select_linked_family`
  (DECISIONS.md FD-02) is a new policy on the shared `profiles` table, added by this Lane A feature
  because its own AC-01 could not otherwise be met. Narrow and additive; flagged for review.

## Next action
- Human review of the PR: CHG-035's Add-panel removal, the new RLS policy (FD-02), and the rewritten
  ADM-UI-04-era tests.

## Ready for PR
- Yes
