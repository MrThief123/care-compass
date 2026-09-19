# Decisions — FAM-UI-07 Family Task log and Task detail screens (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

Status verified against root `DECISIONS.md` on 2026-09-19 (`grep -n "OQ-xx" DECISIONS.md`).

| ID | Decision needed | Blocking? | Root status | What this feature applied |
|---|---|---|---|---|
| OQ-29 | Which nurse is shown on an event | no | ANSWERED (PD-055) | Recorded answer: assignee derived from the covering shift while Planned/Overdue, `—` if none, the actor once Done. See FD-05. |
| OQ-31 | Task log range | no | OPEN | Proposed default: occurrences up to end of today, newest first. Newest-first applied; the "up to end of today" bound is left to the contract. See FD-06. |
| OQ-39 | Design copy and visual inconsistencies | no | OPEN | Not listed in this PRD but it names two Task log items (misaligned Nurse column, status filter as a dropdown). Proposed default "follow tokens and UI-§5 rules" applied. See FD-07. |
| OQ-19 | Figma access and remaining design gaps | — | ANSWERED (PD-052) | Controls and states with no design are built from Foundations tokens and existing patterns and flagged "design gap, built from tokens — please review" (PD-052). See FD-08. |

## Feature decisions log

### FD-01 — Staff names shown in full ("Aisha Rahman"), not "Aisha R." (PD-038)
- Date: 2026-09-19
- Context: this feature's PRD Scope, ACCEPTANCE_CRITERIA.md AC-01/AC-04 and TEST_PLAN.md T-01/T-04 were drafted against the "Aisha R." abbreviation in the design mockups. Root `DECISIONS.md` PD-038 (answering OQ-13, CONFIRMED 2026-09-17 by Dhruv Verma) decided staff names are displayed in full everywhere and names "Task log, Task detail assignee" explicitly. Precedent: UI-00 FD-01 and F0-14 FD-02 made the identical change.
- Decision: the nurse column, the Done pill and the detail subline show the full name via `displayName()` (e.g. "Aisha Rahman"). AC-01 and AC-04 (and T-01/T-04) wording updated to match. PRD.md Scope prose ("Assigned to Aisha R.") is left untouched as stale example text, as the precedent did.
- Reason: PD-038 is a human-confirmed decision and CLAUDE.md §9 allows a controlled document to change to record an answered decision. Shipping "Aisha R." would knowingly contradict it.
- Alternatives considered: build the abbreviation exactly as the AC was worded (rejected: contradicts PD-038); pause the feature (rejected: the answer is already on record).
- Consequences: the design PNGs still show "Aisha R." — the design owner needs a copy update (PD-038 already says so).
- Human confirmation required: yes. **HUMAN REVIEW: AC wording changed** (AC-01, AC-04 and their TEST_PLAN rows); flag again in the PR.
- Test changes caused: none. The tests were written after PD-038 was read, so no existing assertion was changed.

### FD-02 — Shared mock fixtures do not hold the design's Task log data; ACs 01, 02 and 04 are BLOCKED at screen level
- Date: 2026-09-19
- Context: `getTaskLog("client-margaret")` on the shared fixtures (`src/mocks/fixtures.ts`, UI-00) returns three occurrences, all on 30 Nov: Morning medication (Done, Aisha Rahman, `completedAt` 09:05), Collect prescription (Overdue), Afternoon walk (Planned, Sarah Nguyen). The design and the ACs need nine rows over 26–30 Nov (Physiotherapy, Afternoon check-in, Evening medication, Weekly weigh-in, Medication review, Wound dressing check…), Overdue = Weekly weigh-in + Medication review, "Completed at 09:14", a different Morning medication description, and a "Medication chart.pdf" document on that task. `DOCUMENTS` holds only "Care plan 2026.pdf", linked to no event. UI-00's PRD says the fixtures match the design; they do not. `src/mocks/**` is outside lane F.
- Decision: did not edit `src/mocks/**`. The view components take their rows as props, so their tests feed them `src/features/family-task-log/design-fixtures.ts` (test-support data that mirrors the two design PNGs). The route-page tests use the real mock contract and assert data-driven ("one row per occurrence `getTaskLog` returns"), so they stay green when the fixtures are extended.
- Reason: faking the data inside `src/app` or `src/features` would break the "screens read data only through `src/server/**`" rule and would be dishonest about what the running screen shows.
- Alternatives considered: extend the shared fixtures myself (rejected: not my lane, and FAM-UI-01 Home needs the same rows so it should be one shared change); weaken the ACs to fit 3 rows (rejected: ACs are controlled).
- Consequences: AC-03 is MET on both the component and the real contract. AC-01, AC-02 and AC-04 are proven at component level with design-matching rows but **BLOCKED** at screen level: with today's shared fixtures the Task log shows 3 rows, the Overdue filter shows "Collect prescription", and the Morning medication detail says "Completed at 09:05". No code change is needed here once the fixtures are extended (suggested rows: see `design-fixtures.ts`); re-run and flip the statuses.
- Human confirmation required: yes (lane S / UI-00 owner to extend `src/mocks/fixtures.ts`).
- Test changes caused: none.

### FD-03 — No single-occurrence contract function: Task detail is derived from `getTaskLog`
- Date: 2026-09-19
- Context: the Task detail needs one occurrence by `key`. Existing contract functions are `getTodayOccurrences`, `getTaskLog(clientId, {q, status, page})`, `setOccurrenceDone`. There is no `getOccurrence`.
- Decision: `src/features/family-task-detail/find-occurrence.ts` pages through `getTaskLog(clientId, { page })` until it finds the key (stops at the last page or an empty page) and the route calls `notFound()` when it is absent. I did not add a function to `src/server/**`.
- Reason: honest and correct for Phase 1, where the fixtures fit on one page.
- Consequences: correct only for occurrences inside the Task log's range and page size. An occurrence outside it (a future one reached from the Calendar, or beyond OQ-31's "up to end of today") would 404 even though it exists. **Request (lane B / shared):** add `getOccurrence(clientId, key): Promise<Occurrence | undefined>` to `src/server/events/queries.ts` plus its mock; FAM-15 (Task detail wiring) then replaces `findOccurrence` with it.
- Human confirmation required: yes (contract owner).
- Test changes caused: none.

### FD-04 — No documents contract function: the Documents card shows its empty state
- Date: 2026-09-19
- Context: the Documents card needs the documents attached to the task's event. `DocumentRef` has an optional `eventId`, but no `src/server/documents` (or any) contract function returns documents, and the shared fixtures link none to an event.
- Decision: `TaskDetailView` takes a `documents` prop (renders a tile each, read-only) and the route passes `[]`, so the card shows "No documents attached." The filled state is covered by component tests.
- Reason: no data source to read; inventing one in the screen is not allowed.
- Consequences: the design's "Medication chart.pdf" tile cannot appear on the running screen until a contract exists. **Request (lane B / shared):** `getEventDocuments(eventId)` (or `getDocuments(clientId, { eventId })`) and a fixture document linked to `event-margaret-morning-meds`. Opening a document (signed URL) is Phase 3 (F0-13), so tiles are not clickable here.
- Human confirmation required: yes (contract owner).
- Test changes caused: none.

### FD-05 — OQ-29 (ANSWERED, PD-055) applied: which nurse is shown
- Date: 2026-09-19
- Decision: `occurrenceNurse()` returns the actor's full name once Done (falling back to the assignee, then `—`), the shift-derived assignee otherwise, and `—` when there is none. Used by the NURSE column, the Done pill and "Assigned to …" on the detail.
- Consequences: for a Done task completed by someone other than the assignee, the detail reads "Assigned to <actor>", as PD-055 says (show the actor, not the derived assignee). Tell the design owner if that wording should change.
- Human confirmation required: no (follows the recorded answer).

### FD-06 — OQ-31 (OPEN) proposed default applied in part: newest first, range left to the contract
- Date: 2026-09-19
- Decision: the view orders rows newest Melbourne day first with a stable sort, so rows keep the contract's order within a day. It applies no "up to end of today" cut-off.
- Reason: the design and AC-01 put Morning medication (09:00) first on Mon 30 Nov and the design's within-day order follows no time rule (Sun 29: Evening medication then Weekly weigh-in; Mon 30: 09:00, 11:30, 15:00), so day-level ordering is the most that can be justified. A clock-based cut-off would empty the screen, because the fixtures' reference date (30 Nov 2026) is deliberately not "now" (the layout header itself shows the real date). The range is a query concern for FAM-14 wiring.
- Human confirmation required: no (non-blocking, default applied; confirm when OQ-31 is closed).

### FD-07 — OQ-39 (OPEN) applied: aligned NURSE column, status filter stays a dropdown
- Date: 2026-09-19
- Decision: the log is a real table, so NURSE and STATUS align on every row (the design image misaligns them on Planned rows; OQ-39 lists this). The Status filter is a select, as designed and as the PRD says, although the design brief prefers chips (OQ-39).
- Human confirmation required: no (non-blocking).

### FD-08 — Design gap, built from tokens — please review (PD-052)
- Date: 2026-09-19
- Context: the designs cover the populated Task log and Task detail only. The States sheet is not in `docs/design/screens/`, and the Phase 3 PRDs describe its skeleton only as "list rows with avatar; card grid".
- Decision: built from Foundations tokens and existing app patterns, each flagged **design gap, built from tokens — please review**:
  - Task log loading skeleton: real title, placeholder search and select, six kit `ListRowSkeleton` rows in a card.
  - Task detail loading skeleton: placeholder heading block and three stacked kit `CardGridSkeleton` cards.
  - Task log empty state "No tasks yet / Tasks will appear here once care events are scheduled." (copy PROPOSED).
  - Task log no-results state "No tasks found / Try a different search or choose another status." (copy PROPOSED). The kit `SearchField` shows `No matches for "…".` (AC-03) once, above it, so the copy is not repeated (OQ-39 notes the States sheet repeats it).
  - Task detail not-found page "Task not found / We couldn't find that task. It may have been removed." with a Back link (copy PROPOSED).
  - Task detail for a task with no shift cover: "Assigned to —" (PD-055 says show `—`); for no documents: "No documents attached.".
  - A visually hidden `role="status"` line "Showing N of M tasks" so filter results are announced (WCAG 4.1.3).
  - The Edit link on Task detail goes to `/family/[clientId]/events/[eventId]/edit` with no occurrence parameter. Whether the edit screen needs the occurrence (for "this occurrence only" scope, PD-046) is FAM-UI-03 / FAM-07's call.
- Human confirmation required: yes (design owner sanity-check of the copy and skeletons).

### FD-09 — Shared kit and lib gaps found (not edited; workarounds are local)
- Date: 2026-09-19
- Context: CLAUDE.md §4.2 forbids editing `src/components/shared/**`, `src/components/ui/**` and `src/lib/**` from lane F.
- Workarounds kept local, each needing a shared change to remove:
  1. `FileTile` (filled) is a horizontal 44px chip, but both Task detail and Edit event draw a vertical 104px tile (icon above a centred, wrapping name). Local read-only `src/features/family-task-detail/document-tile.tsx`. **Request:** a vertical tile variant in the kit.
  2. `DataTable` has no column-width API, so the TASK column would not take the leftover width. `task-log-view.tsx` targets the columns by position with arbitrary variants (`TABLE_LAYOUT`). **Request:** optional per-column width/alignment on `DataTableColumn`.
  3. No time-of-day formatter in `src/lib/format` ("Completed at 09:14"), and no Melbourne day-key helper. Local `src/features/family-task-log/melbourne-time.ts` (`formatTimeOfDay`, `melbourneDateKey`). **Request:** promote into `src/lib/format`.
  4. `SearchField` has no `aria-label` prop, so the input is named only by its placeholder. Acceptable to axe and browsers, but a label prop would be better.
- Visual differences seen against the design PNGs that come from the kit (left as they are; see the visual check in PROGRESS.md): `SearchField` uses a light border and grey placeholder where the design has a teal border and muted-teal placeholder, and its focus ring is an inner outline on the input; `DataTable` header text is `text-secondary` where the design is muted blue (the design colour, #8DB8C8 on white, is below 4.5:1, so the kit choice is the safer one), has a header underline the design lacks, and pads cells `px-3` so row separators start slightly outside the text; `StatusPill` is 26px tall against about 24px in the design; `Field` puts 4px between label and control where the design has about 8px, so the Status select sits about 4px higher and the table card about 4px higher than drawn.
- Human confirmation required: yes (lane S owner).

### FD-10 — Next.js 16.3 conventions followed; rail and layout untouched
- Date: 2026-09-19
- Decision: read `node_modules/next/dist/docs/01-app` (page, error, loading, not-found, dynamic routes, useRouter) before writing route code. Applied: `params` is a `Promise` and is awaited; `error.tsx` uses the `retry` prop (Next 16 says use `retry()` to re-fetch, `reset()` only to clear the boundary without re-fetching); `loading.tsx` per level; `notFound()` plus a segment `not-found.tsx` (a streamed `notFound()` answers HTTP 200 by design). No conflict with ARCHITECTURE.md §12.5, which asks for `error.tsx` with the ErrorState design.
- Layout: `src/app/(family)/family/[clientId]/layout.tsx` is unchanged. The family rail has no Task log item, so nothing is highlighted on `/tasks`, which matches the design (its rail shows no active item). The Phase 3 PRD's PROPOSED "Home active" would need a change to `nav-config.ts` or the layout, which are not lane F's; raise it with the shared owner if wanted. Seen while checking: the layout header shows the real date (`new Date()`), not the fixtures' reference date, and its client line reads "75 years · Ringwood" against the design's "78 years · Preston VIC" (fixture values); both are outside this feature.
- Human confirmation required: no.

### FD-11 — Tests added or adjusted after implementation began
- Date: 2026-09-19
- `[FAM-UI-07][PRD] clicking the task link does not also trigger the row's own navigation`: after it went green, its click listener moved from `document` to the render container so jsdom does not log "Not implemented: navigation". No assertion changed or removed (TESTING.md §6, infrastructure defect). Not flagged for HUMAN REVIEW.
- Two tests added after a browser check found layout bugs jsdom cannot see, each run red before its fix: nurse name stays on one line so rows stay 50px (`truncate` plus `title`), and the task link is sized to its text so its focus ring does not span the column (`w-fit`). New tests, not changes to existing ones.
- Human confirmation required: no.

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
