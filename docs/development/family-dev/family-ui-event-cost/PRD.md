# FAM-UI-08 — Family event cost fields (UI)

| Field | Value |
|---|---|
| Feature ID | FAM-UI-08 |
| Dashboard / stream | Family |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-ui-event-cost` |
| Documentation | `docs/development/family-dev/family-ui-event-cost/` |
| Lane | F — Family |
| Sprint | SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> Added by **CHG-020** (PD-058, 2026-09-25). Phase 1: fixtures only, no database, no persistence. Saving is wired by FAM-06 / FAM-07 against F0-11 / F0-12.

## Purpose
Let whoever creates an event give it a cost and choose the bucket that pays for it.

## Problem
Care costs money, and the budget only stays true if the cost of each event comes off the right bucket when the care is done (REQ-28, REQ-37). The event form has no place to say what an event costs or who pays for it.

## Description
Two optional fields in the Add / Edit event form built by FAM-UI-03: **Cost** and **Paid from** (bucket). The bucket picker shows each bucket's remaining balance, strikes through a bucket that cannot take new costs, and warns when the balance is below the cost.

## User value
Families and carers record what care costs as they plan it, and never pick a bucket that has nothing left.

## Users
- Family (and, through ADM-11, admins; through CAR-07, carers — both reuse this form)

## Scope
- In the Add event and Edit event forms: an optional **Cost** field (dollars) and a **Paid from** bucket picker listing NDIS, Fixed and Government with each one's remaining balance.
- A bucket whose balance is $0 or that already has pending costs is struck through, cannot be selected, and says "No funds left" in words (not colour alone).
- When the cost is more than a selectable bucket's balance, a warning under the picker says the cost will be held as pending until funds are added; the bucket can still be picked.
- Validation: cost > 0 with at most 2 decimals; a bucket is required once a cost is entered; clearing the cost clears the requirement.
- A recurring event reads "Charged each time it's completed".
- Edit event opens with the event's saved cost and bucket.
- Bucket balances and pending state read only through `src/server/**` contract functions (mock data source).

## Out of Scope
- Saving the cost or bucket, and who may change them after creation (FAM-06, FAM-07, CAR-07)
- Charging on completion and the pending queue (F0-12, CAR-06, FAM-15)
- Showing costs on the Calendar, Care log or Task detail (not requested)

## Functional Requirements
- Cost is optional. With no cost, the event costs nothing and no bucket is needed.
- A change applies to future completions only (PD-058); the form says so on Edit when a cost is already set.

## UI / UX Requirements
- Not in the design. Built from the Figma "01 · Foundations" tokens and the form patterns already in FAM-UI-03, flagged **HUMAN REVIEW** in the PR (PD-052 / OQ-19).
- Struck-through state uses text plus strike-through, never colour alone; white text never on #0C9BA9; 44×44px targets.

## Dependencies
- Features: FAM-UI-03 (Family Add / Edit event screens (UI)), FAM-UI-05 (Family Budget screen (UI))
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-39

## Inputs
- cost, bucket

## Outputs
- Local form state only (Phase 1)

## Error / Edge Cases
- All three buckets struck through: the picker says no bucket has funds and the form cannot be saved with a cost; it can still be saved without one.
- Editing an event whose saved bucket is now struck through: the saved bucket still shows as selected, with the "No funds left" note.

## Security / Permissions
- None in Phase 1 (no auth guards). Permissions to change a cost after creation are enforced in FAM-07 / CAR-07 and F0-12's RLS.

## Technical Considerations
- Extends the FAM-UI-03 form inside `src/features/family-event-form/**`; does not edit the shared UI-02 form kit. If a kit change is needed, record it in DECISIONS.md and stop (CLAUDE.md §4.2).
- The event and budget contracts may need the cost, bucket and pending fields; extend the existing contracts (CHG-002), recorded as a CHG on the branch.

## Traceability
- Product requirements: REQ-37, REQ-28, REQ-N1
- Sources: Human, 2026-09-25 (PD-058, CHG-020)

## Labels
CONFIRMED · PROPOSED · UNKNOWN · AMBIGUOUS — HUMAN DECISION REQUIRED
