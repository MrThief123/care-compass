# ADM-01 — Admin Home — counts and overdue events

| Field | Value |
|---|---|
| Feature ID | ADM-01 |
| Dashboard / stream | Admin |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `admin-dev` |
| Feature branch | `feature/admin-home` |
| Documentation | `docs/development/admin-dev/admin-home/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **ADM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Organisation overview.

## Problem
Row chevron destination is undefined (no admin task detail, Q14).

## Description
Admin landing screen showing organisation totals and every overdue event across the organisation's clients.

## User value
Managers see what needs attention across ~42 clients (accountable).

## Users
- Admin

## Scope
- Route `/admin/home`; header 'Home'.
- Stat cards: 'Clients 42', 'Staff 17' (counts for admin's organisation).
- Overdue events card (alert tone), caption 'across all clients': rows Client · Event · Nurse · Overdue pill · chevron.
- Empty state 'All caught up'.
- Chevron behaviour per OQ-37 (not linked until answered).

## Out of Scope
- Admin task detail/log (PL-20)

## Functional Requirements
- Overdue = derived status across current clients of the organisation.

## UI / UX Requirements
- Match Admin · Home frame.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), ADM-UI-01 (Admin Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-29
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-37

## Inputs
- session admin

## Outputs
- Home page

## Error / Edge Cases
- Large volume → PROPOSED show 20 newest + load more.

## Security / Permissions
- Organisation-scoped via RLS.

## Technical Considerations
- Efficient query: expand only recent window (PROPOSED last 30 days) for overdue — confirm.

## Traceability
- Product requirements: REQ-34 (Admin Home shows client and staff counts and overdue events across all clients.)
- Sources: UI-D5; US A-5; DD §1 (Admin: accountable); Design: Admin · Home
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
