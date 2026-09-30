# CAR-04 — Carer — Client info

| Field | Value |
|---|---|
| Feature ID | CAR-04 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/carer-client-info` |
| Documentation | `docs/development/carer-dev/carer-client-info/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D9 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-02**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Give carers client information.

## Problem
D29 (carer edit rights match family) conflicts with CM-0409 (edit only during active shift); client meeting 4/9 is later and client-confirmed → default shift-limited editing, confirm via OQ-09. No carer-specific frame exists.

## Description
Reuses the Family Info view for a patient opened from Patients, with edit controls present only when the carer is on an active shift for that client.

## User value
Carers read the same care information as the family and can update it while working.

## Users
- Carer

## Scope
Rewritten 2026-09-30 before implementation (FD-01 to FD-06).
- **Info tab only.** Route `/carer/patients/[clientId]/info` reads Supabase and lets an on-shift carer edit. Home, Calendar and Care log stay 'Coming soon' (CHG-026/028 wiring is a follow-up; it needs a Lane F base-path/read-only change).
- Read: the client's Description, Habits and Medical history (in that order) and the client's own documents (not event documents, not detached), through `src/server/**` contract functions with `DATA_SOURCE=supabase`.
- Edit and Add file controls exist only when the carer is on an active shift for that client (`carer_on_active_shift`, PD-041); off shift they are absent and the 'View only' notice shows.
- Saving a section is a Server Action (`saveClientInfoSection`, Zod, max 5,000 characters). Adding a file uses the existing `uploadDocument`. Carers cannot remove files.
- RLS mirrors the UI: a migration lets `client_info_sections` be written, and `documents` and the `client-documents` bucket be added to, by a carer only during an active shift (family unchanged; admin still cannot write).
- A carer with no shift that has not ended for the client who opens any `/carer/patients/[clientId]/…` URL is redirected to `/carer/patients` (FD-03).
- No organisation or payment controls (D10).

## Out of Scope
- Carer editing outside shift
- Budget views for carers
- Home, Calendar and Care log tabs (follow-up)
- Removing documents; family editing rules (FAM-09 adds only what family needs beyond this)

## Functional Requirements
- RLS mirrors UI: writes rejected outside an active shift, including documents and storage uploads.
- Section edits are audited (the existing audit trigger on `client_info_sections`).
- Saved-by is the signed-in carer (`updated_by`).

## UI / UX Requirements
- Controls absent, not disabled (DD NFR-3).
- Reuse the Family Info cards' look; carer wrappers live in `src/features/carer-patients/` because `src/features/family-info/` is Lane F's (FD-02).

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-10 (Shifts schema, active-shift function and conflict query), F0-13 (Client document storage), F0-18 (Carer view access derived from shifts, CHG-027), CAR-UI-02 (Carer Patients and patient info screens (UI))
- Blocking open decisions: OQ-09 — ANSWERED (PD-041, CHG-027)
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-19

## Inputs
- clientId

## Outputs
- Info page

## Error / Edge Cases
- Shift ends while editing → save rejected with message 'Your shift has ended, so changes can't be saved.'; the draft stays in the box and nothing shows as saved.
- Text over 5,000 characters → error, not saved.
- Empty section → 'Not added yet' (as Family).

## Security / Permissions
- Assigned carers only.

## Technical Considerations
- FAM-09 is not merged, so CAR-04 builds the shared pieces (FD-01): the Supabase reads for sections and client documents, the save action and the carer RLS migration. FAM-09 reuses them.

## Traceability
- Product requirements: REQ-05 (Carers see only clients they are assigned to; read access while assigned; edit access only…), REQ-10 (Client information page with key descriptive, habit and medical information and documentat…)
- Sources: UI-D10, D29; CM-0409 (read while assigned, edit during active shift); CM-0309 (carers have similar client information view)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
