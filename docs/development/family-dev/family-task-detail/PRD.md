# FAM-15 — Family — Task detail

| Field | Value |
|---|---|
| Feature ID | FAM-15 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-task-detail` |
| Documentation | `docs/development/family-dev/family-task-detail/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D11 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-07**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Show occurrence detail.

## Problem
Undo of Done (Q16) is undecided.

## Description
Drill-down detail for one occurrence reached from the Task log, Overdue card, Recent activity and Log panel.

## User value
Families can see exactly what happened, when and by whom.

## Users
- Family

## Scope
- Route `/family/[clientId]/tasks/[occurrenceKey]`.
- '< Back to Task log' link; title (Title/Page); subline 'Monday 30 November 2026 · Assigned to Aisha R.'.
- Status card: pill ('Done · Aisha R.') and 'Completed at 09:14' when done; planned/overdue shows pill only.
- Description card with 'Edit' link → FAM-07 edit route.
- Documents card with file tiles (read-only here).
- Wire chevrons from Overdue card, Recent activity, Log panel and task log rows.

## Out of Scope
- Undo Done (OQ-10)
- Comments/notes (OQ-34)

## Functional Requirements
- Invalid occurrence key → not found page.

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), F0-13 (Client document storage), FAM-UI-07 (Family Task log and Task detail screens (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-29, OQ-10
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- occurrenceKey

## Outputs
- Detail page

## Error / Edge Cases
- Occurrence cancelled after completion → still viewable with status Done.

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
