# FAM-08 — Family — Event documents (file tiles)

| Field | Value |
|---|---|
| Feature ID | FAM-08 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-event-documents` |
| Documentation | `docs/development/family-dev/family-event-documents/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-03**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Attach files to events.

## Problem
Documents must stay with the record in perpetuity.

## Description
Adds working document tiles to the event form and Task detail, backed by document storage.

## User value
Referrals, plans and evidence live with the care they relate to.

## Users
- Family

## Scope
- File tiles showing file icon + filename; clicking opens a signed URL in a new tab.
- '+ Add file' tile opening the file picker; upload progress; error on invalid type/size.
- Documents attached on save of Add/Edit event; listed read-only on Task detail (FAM-15 displays via shared component).

## Out of Scope
- Client-level documentation (FAM-09)
- Removing/detaching documents (not designed)

## Functional Requirements
- Uploaded files linked to event_id and client_id.

## UI / UX Requirements
- Dashed border add tile; 44px min target.

## Dependencies
- Features: F0-13 (Client document storage), FAM-UI-03 (Family Add / Edit event screens (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-26
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Files

## Outputs
- documents rows

## Error / Edge Cases
- Upload then Cancel form → PROPOSED uploaded file remains detached (not linked); confirm.

## Security / Permissions
- Signed URLs only; no public links.

## Technical Considerations
- Shared `DocumentTiles` component.

## Traceability
- Product requirements: REQ-22 (Files (reports, photos, referrals) can be uploaded, attached to the client or an event, lo…)
- Sources: CIS3 Data Entry 4; FR-4.1, 4.3; Design: Edit event Documents (Physio referral.pdf, Exercise plan.pdf, + Add file); Design: Task detail Documents
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
