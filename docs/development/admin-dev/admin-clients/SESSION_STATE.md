# Session State — ADM-04 Admin — Clients list and add client

Last session date: 2026-09-29
Current branch: `feature/admin-clients`
Worked on: claimed ADM-04, applied CHG-035 (corrected stale docs per PD-037/CHG-010 before writing any
  code), removed the rejected Add-client panel, wired `getAdminClients()` to Supabase, discovered and
  fixed a real RLS gap for the family-contact read, wrote and ran all tests, updated feature docs.
What changed: `supabase/migrations/20260929020000_admin_clients_family_contact.sql` (new);
  `supabase/tests/admin_clients.test.sql` (new); `src/server/admin/clients-queries.ts` (Supabase
  branch); `src/features/admin-clients/clients-screen.tsx` (Add panel removed); `clients-screen.test.tsx`
  (rewritten); `queries.test.ts` (stale test removed); `tests/integration/admin-clients.test.ts` (new);
  root `DECISIONS.md` (CHG-035); all six feature docs updated.
Tests run: `npx vitest run` (full suite), `npx supabase test db`,
  `npx vitest run tests/integration/admin-clients.test.ts` against local Supabase (env vars overridden
  inline), `npm run lint`, `npm run typecheck`, `npm run format:check`
Test results: all green — 2045 passed/59 skipped (pre-existing) full unit run; pgTAP 406/406 (5 new);
  integration 4/4; lint 0 errors, typecheck and format clean.
Current blocker: none
Important discoveries: ADM-04's own docs were stale against PD-037 (2026-09-17, family creates the
  client, not admin) and CHG-010 (2026-09-24, explicitly instructed Lane A to fix this "when it starts"
  — never done). Corrected via CHG-035 before writing any implementation code. Separately: no existing
  `profiles` RLS policy lets an admin read a family member's profile (self-registered family accounts
  usually have `organisation_id = null`, PD-057), so the family-contact join returned nothing until a
  new, narrow, additive policy (`profiles_select_linked_family`) was added.
Important decisions: FD-01 (feature DECISIONS.md) — family-contact derivation (first alphabetically,
  "—" for none), Remove left exactly as ADM-UI-04 built it (ADM-05's real scope), empty-state copy
  changed. FD-02 — the new RLS policy, flagged since it touches the shared `profiles` table from a
  Lane A feature. `clients-screen.test.tsx`'s rewrite (Add-flow tests removed) flagged HUMAN REVIEW.
Exact next action: None in ADM-04's own scope — open the PR to `admin-dev` once the human approves
  (CLAUDE.md §8/§10). Flag CHG-035's scope correction, the new RLS policy, and the rewritten
  ADM-UI-04-era tests for human review in the PR body.
Files likely to be touched next: none expected for ADM-04. ADM-05 (Remove client) will touch this same
  `clients-screen.tsx`'s Remove action to wire it for real; ADM-11 (Admin client view) is a separate
  route, not this screen.
Warning for next session: `src/mocks/admin-clients.ts` (`ADMIN_CLIENTS`) is still used for mock mode —
  unlike ADM-02, no type/shape change was needed here, so this mock fixture is still live, not dead.
  Do not re-add an Add-client panel to this screen without a new confirmed decision superseding PD-037.
