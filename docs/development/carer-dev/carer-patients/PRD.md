# CAR-03 — Carer — Patients

| Field | Value |
|---|---|
| Feature ID | CAR-03 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-patients` |
| Documentation | `docs/development/carer-dev/carer-patients/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Rewritten 2026-09-29 (FD-01)** for CHG-027 (access follows shifts), CHG-028/029 (patient tabs), CHG-032 (full names) and the human's answers on search. The original "assigned clients", 'Margaret' and 'Eld' wording is obsolete.
>
> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
List the signed-in carer's patients: the clients they have a shift with that has not ended.

## Problem
`getCarerPatients` still throws for `DATA_SOURCE=supabase`, and the built search only filters the loaded list locally. Carers must not see clients they have no current or upcoming shift with (PD-041).

## Description
Wires `getCarerPatients(carerId, query?)` (`src/server/shifts/queries.ts`) to Supabase and makes search server-side through the URL's `?q=`. The screen itself (grid, cards, tabs, empty and error states) is CAR-UI-02, merged.

## User value
Carers find the person they're caring for quickly, and see only people they are rostered to.

## Users
- Carer

## Scope
- Supabase branch of `getCarerPatients`: the carer's own non-cancelled shifts with `ends_at > now`, one row per client, ordered by the soonest such shift (FD-03 of CAR-UI-02), each with `name` (first + last, CHG-032), `age` (from date of birth, Melbourne today), `suburb` and `onShift` (a shift in progress now). Reads run under the carer's session, so RLS (`is_assigned_carer`, F0-18) is what limits the clients; no new migration.
- Contract change: `getCarerPatients(carerId, query?)`. The optional `query` keeps rows whose full name contains it, case-insensitively, after trimming; blank means all. `CarerPatientRow` gains `name`; `firstName` stays for the header, tabs and 'View only' notice (their full-name sweep is unscheduled, CHG-032). The mock follows the same rules.
- Route `/carer/patients` reads `?q=` (first value if repeated, trimmed, length-clamped like Family's Care log) and passes it to the contract. Search box: typing updates the URL after a pause, Enter searches at once, clear removes `q`, and the box opens holding the URL's `q`.
- Cards show the full name and '78 years · Preston VIC'; card click goes to `/carer/patients/[clientId]` (CAR-04).
- States (built): empty 'No patients assigned yet' (no search box) when the carer has no patients and no `q`; 'No matches for "<q>".' with the box kept when a search finds nothing; card-grid skeleton; error state.

## Out of Scope
- Client info page and the patient tabs (CAR-04, CAR-06).
- Full names in the patient header, tabs, notice and notifications (CHG-032 sweep).
- Seed data (F0-16); tests build their own rows.
- Any migration or RLS change.

## Functional Requirements
- Only clients with a non-cancelled shift with the carer that has not ended (PD-041): a scheduled future shift already lists the client; the last shift ending removes them.
- One card per client however many shifts they have.
- `onShift` is true only while a shift with that client is in progress (start inclusive, end exclusive), and drives the card's edit badge.

## UI / UX Requirements
- Already built (CAR-UI-02); match Carer · Patients frame. Only the card name text becomes the full name. Long names wrap or cut off without overlap at every width (1920 to 768).

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-10 (Shifts schema, active-shift function and conflict query), F0-18 (Carer view access derived from shifts, CHG-027), CAR-UI-02 (Carer Patients and patient info screens (UI)) — all merged
- Blocking open decisions (must be answered before START FEATURE): OQ-09 (ANSWERED, PD-041)
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- `carerId` (the signed-in carer), `q` (URL search, optional)

## Outputs
- `CarerPatientRow[]`: `{ clientId, firstName, name, age, suburb, onShift }`, soonest shift first

## Error / Edge Cases
- Search no results → 'No matches for "<q>".'; no patients and no `q` → the empty state.
- Database error: the contract throws a generic message naming no client or carer; the page logs only the error's class and shows the error state.
- A client without date of birth or suburb: `suburb` is `''` and age is omitted from the meta line rather than shown wrong (implementer records the exact wording in DECISIONS.md).
- Two clients with the same first name are told apart by last name.
- A `q` that looks like SQL or wildcards (`%`, `_`, `'`) is just text: it is matched in code, never built into a query.

## Security / Permissions
- RLS decides the list: shifts are read as the carer, clients through `is_assigned_carer`. Another carer's clients, an unassigned client in the same organisation and another organisation's clients never appear, with or without a search.
- No PII in logs.

## Technical Considerations
- Server Component page; the search box is a client component moving the URL (pattern of Family Care log, `family-task-log`). One pattern per problem: reuse its query helpers if they can be imported without editing Lane F files, otherwise a local copy is a FD entry.
- `getCurrentUser("carer")` supplies `profileId`; `findCarerPatient` (patient tabs) keeps calling `getCarerPatients(profileId)` with no query.

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…)
- Sources: US C-1; UC-C01; CM-0409 (view assigned/rostered patients); CM-0309 (open client information first); Design: Carer · Patients; Design: States sheet 'No patients assigned yet'; PD-041; CHG-027, CHG-032
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
