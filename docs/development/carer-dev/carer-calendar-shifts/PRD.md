# CAR-05 — Carer — Calendar (shifts) and selected-shift tasks

| Field | Value |
|---|---|
| Feature ID | CAR-05 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-calendar-shifts` |
| Documentation | `docs/development/carer-dev/carer-calendar-shifts/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D9–D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature. Rewritten 2026-09-29 for CHG-025/030/031/032; the original three-block, task-panel scope is obsolete.** The screen UI is delivered on fixtures by **CAR-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Show the signed-in carer's real shifts on Carer Home's Shifts calendar (Day, Week, Month).


## Problem
The calendar UI is built on fixtures (CAR-UI-03, merged). `getCarerShifts` still throws for `DATA_SOURCE=supabase`, and RLS hides a client the moment the carer's last shift with them ends (PD-041), so a past shift cannot name its client by a plain read.


## Description
Wires `getCarerShifts(carerId, range)` (`src/server/shifts/queries.ts`) to Supabase so Carer Home's Shifts calendar shows the carer's real shifts. **No screen of its own**: CHG-031 removed `/carer/calendar`, and CHG-025 dropped the selected-shift Tasks panel. This feature owns the wiring for Carer Home's calendar, so CAR-01 does not repeat it (human, 2026-09-29).


## User value
Carers see their real roster, day, week or month, with who each shift is for.


## Users
- Carer

## Scope
- Supabase branch of `getCarerShifts`: the carer's shifts starting on a Melbourne day from `range.from` to `range.to` (both inclusive), earliest first, cancelled shifts left out, each with the client's **full name** (`clientName`, CHG-032).
- New migration adding `get_carer_shifts(p_carer_id uuid, p_from timestamptz, p_to timestamptz)` (security definer, `search_path = public`): returns only the caller's own non-cancelled shifts in the window plus the client's first and last name; empty when `p_carer_id` is not `auth.uid()`; execute granted to `authenticated` only. The Melbourne-day to instant conversion is done in TypeScript with `src/lib/dates`.
- Rename `CarerShiftRow.clientFirstName` to `clientName` (full name) in the contract, mock and `carer-home-view.tsx`; blocks and month chips show the full name.
- Regenerate `src/lib/supabase/database.types.ts` for the new function.
- Carer Home passes the Supabase data through unchanged (Day default, D/W/M, Previous/Next/Today, block opens `/carer/patients/[clientId]`: all delivered by CAR-UI-03/CAR-UI-01).


## Out of Scope
- Ticking tasks (CAR-06, done from the patient's own Calendar, CHG-026); shift editing (admin only).
- `getCarerTodayShifts` and `getCarerPatients` Supabase wiring (CAR-01, CAR-03).
- Carer notification wording and every other first-name-only display (CHG-032's sweep).
- A Carer Calendar route, the Tasks panel, status pills on blocks (removed by CHG-025/CHG-031).
- Seed data (F0-16); tests build their own rows.


## Functional Requirements
- Only the signed-in carer's own shifts, never another carer's or another organisation's (REQ-25).
- Cancelled shifts never appear.
- A shift belongs to the Melbourne day its start falls on (`Australia/Melbourne`, OQ-32); a range is validated with `OccurrenceRangeSchema` before any query.
- A past shift still names its client (full name only; no other client data leaves the function).


## UI / UX Requirements
- Already built (CAR-UI-03). Only the block title text changes: full name instead of first name. Long names wrap or cut off without overlap at every width (1920 to 768).
- Empty range: the existing empty state ('No shifts'); query failure: the existing error state.


## Dependencies
- Features: F0-10 (shifts schema), F0-18 (carer read access follows shifts), CAR-UI-03 and CAR-UI-01 (screen, merged)
- Blocking open decisions: OQ-33 (ANSWERED, PD-043, amended by CHG-025/030/031). Answered in-session 2026-09-29: cancelled shifts hidden; CAR-05 owns the calendar wiring; past shifts keep the client's full name (CHG-032).
- Non-blocking: OQ-32 (Australia/Melbourne).


## Inputs
- `carerId` (the signed-in carer), `range {from, to}` (Melbourne dates, from the URL params `view`, `date`, `month`)


## Outputs
- `CarerShiftRow[]`: shift fields plus `clientName`, earliest first


## Error / Edge Cases
- No shifts in the range: `[]`, calendar grid with no blocks.
- Backwards or over-long range: rejected before the database is called.
- Database error: the function throws a generic error (no client or carer name in the message); Carer Home shows its error state.
- A shift at 23:30 Melbourne on the last day is included although its UTC date is the day before; one at 00:30 the next day is not.
- Two clients with the same first name are told apart by their last names.


## Security / Permissions
- Carer's own shifts only, enforced in the function (`p_carer_id = auth.uid()`) as well as by the shifts RLS policy.
- The function returns the client's name and nothing else; family, admin and anon callers get no rows for someone else's shifts.
- No PII in logs.


## Technical Considerations
- Follow the data-source adapter shape (ARCHITECTURE.md §3.2), as `getOrganisationChoices` does (`supabase.rpc`, generic error).
- One new migration: shared-lane folder, allowed by CHG-032 and flagged in the PR. Adds no table, so no new RLS.
- Reuse `src/lib/dates` for Melbourne days; no second date library.


## Traceability
- Product requirements: REQ-25 (Carers see all their assigned shifts in a calendar.)
- Decisions: PD-041, PD-043 (amended CHG-025), CHG-030, CHG-031, CHG-032
- Sources: UI-D8, D13; Design: Carer · Calendar (now Carer Home 'Shifts')
- Source abbreviations are defined in `docs/SOURCES.md`.


## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
