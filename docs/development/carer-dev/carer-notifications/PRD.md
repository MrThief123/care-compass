# CAR-02 — Carer — Notifications card and bell

| Field | Value |
|---|---|
| Feature ID | CAR-02 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-notifications` |
| Documentation | `docs/development/carer-dev/carer-notifications/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Keep carers informed in-app.

## Problem
Full list of notification types, bell behaviour and read state are undecided.

## Description
Records and displays notifications for carers such as new shift assignments and family document updates.

## User value
Carers learn about changes affecting their clients without being told in person (D34).

## Users
- Carer

## Scope
- `carer_notifications` table (recipient, source 'admin'|'family', kind, message, client_id, created_at, read_at) with RLS recipient-only.
- DB triggers: shift inserted → notify carer (source admin); client document added by family → notify carers assigned to that client (source family).
- Notifications card on Carer Home: rows with source chip and message, newest first.
- Bell in header: behaviour per OQ-14 (e.g. unread indicator + scroll/panel).

## Out of Scope
- 'Added a note' notifications (notes feature not designed, OQ-34)
- Email or push notifications
- Budget notifications (email only, D23)

## Functional Requirements
- Message text generated server-side from data (e.g. date formatted 'Tuesday 1 Dec, 09:00–11:00').

## UI / UX Requirements
- Admin chip neutral outline; Family chip brand outline (per design).

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), F0-13 (Client document storage), CAR-UI-01 (Carer Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-14
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-34

## Inputs
- Shift/document events

## Outputs
- Notifications

## Error / Edge Cases
- Carer removed from client → no further notifications for that client.

## Security / Permissions
- Carers only read their own notifications.

## Technical Considerations
- Triggers insert with SECURITY DEFINER function.

## Traceability
- Product requirements: REQ-32 (Carers have an in-app notifications panel (e.g. new shift, family updates).)
- Sources: UI-D23, D34; UI-§6 Notification row (source admin/family); Design: Carer · Home Notifications ('New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).', 'Helen updated Margaret's care plan documents.', 'Helen added a note to today's Afternoon check-in.')
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
