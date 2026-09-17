# F0-16 — Development seed data from the design content

| Field | Value |
|---|---|
| Feature ID | F0-16 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-dev-seed-data` |
| Documentation | `docs/development/shared/shared-dev-seed-data/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D7 |
| Status / owner | See PROGRESS.md |

## Purpose
Provide realistic, repeatable data.

## Problem
Screens cannot be verified against the design without matching data; the client's sample Care Need Items have not been supplied.

## Description
Seeds the local database with the people, events, shifts, budgets and documents shown in the designs so each dashboard can be built and tested independently.

## User value
Lets Family, Carer and Admin streams develop in parallel and makes screens verifiable against Figma.

## Users
- Developers
- Test suites

## Scope
- Organisation Banksia Home Care (ABN 54 123 456 789, 03 9555 0102, 220 High St, Preston VIC 3072) and a second organisation for negative tests.
- Admin Priya; carers Aisha Rahman (Registered Nurse, 0423 987 654), Daniel K. (Registered Nurse), Sarah Nguyen (Enrolled Nurse), Marcus Chen (Support Worker), Fatima Ali (Support Worker).
- Clients Margaret (78, Preston VIC; family Helen, 0412 345 678, helen@example.com, 12 Wattle St, Preston VIC 3072), Robert (82, Reservoir; Michael), Elsie (90, Thornbury; Susan), Frank (76, Northcote; Karen), Doris (85, Preston; Tom), Harold (79, Coburg), Jean (88, Fairfield).
- Margaret's info sections (Description, Habits, Medical history) with the design text; documents Care plan.pdf, Medication schedule.pdf, Physio referral.pdf, Exercise plan.pdf, Medication chart.pdf (placeholder PDFs).
- Events around reference date Mon 30 Nov 2026: Morning medication 09:00 1 hr (daily per calendar), Physiotherapy 11:30 1 hr 30 min (Mon, Fri), Afternoon check-in 15:00 1 hr, Wound dressing check 10:00, Weekly weigh-in 09:30, Medication review 14:00, Evening medication; completions/overdue states matching Family Home, Task log and Admin Home.
- Budgets: NDIS $24,000 / $9,120 used; Fixed $5,000 / $2,250; Government $3,000 / $2,760; fund history 3 Nov 2026 +$6,000 'NDIS quarterly plan top-up', 15 Oct 2026 +$1,000 'Fixed funding top-up', 1 Oct 2026 +$750 'Government subsidy payment'.
- Shifts for Aisha (including 11:30–13:00 with Margaret used by the conflict warning) and Daniel K.
- Test users with known local-only passwords; seed guarded so it never runs outside local/test.

## Out of Scope
- Production data
- Client-supplied Care Need Items (import later when received)

## Functional Requirements
- `supabase db reset` produces identical data each run.

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-11 (Care events, occurrence overrides and append-only completions), F0-12 (Budget buckets, fund top-ups, spending and summary calculation), F0-13 (Client document storage), F0-10 (Shifts schema, active-shift function and conflict query)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-22, OQ-29

## Inputs
- None

## Outputs
- supabase/seed.sql or scripts/seed.ts
- docs/SEED_DATA.md

## Error / Edge Cases
- Fund history totals do not equal bucket totals in the design (history is partial) → seed an opening balance entry so totals match (record in DECISIONS).

## Security / Permissions
- Seed passwords documented as local-only; seed script refuses to run when NODE_ENV=production or against a non-local Supabase URL.

## Technical Considerations
- Fixed UUIDs for key entities so tests can reference them.

## Traceability
- Product requirements: REQ-N9 (Maintainable with comprehensive plain-English handover documentation.)
- Sources: UI-§8 Content register; UI-§5.4 reference date Monday 30 November 2026; Design: all screens (names, figures, events); BRIEF (client will supply real sample Care Need Items — not yet received)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
