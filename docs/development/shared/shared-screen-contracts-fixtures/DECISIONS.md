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
- Alternatives considered: add an overdue Wound dressing check on Fri 27 Nov (Home exact, Task log shows 3 overdue and a tenth row). To switch, add one occurrence of `event-margaret-wound-dressing` starting 2026-11-27T10:00:00+11:00 with status `overdue` to `MARGARET_DESIGN_WEEK` in `src/mocks/fixtures.ts`, then update the tests that count the design week, the overdue total and the status split.
- Human confirmation required: yes (design owner to say which screen is right).

### FD-05 — Within-day order of the design rows differs from the drawn order on Mon 30 Nov
- Date: 2026-09-19
- Context: the mandated order is strictly newest first by `start`. The design draws Mon 30 Nov as 09:00, 11:30, 15:00 (chronological within the day) although the days run newest first. No time rule reproduces the drawing (Sun 29 draws 18:00 before 09:30).
- Decision: follow the contract rule. Mon 30 Nov reads Afternoon check-in (15:00), Physiotherapy (11:30), Morning medication (09:00). Times on Sat 28 (Medication review 10:00, Physiotherapy 11:30) and Sun 29 (Evening medication 18:00, Weekly weigh-in 09:30) are chosen so the contract order equals the drawn order there, which also makes the Home Recent activity list identical to the design.
- Consequences: FAM-UI-07 AC-01 ("9 rows starting Morning medication") cannot hold literally; page 1 also has 11 older rows and starts with Afternoon check-in. Family owners update their AC wording (CHG-005 already supersedes the client-side ordering).
- Human confirmation required: yes.

### FD-06 — Existing test expectation changed: Margaret's header (age and suburb). HUMAN REVIEW: test expectation changed.
- Date: 2026-09-19
- Test: `tests/integration/shared-app-shell-clients-contract.test.ts`, "[F0-15] getClientHeaderSummary via the mock data source > returns Margaret's age (computed from dob), suburb and organisation name" (owned by F0-15, merged).
- Before: `age: 75`, `suburb: "Ringwood"`.
- After: `age: 78`, `suburb: "Preston VIC"`.
- Reason: recorded requirement change. `family-01-home.png`, `family-04-info.png`, `family-07-task-log.png`, `family-08-task-detail.png` and `carer-02-patients.png` all read "78 years · Preston VIC · Banksia Home Care"; UI-00 PRD says the fixtures match the design and CHG-004 (human, 2026-09-19) asked for the design match. No other assertion in that file changed (`firstName`, `lastName`, `organisationName`, and the unknown-client throw are as before). Margaret's `dob` moves from 1950-12-05 to 1948-04-12 (78 on the reference date); her `suburb` becomes "Preston VIC" because the shell header prints the suburb field verbatim and the design shows the state in the same string. The proper fix (a separate `state` field) belongs to the clients schema work (F0-06).
- Flagged: yes, HUMAN REVIEW (PROGRESS.md and the PR).

### FD-07 — The long history is generated in code from the one recurrence engine; the design week is hand-written
- Date: 2026-09-19
- Context: the human asked for a deterministic long history (at least 120 completed occurrences before the design week) so the Task log spans 6+ pages and Home's Recent activity has to choose. CLAUDE.md §7: recurrence only via `src/lib/recurrence`.
- Decision: `src/mocks/history.ts` (`generateCompletedHistory`) expands each series with `expandOccurrences` (daily, weekly, fortnightly) from the event's `start` up to an exclusive end (`2026-11-26T00:00`), and writes Melbourne ISO strings through `src/mocks/melbourne-time.ts` (`localToMelbourneIso`, which picks +10:00 or +11:00 from the real Melbourne offset). Carers take turns in a fixed order and completion follows the start by 2 to 18 minutes by a fixed pattern (no clock, no randomness; a test proves a fresh load under another clock with `Math.random` forbidden is identical). Series: Morning medication daily 09:00 from 17 Oct (40), Evening medication daily 18:00 from 17 Oct (40), Physiotherapy Saturdays from 5 Sep (12), Weekly weigh-in Sundays from 6 Sep (12), Wound dressing check Thursdays from 8 Oct (7), Medication review fortnightly Saturdays from 5 Sep (6), and the long-title eye drops task on Wednesdays from 16 Sep (11): 128 rows. With the nine design rows Margaret has 137: pages 1 to 6 hold 20 and page 7 holds 17.
- Consequences: the history ends on Wed 25 Nov, so the design week (Thu 26 to Mon 30 Nov) stays exactly the nine drawn rows; daily events therefore have no rows on 26, 28, 29 Nov. The history crosses the 4 Oct 2026 daylight-saving change (5 Sep to 3 Oct are +10:00). Two natural page boundaries exist for tests: `q` "check" is exactly 20 rows (one full page), `q` "evening" is 41 (two pages and one).
- Human confirmation required: no.

### FD-08 — Long text: a 102-character title and a 51-character carer name; the carer is temporary, not staff
- Date: 2026-09-19
- Decision: one event is titled "Administer prescribed eye drops to both eyes, check for redness or discharge, and record it in the log" (102 characters) and is completed weekly by "Anastasia Wilhelmina Konstantinopoulos-Featherstone" (51 characters), listed in `TEMPORARY_CARERS` in the fixtures. She is a temporary carer (REQ-19 records completion "including temporary staff"), so she is not added to `STAFF_MEMBERS`: the Admin designs show five staff and a sixth would change their counts. The fixture-integrity test accepts an actor that is a staff full name or a listed temporary carer. Both appear on page 1 (Wed 25 Nov 16:30). One attached document has a 92-character file name.
- Human confirmation required: no.

### FD-09 — Shifts, notifications and the other six clients are unchanged; two known wrinkles are left for their lanes
- Date: 2026-09-19
- Context: the brief says to keep other clients, roles, budgets, shifts and notifications valid, and the Carer and Admin fixture-dependent tests must keep passing.
- Decision: no change to `SHIFTS`, `CARER_NOTIFICATIONS`, budgets, roles, staff or the other clients. Only Margaret's `dob` and `suburb` changed (FD-06). Wrinkles, recorded rather than fixed:
  1. The design gives Aisha the 15:00 Afternoon check-in (also in `carer-01-home.png`), but `shift-sarah-margaret-1` (13:00 to 17:00) covers 15:00, so a PD-055 derivation from shifts would name Sarah. The occurrence's `assignee` is stored data and follows the design. Admin/Carer lane to reconcile shifts with the designs.
  2. The other six clients' age and suburb differ from `carer-02-patients.png` (for example Robert reads 81 and Croydon here, 82 and Reservoir VIC in the design). Left alone (scope: Margaret only; Carer lane).
- Human confirmation required: no.

### FD-10 — `getTodayOccurrences` is oldest first on the Melbourne day; client ids such as "constructor" are unknown clients
- Date: 2026-09-19
- Decision: `getTodayOccurrences` now returns the reference day's rows oldest first (ties by key), reading the day in Melbourne time, so a `Z`-suffixed start on the same Melbourne day is included. Audit: the only caller on any branch is FAM-UI-01's `loadFamilyHomeData`, which feeds the DayTimeline (it lays blocks out by time), so nothing depended on the old fixture order. All mock lookups now use own properties only, so a client id that comes from a URL such as "constructor" or "__proto__" is an unknown client (empty log, `undefined` occurrence, no documents) and no longer throws a TypeError.
- Audit of `getTaskLog` callers (on the FAM-UI-01 and FAM-UI-07 branches): Home's Overdue re-sorts oldest first itself and its Recent activity filters and sorts page 1 itself, both compatible with newest first; Home's Overdue badge uses `total`, its list holds page 1 of the overdue rows only. FAM-UI-07 removed its own re-sorting under CHG-005. No caller or test on `main` assumed the old fixture order.
- Human confirmation required: no.

### FD-11 — One of this feature's own new tests corrected after its first run
- Date: 2026-09-19
- Test: `[UI-04][AC-10] the fixture sources never read the clock or a random number` in `src/mocks/fixtures.test.ts`.
- Before: read the source files through `new URL("./x.ts", import.meta.url)`. After: through `path.join(dirname(fileURLToPath(import.meta.url)), file)`.
- Reason: genuine test bug. In the jsdom environment `new URL` is jsdom's class, which Node's `fs` does not accept, so it failed with ENOENT for the wrong reason after the fixtures were done. The assertion is unchanged. Not a change to a pre-existing test.
- Human confirmation required: no.

### FD-12 — The new pure-logic test files run in the node environment
- Date: 2026-09-19
- Context: with the new test files running in jsdom, the plain `npx vitest run` made the existing `tests/integration/mocks-import-boundary.test.ts` "fails lint when a file under src/app imports from src/mocks" (which starts ESLint, 1.4 s alone) exceed the default 5 s timeout under load (7.3 s and 8.5 s in two consecutive full runs), a failure it did not have at baseline (293 of 293).
- Decision: every new test file here starts with `// @vitest-environment node` (the same docblock `tests/integration/shared-supabase-environment.test.ts` uses). They need no DOM. With that the full run is green again (419 tests) apart from the known Supabase environment file, and the whole run is shorter. The boundary test itself is unchanged.
- Note: that boundary test is load-sensitive by nature; if it flakes again, its timeout (not its assertions) is the thing to raise, in a tooling feature.
- Human confirmation required: no.

### FD-13 — Physiotherapy description drops "30-minute"; Collect prescription and Afternoon walk events are kept but start after the reference week
- Date: 2026-09-19
- Decision: `family-03-edit-event.png` describes the Physiotherapy event as a "30-minute mobility and strength session", while Home and Carer Home draw 1 hr 30 min (11:30 to 13:00). The duration follows Home; the description omits the "30-minute" so the two never contradict. The former overdue "Collect prescription" row and the "Afternoon walk" row are removed from Margaret's occurrences (they are in no design and the prescription made a third overdue item), but both events stay in `CARE_EVENTS`, moved to start on Tue 1 Dec and Fri 4 Dec, so no recurrence rule implies a missing Monday 30 Nov row and the automatic-completion example (PD-044, CHG-001) survives.
- Human confirmation required: no.
