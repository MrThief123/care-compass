# FAM-15 — Family — Task detail

| Field | Value |
|---|---|
| Feature ID | FAM-15 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| PR target | `main` (CHG-036) |
| Feature branch | `feature/family-task-detail` |
| Documentation | `docs/development/family-dev/family-task-detail/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D11 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-07**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Show occurrence detail.

## Problem
The Task detail screen (FAM-UI-07) already renders, and reads through the `src/server/events` and `src/server/documents` contracts, which already have a Supabase branch. What is left is to verify it against real data and to close the gaps found at start (FD-02, FD-03): plain events return 404 and a cancelled-after-completion occurrence disappears.

## Description
Drill-down detail for one occurrence reached from the Task log, Overdue card, Recent activity and Log panel.

## User value
Families can see exactly what happened, when and by whom.

## Users
- Family

## Scope
- Route `/family/[clientId]/tasks/[occurrenceKey]`.
- Verify against real data (`DATA_SOURCE=supabase`): '< Back to …' link (follows the origin, CHG-014); title; subline 'Monday 30 November 2026 · Assigned to Aisha Rahman' (full names, CHG-032; assignee from the covering shift, the actor once Done, '—' if none, PD-055).
- Status card: pill ('Done · Aisha Rahman') and 'Completed at 09:14' when done; planned/overdue shows pill only.
- **Plain events open** (CHG-009, FD-02): Status card reads 'Event · No tick-off needed', no pill, no completion time. Back label follows the origin as today (no 'Care log' rename, FD-02).
- **Cancelled after completion** still opens, as Done (FD-03).
- Description card and 'Edit event' button (CHG-014, already built); Documents card with file tiles (read-only, already built).
- Verify the chevrons from the Overdue card, Recent activity, Log panel and Task log rows open the right detail (already built by FAM-UI-01/02/07).

## Out of Scope
- A Mark done / Undo control on this screen (FD-01): Task detail stays read-only (CHG-014). Undo itself is answered (OQ-10, PD-044) but lives on the Calendar Tasks panel and Carer screens.
- The Family 'Care log' rename (FD-02).
- Comments/notes (OQ-34)

## Functional Requirements
- Invalid, unknown or other-client occurrence key → not found page.

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), F0-13 (Client document storage), FAM-UI-07 (Family Task log and Task detail screens (UI))
- Blocking decisions: OQ-29 (PD-055) and OQ-10 (PD-044) are ANSWERED. All three dependencies are merged to `main`.
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- occurrenceKey

## Outputs
- Detail page

## Error / Edge Cases
- Occurrence cancelled after completion → still viewable with status Done (FD-03).
- Plain event → viewable, no status (FD-02).

## Security / Permissions
- Linked family only; occurrence must belong to clientId.

## Technical Considerations
- Parse occurrence key safely; 404 on mismatch.

## Traceability
- Product requirements: REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-21 (Task log lists tasks with date, nurse and status, with server-side search and filter; each…), REQ-22 (Files (reports, photos, referrals) can be uploaded, attached to the client or an event, lo…)
- Sources: UI-§7.8, D27, D33; Design: Family · Task detail
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
