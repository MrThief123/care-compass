# FAM-09 — Family — Client info

| Field | Value |
|---|---|
| Feature ID | FAM-09 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-client-info` |
| Documentation | `docs/development/family-dev/family-client-info/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Maintain the client's profile.

## Problem
Client info must be editable by family, readable by carers, and not editable by admins (D28).

## Description
The Family 'Info' screen showing and editing the client's key information and client-level documents.

## User value
Everyone caring for the client reads the same up-to-date information (D9).

## Users
- Family

## Scope
- Route `/family/[clientId]/info`; in-page summary (avatar, name, '78 years · Preston VIC · Banksia Home Care').
- Section cards Description, Habits, Medical history each with 'Edit' link toggling an inline textarea with Save/Cancel (edit interaction not drawn — PROPOSED inline).
- Documentation card with file tiles and '+ Add file' (client-level documents, event_id null).
- Shared `ClientInfoView` component parameterised for reuse by CAR-04.
- Use the `client_info_sections` table created by F0-06.

## Out of Scope
- Additional client fields requested by client (DOB entry, contacts, behaviours of concern, expandable headings) — OQ-38
- Admin editing (forbidden, D28)

## Functional Requirements
- Section edits audited.

## UI / UX Requirements
- Match Family · Info frame.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-13 (Client document storage), FAM-UI-04 (Family Info screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-26
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-38

## Inputs
- Section text
- Files

## Outputs
- Updated sections
- Documents

## Error / Edge Cases
- Empty section → shows 'Not added yet' with Edit (PROPOSED copy).
- Very long text wraps; no truncation.

## Security / Permissions
- Medical history is sensitive health data: RLS limits to linked family and assigned carers.

## Technical Considerations
- Server Actions with Zod (max length PROPOSED 5,000 chars).

## Traceability
- Product requirements: REQ-10 (Client information page with key descriptive, habit and medical information and documentat…), REQ-22 (Files (reports, photos, referrals) can be uploaded, attached to the client or an event, lo…)
- Sources: UI-D9, D10, D29; CIS3 Data Entry 1–2; CIS5 'What should be on front page'; CM-0309 (open client information first); Design: Family · Info
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
