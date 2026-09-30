# FAM-09 — Family — Client info

| Field | Value |
|---|---|
| Feature ID | FAM-09 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` (CHG-036) |
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
- Wire the existing Family cards (`src/features/family-info/`) to the contract CAR-04 merged: `getClientInfoSections`, `getClientDocuments`, `saveClientInfoSection`, `uploadDocument`, `getDocumentUrl`. No new contract function, no new migration unless a test proves a family rule is missing (FD-02).
- All three text cards always show for family, written or not, so a first entry can be added; an unwritten one reads 'Nothing added yet.' with Edit (FD-04).
- Save shows the server's message under the box and keeps the draft on refusal; a saved edit survives a reload.
- Add file uploads to the client (event_id null); a saved tile opens its signed URL in a new tab.
- `ClientInfoView` shared component: dropped. CAR-04 shipped carer wrappers instead (its FD-02); convergence is a later refactor, not this feature (FD-03).
- Uses the `client_info_sections` table created by F0-06.

## Out of Scope
- Additional client fields requested by client (DOB entry, contacts, behaviours of concern, expandable headings) — OQ-38
- Admin UI for editing client info. Database rule per CAR-04 FD-07: an admin of the client's own organisation may write; another organisation's admin may not (supersedes D28, FD-05).
- Removing a client document (no delete policy exists).

## Functional Requirements
- Section edits audited.

## UI / UX Requirements
- Match Family · Info frame.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-13 (Client document storage), FAM-UI-04 (Family Info screen (UI)), CAR-04 (Carer Client info: built the shared Info read/save contract and RLS, merged)
- Blocking decisions: OQ-26 — ANSWERED (PD-051: PDF, JPEG, PNG, HEIC, DOCX, 20 MB, no video)
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-38

## Inputs
- Section text
- Files

## Outputs
- Updated sections
- Documents

## Error / Edge Cases
- Empty section → shows 'Nothing added yet.' with Edit (the copy already shipped by FAM-UI-04 and CAR-04; replaces the PRD's 'Not added yet', FD-04).
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
