# Decisions — UI-04 Screen data contracts and fixtures: full-history Task log, single occurrence, event documents

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-31 | Task log range (is there an "up to end of today" bound?) | no | Proposed default (occurrences up to end of today, newest first) is NOT applied here: the contract returns the whole history, newest first. The fixtures hold nothing after Mon 30 Nov 2026 15:00, so no cut-off is needed for the sample data. Left for FAM-14 wiring and the human. |
| OQ-29 | Which nurse is shown on an event | no | ANSWERED (PD-055). Fixtures carry `assignee` and `actor` as stored data; nothing is derived here. |

Authorisation: root DECISIONS.md CHG-004 (this feature) and CHG-005 (FAM-UI-07 Task log scope), both confirmed by the human in-session on 2026-09-19.

## Feature decisions log

### FD-01 — Feature ID `UI-04`, Lane S, plan card added
- Date: 2026-09-19
- Context: UI-00 names its ID `UI-00` and its tests `[UI-00][AC-xx]`; the next free shared `UI-nn` is `UI-04` (UI-01 to UI-03 are the kits). `scripts/plan-status.mjs` recognises `UI-\d{2}`.
- Decision: the feature is `UI-04`, folder `docs/development/shared/shared-screen-contracts-fixtures/`. A row and a detail card are added to DEVELOPMENT_PLAN.md (Phase 0 table, order 11) under CHG-004.
- Consequences: FAM-UI-01 and FAM-UI-07 PRDs are not edited (family lane); their owners may add UI-04 as a dependency.
- Human confirmation required: no (CHG-004 authorises the plan card).

### FD-02 — `getTaskLog` validates its input with the existing Zod `TaskLogQuerySchema` at the contract boundary
- Date: 2026-09-19
- Context: `TaskLogQuerySchema` already says `page` is a positive integer and `status` is an occurrence status, but the contract never parsed it. The mock treated `page` 0 or -3 as a negative slice offset (rows silently wrong) and 1.5 as a fractional offset.
- Decision: `src/server/events/queries.ts` parses the query with `TaskLogQuerySchema` before delegating, so both data sources get the same rule. Invalid `page` (0, negative, non-integer, NaN, Infinity) or `status` rejects with a `ZodError`. A `page` past the last page is valid and returns an empty page. Screens sanitise URL params first (FAM-UI-07 AC-06) and never pass invalid values.
- Reason: ARCHITECTURE.md §12.4 (Zod at every trust boundary); explicit failure beats silently wrong rows.
- Alternatives considered: clamp to 1 (rejected: hides caller bugs and differs from the schema); throw only in the mock (rejected: Supabase implementation would drift).
- Human confirmation required: no.

### FD-03 — New `EventDocument` type instead of reusing `DocumentRef`
- Date: 2026-09-19
- Context: `DocumentRef` has no MIME type or size and carries a `url`, which cannot exist for a private bucket (documents are opened by short-lived signed URL, F0-13). The consumer tile (`document-tile.tsx` on the FAM-UI-07 branch) needs only a name; F0-13's `documents` table has `filename, mime_type, size_bytes, uploaded_by, uploaded_at, event_id`.
- Decision: add `EventDocumentSchema` `{id, clientId, eventId, name, mimeType, sizeBytes, uploadedAt, uploadedBy?}` (no link). `DocumentRef` is left unchanged, so nothing that builds one is affected.
- Consequences: opening a document (signed URL) remains Phase 3 work (F0-13).
- Human confirmation required: no.

### FD-04 — DESIGN CONFLICT: Home shows 3 overdue items, Task log shows 2. Chose the Task log reading. HUMAN REVIEW.
- Date: 2026-09-19
- Context: `family-01-home.png` lists three overdue items (Wound dressing check Fri 27 Nov, Medication review Sat 28, Weekly weigh-in Sun 29; badge 3). `family-07-task-log.png` shows nine rows in which only Medication review and Weekly weigh-in are Overdue and Wound dressing check appears once, Done, on Thu 26 Nov. Home and the Task log read the same `getTaskLog(..., {status: 'overdue'})`, so one dataset cannot satisfy FAM-UI-01 AC-02 (badge 3) and FAM-UI-07 AC-02 (only two remain).
- Decision: follow the Task log (two overdue). This unblocks FAM-UI-07 AC-01, AC-02 and AC-04, which are BLOCKED on the fixtures, and does not break FAM-UI-01, whose tests use test-local fixtures. Home on the running app therefore shows an Overdue badge of 2 (Medication review, Weekly weigh-in). The former overdue "Collect prescription" is removed.
- Alternatives considered: add an overdue Wound dressing check on Fri 27 Nov (Home exact, Task log shows 3 overdue and a tenth row). To switch, add one done-less occurrence for `event-margaret-wound-dressing` starting 2026-11-27T10:00:00+11:00 with status `overdue`, and update the affected tests.
- Human confirmation required: yes (design owner to say which screen is right).

### FD-05 — Within-day order of the design rows differs from the drawn order on Mon 30 Nov
- Date: 2026-09-19
- Context: the mandated order is strictly newest first by `start`. The design draws Mon 30 Nov as 09:00, 11:30, 15:00 (chronological within the day) although the days run newest first. No time rule reproduces the drawing (Sun 29 draws 18:00 before 09:30).
- Decision: follow the contract rule. Mon 30 Nov reads Afternoon check-in (15:00), Physiotherapy (11:30), Morning medication (09:00). Times on Sat 28 (Medication review 10:00, Physiotherapy 11:30) and Sun 29 (Evening medication 18:00, Weekly weigh-in 09:30) are chosen so the contract order equals the drawn order there, which also makes the Home Recent activity list identical to the design.
- Consequences: FAM-UI-07 AC-01 ("9 rows starting Morning medication") cannot hold literally; page 1 also has 11 older rows and starts with Afternoon check-in. Family owners update their AC wording (CHG-005 already supersedes the client-side ordering).
- Human confirmation required: yes.
