# CAR-02 — Carer — Notifications card and bell

| Field | Value |
|---|---|
| Feature ID | CAR-02 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` |
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
_Rewritten 2026-09-30 for CHG-025 and FD-01 to FD-06 (feature DECISIONS.md)._
- `carer_notifications` table (recipient, source, kind, message, client_id, shift_id, created_at, read_at); RLS: recipient reads own rows, may set only `read_at` on them; nobody inserts except the trigger.
- SECURITY DEFINER trigger on `shifts`: assigned, changed (times), reassigned (old carer cancelled, new carer assigned), cancelled. Messages built in the database, Melbourne time, full client name (FD-02, FD-03).
- Notifications card on Carer Home (already built by CAR-UI-01): now on real data, unread dot on unread rows.
- Bell in the carer header: unread count badge; click scrolls to the card (or goes to Carer Home from other pages) and marks all read (FD-04).
- Contract: Supabase branch for `getCarerNotifications`, new `getCarerUnreadCount`, new `markCarerNotificationsRead` action.
- Additive `bellSlot` prop on the shared `PageHeader` (FD-05).

## Out of Scope
- Family document or event notifications (dropped by CHG-025); `'family'` source stays in the type, unused
- 'Added a note' notifications (notes not designed, OQ-34)
- Email or push notifications; budget notifications (email only, D23)
- Per-row mark-as-read, deleting notifications, retention or expiry
- Backfilling notifications for shifts that exist before the migration

## Functional Requirements
- Message text is generated in the database from the shift and client rows (FD-03), never by the client.
- Unread count comes from `read_at is null` for the signed-in carer only.

## UI / UX Requirements
- Admin chip neutral, Family chip brand (unchanged); unread dot plus the text 'Unread' for assistive tech; badge never colour alone (a number).
- Nothing overlaps at any width; long messages wrap (CAR-UI-01 layout unchanged).

## Dependencies
- Features: F0-10 (Shifts schema, active-shift function and conflict query), F0-13 (Client document storage), CAR-UI-01 (Carer Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-14
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-34

## Inputs
- Shift/document events

## Outputs
- Notifications

## Error / Edge Cases
- A cancelled shift notifies once; later updates to it notify nobody.
- A carer with no notifications sees the existing 'No notifications' state; count is hidden at 0.
- A failed mark-read leaves the count as it was and shows nothing alarming (the next load corrects it).

## Security / Permissions
- Carers only read their own notifications.

## Technical Considerations
- Trigger function is SECURITY DEFINER with a fixed `search_path`; carers cannot insert, edit message text, or read anyone else's rows.

## Preview
After implementation: a running dev server with sign-in as Aisha (mock and local Supabase), so the human can see the card, unread dots and bell. See SESSION_STATE.md.

## Traceability
- Product requirements: REQ-32 (Carers have an in-app notifications panel (e.g. new shift, family updates).)
- Sources: UI-D23, D34; UI-§6 Notification row (source admin/family); Design: Carer · Home Notifications ('New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).', 'Helen updated Margaret's care plan documents.', 'Helen added a note to today's Afternoon check-in.')
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
