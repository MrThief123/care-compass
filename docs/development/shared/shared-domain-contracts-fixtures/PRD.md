# UI-00 — Domain types, data-access contracts and design fixtures

| Field | Value |
|---|---|
| Feature ID | UI-00 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-domain-contracts-fixtures` |
| Documentation | `docs/development/shared/shared-domain-contracts-fixtures/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D2 |
| Status / owner | See PROGRESS.md |

## Purpose
Create one typed contract between UI and data.

## Problem
UI built before the backend drifts from the data model unless both are built against the same types.

## Description
Defines the data contract every screen uses. Screens call the same query functions before and after wiring; in Phase 1 they return design fixtures, in Phase 3 the Supabase implementation replaces them.

## User value
Lets all three dashboards build real-looking screens in parallel now, and wire data later without rewriting them.

## Users
- Developers

## Scope
- `src/types/domain.ts`: Organisation, Profile (role family|carer|admin), Client, ClientInfoSection, CareEvent, Occurrence {key, eventId, clientId, title, description, start, durationMinutes, status: 'planned'|'done'|'overdue', actor?, assignee?, completedAt?}, Shift, BudgetBucketSummary {kind, label, total, used, remaining, percentUsed, state}, FundEntry, DocumentRef, CarerNotification {source: 'admin'|'family', message, createdAt}, StaffMember.
- `src/server/<domain>/queries.ts` and `actions.ts` exported function signatures for every screen (e.g. `getTodayOccurrences(clientId)`, `getBudgetSummary(clientId)`, `getTaskLog(clientId, {q, status, page})`, `setOccurrenceDone(key)`), each delegating to a data source.
- `src/server/data-source.ts`: selects `mock` or `supabase` implementation via `DATA_SOURCE` env (default `mock` until Phase 3). Mock implementations live in `src/mocks/` and read fixtures.
- `src/mocks/fixtures.ts`: design content at reference date Monday 30 November 2026 (Banksia Home Care; Margaret, Robert, Elsie, Frank, Doris, Harold, Jean; Helen, Michael, Susan, Karen, Tom; Priya; Aisha Rahman, Daniel K., Sarah Nguyen, Marcus Chen, Fatima Ali; events, statuses, budgets, fund history, documents, notifications).
- `src/mocks/current-user.ts`: mock session with role selectable in development only (`?as=family|carer|admin` or cookie); throws in production builds.
- Formatters in `src/lib/format/`: `displayName` ('Aisha Rahman' → 'Aisha R.'), `ageFromDob`, `formatDuration` (90 → '1 hr 30 min'), `formatShortDate` ('Mon 30 Nov'), `formatLongDate` ('Monday 30 November 2026'), `formatMoney` ('$14,880', '+$6,000').

## Out of Scope
- Supabase implementation of the queries (Phase 2/3)
- Database schema (F0-06 onward)

## Functional Requirements
- Every screen feature imports data only through `src/server/**` functions, never from `src/mocks` directly.
- Fixture figures equal the design (e.g. NDIS remaining 14,880 of 24,000, 38% used).

## UI / UX Requirements
- None.

## Dependencies
- Features: F0-02 (Tooling baseline: TypeScript, lint, format, test runners)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-13, OQ-22, OQ-29, OQ-33

## Inputs
- Design images

## Outputs
- Types, contracts, mock data source, formatters

## Error / Edge Cases
- Mock session code imported in a production build → build or runtime error (guard).

## Security / Permissions
- Mock role switching is compiled out or throws when NODE_ENV=production.
- Fixtures contain only fictional data from the designs.

## Technical Considerations
- When Phase 2 changes a type, the contract file is updated in a shared PR and dashboards pick it up from main (daily sync).

## Traceability
- Product requirements: REQ-N9 (Maintainable with comprehensive plain-English handover documentation.), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…)
- Sources: Design: all screens (names, figures, copy); UI-§8 content register; UI-D33 (actor label); ARCHITECTURE.md §3–§7
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
