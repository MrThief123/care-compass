# UI-04 — Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

| Field | Value |
|---|---|
| Feature ID | UI-04 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit (late addition, CHG-004) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-screen-contracts-fixtures` |
| Documentation | `docs/development/shared/shared-screen-contracts-fixtures/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D6 |
| Status / owner | See PROGRESS.md |

## Purpose

Let the Family screens work for real users, not only for the sample rows: get the whole Task log, open any task, and see its documents.

## Problem

FAM-UI-01 (Home) and FAM-UI-07 (Task log and detail) found three gaps they cannot fix from their lane (their DECISIONS.md FD-02, FD-03, FD-04, FD-08): `getTaskLog` has no defined order and no bounded behaviour past page one; there is no way to read one occurrence by key, so a task outside the first page cannot be opened; no contract returns documents. The shared fixtures also hold three occurrences for Margaret and do not carry the design's data, so nothing exercises paging, long text or documents.

## Description

Extends the `events` contract, adds a `documents` read contract, and extends the mock fixtures. Screens keep calling `src/server/**` only. Supabase implementations arrive with the Phase 3 wiring features and must match the semantics fixed here.

## User value

A family member can search, filter and page through every task ever recorded, open any of them, and see the documents attached to it. Screen owners can build against data that behaves like a real history.

## Users

- Developers (screen owners); through them, Family users.

## Scope

- `getTaskLog(clientId, {q, status, page})`: results newest first by `start` instant, ties by `key` ascending; `total` is the count after `q` and `status`; page size 20 (`TASK_LOG_PAGE_SIZE`); a page beyond the last returns no items with the right `total` and `page`; `page` (and `status`) validated with the existing Zod `TaskLogQuerySchema`, so 0, negative, non-integer and non-finite values are rejected explicitly.
- `getOccurrence(clientId, key): Promise<Occurrence | undefined>` in `src/server/events/queries.ts`. Past or future; `undefined` for an unknown key or another client's key.
- New domain `src/server/documents/queries.ts`: `getEventDocuments(clientId, eventId): Promise<EventDocument[]>`, plus the Zod `EventDocument` type in `src/types/domain.ts`. Metadata only.
- `src/mocks/**`: mock implementations, and fixtures extended: Margaret's design week (26–30 Nov 2026) exactly as drawn, a deterministic long history generated in code, one ~100-character task title, one ~50-character carer name, documents attached to events (one event with several), a second client's occurrences for isolation tests.
- Tests for all of the above; a fixture-integrity test.

## Out of Scope

- Signed URLs, download, upload, detach (F0-13 and FAM-08).
- Supabase implementations (Phase 3 wiring: FAM-14, FAM-15 and F0-11).
- Any change to `src/app`, `src/features`, `src/components`, `src/lib`, `supabase/`, `src/proxy.ts`, or family feature PRDs.
- Task log range cut-off (OQ-31, OPEN): no "up to end of today" bound is applied.
- Aligning the other six clients' age and suburb with `carer-02-patients.png`, shifts and notifications with the Carer and Admin designs (their lanes).

## Functional Requirements

- Every new or changed function is reachable only through `src/server/**` and delegates by the `DATA_SOURCE` switch; supabase mode throws `notImplementedForSupabase`.
- The mock and any later Supabase implementation share one ordering rule, one page size and one `total` definition.
- Client scoping is structural: a lookup for client A never reads client B's rows.

## UI / UX Requirements

- None (no screens). The fixtures reproduce the design's content: `docs/design/screens/family-01-home.png`, `family-07-task-log.png`, `family-08-task-detail.png`, `family-03-edit-event.png`.

## Dependencies

- Features: UI-00 (Domain types, data-access contracts and design fixtures)
- Blocking open decisions (must be answered before START FEATURE): None (OQ-01 ANSWERED, PD-030). Authorised by CHG-004 and CHG-005.
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-31 (Task log range; not applied here), OQ-29 (ANSWERED, PD-055)

## Inputs

- `docs/design/screens/*.png`; the FAM-UI-01 and FAM-UI-07 branches' DECISIONS.md and test data.

## Outputs

- Contract functions and types; fixtures; tests.

## Error / Edge Cases

- Invalid `page` or `status` rejects (Zod). Empty log: `total` 0, `items: []`. Unknown client: empty log, `getOccurrence` returns `undefined`, no documents.
- Mixed UTC offsets (DST, `Z` strings) sort by instant.

## Security / Permissions

- Synthetic data only (CLAUDE.md §12). No PII in fixtures beyond fictional names. Authorisation stays in RLS (Phase 2/3); the mock enforces client scoping so screens cannot come to depend on cross-client reads.

## Technical Considerations

- The long history is generated from `src/lib/recurrence` (`expandOccurrences`) so it obeys the one-recurrence-engine rule; local wall-clock times are converted to Melbourne ISO strings by a small mock-only helper (the engine leaves that to callers).
- CHG-002: this feature extends (does not recreate) the UI-00 `events` contract and authors the `documents` domain contract from scratch, as a shared (Lane S) PR by human decision (CHG-004).

## Traceability

- Product requirements: REQ-19 (completion history, including temporary staff), REQ-N9
- Sources: Design: family-01-home, family-07-task-log, family-08-task-detail, family-03-edit-event; DECISIONS.md CHG-002, CHG-004, CHG-005, PD-038, PD-055
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels

CONFIRMED (CHG-004, CHG-005 by the human, 2026-09-19). Design conflicts and judgement calls are in DECISIONS.md and flagged HUMAN REVIEW in PROGRESS.md.
