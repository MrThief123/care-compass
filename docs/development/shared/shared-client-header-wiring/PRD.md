# F0-20 — Client header wiring and family route guard

| Field | Value |
|---|---|
| Feature ID | F0-20 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/shared-client-header-wiring` |
| Documentation | `docs/development/shared/shared-client-header-wiring/` |
| Lane | S — Shared |
| Sprint | SPRINT |
| Status / owner | See PROGRESS.md |

> **Added by CHG-040, 2026-10-01.** Closes the "transitional state" recorded in F0-07, F0-15 and F0-19 FD-05.

## Purpose
Every Family page opens with the real client's header and only for a client the signed-in family member is linked to, under `DATA_SOURCE=supabase`.

## Problem
`getClientHeaderSummary` has only a mock branch; under `supabase` it throws, so the family layout (and Settings) fail for every page. The layout also runs the role check and the data call together (`Promise.all`), so an unimplemented or failing data call hides the role redirect (F0-19 FD-05). Nothing stops a linked family member opening another client's URL: the layout has no linked-client check (FAM-01 AC-05 needs one).

## Description
1. `getClientHeaderSummary(clientId)` gets a Supabase branch: first and last name, age (whole years, Australia/Melbourne), suburb and organisation name.
2. A new contract function `assertClientAccess(clientId)` in `src/server/clients/queries.ts`: under `supabase`, redirects to `getLandingPath()` when the signed-in user cannot read that client (not linked, unknown or malformed id). It is a no-op under `mock`.
3. The family layout runs `getCurrentUser("family")` first, then `assertClientAccess`, then the summary read. Sequential, not `Promise.all`.
4. Stale "transitional state" notes are updated.

## User value
A family member sees their own client's real header and cannot land on someone else's pages. A carer or admin who opens a family URL goes to their own home.

## Users
- Family (all Family pages); carers and admins only as redirect targets.

## Scope
- Supabase branch of `getClientHeaderSummary`; organisation name via the existing `list_organisations_for_transfer` RPC (FD-01; no migration).
- `assertClientAccess` contract function.
- Family layout ordering and the linked-client redirect.
- Settings page keeps working (it calls `getClientHeaderSummary`).
- Tests, CHG-040, DECISIONS, doc updates.

## Out of Scope
- Page-level data fetching or per-page access checks. A page that must not fetch for an unlinked client calls `assertClientAccess` itself (FAM-01 AC-05 does).
- Multi-client switching (OQ-30). Avatar upload/storage. Carer and admin layouts (already guarded, no client header).
- Other unwired stubs (`getAdminManage` is ADM-06's; `getTodayOccurrences` is FAM-01's; `getCarerTodayShifts` is unowned dead code, FD-04).
- Migrations.

## Functional Requirements
- Summary: `{ id, firstName, lastName, age?, suburb?, organisationName? }`. A missing date of birth, suburb or organisation omits that field and never throws.
- Unreadable client (no row under RLS, malformed id, database error): throws a generic error naming no client.
- `assertClientAccess`: signed-in family member linked to the client → returns; otherwise `redirect(await getLandingPath())`.
- Guard order in the family layout: session/role → client access → header data.

## UI / UX Requirements
- No new UI. Header renders as today; with no age it shows suburb and organisation only.

## Dependencies
- Features: F0-06 (tenancy, RLS), F0-07 (auth, routing), F0-15 (shell, layout), F0-13/FAM-13 (`list_organisations_for_transfer`). All merged.
- Blocking open decisions: None

## Inputs
- `clientId` route param; session.

## Outputs
- Header summary; redirect.

## Error / Edge Cases
- Client with no organisation, suburb or date of birth.
- Organisation RPC fails: header shows without an organisation name; it does not fail the page.
- Family member with no linked client opens a client URL → landing path (`/no-client-linked`).
- Carer/admin opens a family URL → role home (from `getCurrentUser`, before any data call).

## Security / Permissions
- RLS stays the boundary; the redirect is UX. Errors carry no name, id or date of birth. No PII in logs.

## Technical Considerations
- Read `node_modules/next/dist/docs/` for layouts and `redirect` before coding (CLAUDE.md §14). A layout does not stop its page rendering, so pages still rely on RLS and call `assertClientAccess` when they must not fetch.
- Follow the `getClientInfoSections` adapter pattern. Reuse `ageFromDob`.

## Traceability
- Product requirements: REQ-02, REQ-05
- Sources: CHG-040; F0-19 FD-05; FAM-01 AC-05.

## Labels
None PROPOSED.
