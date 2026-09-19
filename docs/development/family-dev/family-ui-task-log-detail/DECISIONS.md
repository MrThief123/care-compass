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
- **Superseded 2026-09-19 by UI-04 (merged into this branch): the shared fixtures now hold the design week, so AC-01, AC-02 and AC-04 are MET on the real contract, and `design-fixtures.ts` is deleted.** Kept below as history.
- Date: 2026-09-19
- Context: `getTaskLog("client-margaret")` on the shared fixtures (`src/mocks/fixtures.ts`, UI-00) returns three occurrences, all on 30 Nov: Morning medication (Done, Aisha Rahman, `completedAt` 09:05), Collect prescription (Overdue), Afternoon walk (Planned, Sarah Nguyen). The design and the ACs need nine rows over 26–30 Nov (Physiotherapy, Afternoon check-in, Evening medication, Weekly weigh-in, Medication review, Wound dressing check…), Overdue = Weekly weigh-in + Medication review, "Completed at 09:14", a different Morning medication description, and a "Medication chart.pdf" document on that task. `DOCUMENTS` holds only "Care plan 2026.pdf", linked to no event. UI-00's PRD says the fixtures match the design; they do not. `src/mocks/**` is outside lane F.
- Decision: did not edit `src/mocks/**`. The view components take their rows as props, so their tests feed them `src/features/family-task-log/design-fixtures.ts` (test-support data that mirrors the two design PNGs). The route-page tests use the real mock contract and assert data-driven ("one row per occurrence `getTaskLog` returns"), so they stay green when the fixtures are extended.
- Reason: faking the data inside `src/app` or `src/features` would break the "screens read data only through `src/server/**`" rule and would be dishonest about what the running screen shows.
- Alternatives considered: extend the shared fixtures myself (rejected: not my lane, and FAM-UI-01 Home needs the same rows so it should be one shared change); weaken the ACs to fit 3 rows (rejected: ACs are controlled).
- Consequences: AC-03 is MET on both the component and the real contract. AC-01, AC-02 and AC-04 are proven at component level with design-matching rows but **BLOCKED** at screen level: with today's shared fixtures the Task log shows 3 rows, the Overdue filter shows "Collect prescription", and the Morning medication detail says "Completed at 09:05". No code change is needed here once the fixtures are extended (suggested rows: see `design-fixtures.ts`); re-run and flip the statuses.
- Human confirmation required: yes (lane S / UI-00 owner to extend `src/mocks/fixtures.ts`).
- Test changes caused: none.

### FD-03 — No single-occurrence contract function: Task detail is derived from `getTaskLog`
- **Superseded 2026-09-19: UI-04 added `getOccurrence`; `findOccurrence` and its tests are deleted (FD-13).** Kept below as history.
- Date: 2026-09-19
- Context: the Task detail needs one occurrence by `key`. Existing contract functions are `getTodayOccurrences`, `getTaskLog(clientId, {q, status, page})`, `setOccurrenceDone`. There is no `getOccurrence`.
- Decision: `src/features/family-task-detail/find-occurrence.ts` pages through `getTaskLog(clientId, { page })` until it finds the key (stops at the last page or an empty page) and the route calls `notFound()` when it is absent. I did not add a function to `src/server/**`.
- Reason: honest and correct for Phase 1, where the fixtures fit on one page.
- Consequences: correct only for occurrences inside the Task log's range and page size. An occurrence outside it (a future one reached from the Calendar, or beyond OQ-31's "up to end of today") would 404 even though it exists. **Request (lane B / shared):** add `getOccurrence(clientId, key): Promise<Occurrence | undefined>` to `src/server/events/queries.ts` plus its mock; FAM-15 (Task detail wiring) then replaces `findOccurrence` with it.
- Human confirmation required: yes (contract owner).
- Test changes caused: none.

### FD-04 — No documents contract function: the Documents card shows its empty state
- **Superseded 2026-09-19: UI-04 added `getEventDocuments`; the Documents card now lists real tiles (FD-13, FD-19).** Kept below as history.
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

### FD-12 — Requirement change CHG-005: the Task log is the full, server-driven history (not client-side over fixtures)
- Date: 2026-09-19
- Context: the PRD Scope line said "Search and filter act on fixtures client-side (server search comes with wiring, D32)". My first pass followed it: the page took one page of `getTaskLog`, then filtered and re-sorted those rows in the browser. With real data that silently shows only the newest page, searches only what is on screen, cannot reach older rows, and cannot open a task that is outside the first page. The human reviewed the hand-back and required the opposite: a real person will use and input into the app, so every screen must work for whatever data builds up, including getting the whole log, searching and filtering the entire history, opening any task (past or future) and seeing its documents. Fixture rows are a stand-in only.
- Decision: recorded as **CHG-005** (being recorded in root `DECISIONS.md` on `feature/shared-screen-contracts-fixtures`; confirmed by the human in-session on 2026-09-19). This feature's PRD Scope and Functional Requirements lines, two AC wordings (AC-02, AC-03) and four added ACs (AC-05 to AC-08) were updated to match; TEST_PLAN.md follows. The behaviour now is:
  - The page reads `searchParams` (a Promise in Next 16.3), validates them with Zod, and calls the existing `getTaskLog(clientId, {q, status, page})`. It honours `total`, `page` and `pageSize` from the result and shows a pager.
  - The URL is the state: `/family/{clientId}/tasks?q=&status=&page=` (shared with Home, do not deviate). Search (debounced, or Enter) and the Status select update it with `router.replace`; changing q or status resets page to 1. Pager links are real links, so Back/Forward, reload and shared links work.
  - Client-side page filtering (`filterTaskLog`) and single-page re-sorting (`sortTaskLog`) are removed. Ordering is the contract's job (the shared branch defines newest first); re-sorting one page can never surface newer rows from other pages.
  - Task detail links carry the validated q/status/page and "Back to Task log" returns to that view. Hrefs are built only from validated values.
- Reason: a screen that only looks right on the sample rows is not fit to use. CLAUDE.md §9 lets a controlled document change through a CHG confirmed by the human.
- Alternatives considered: keep client-side filtering and add paging over the first page only (rejected: still cannot search the history); fetch every page and filter in the browser (rejected: unbounded work for a perpetual log).
- Consequences: tests that asserted client-side filtering or re-sorting are changed or removed (FD-13, **HUMAN REVIEW: test expectation changed**). AC-05 to AC-08 are new (**HUMAN REVIEW: ACs added under CHG-005**). AC-01, AC-02 and AC-04 stay BLOCKED until the shared fixtures land (FD-02).
- Human confirmation required: yes, already given in-session for the requirement (2026-09-19); please confirm the AC additions and FD-13.
- Test changes caused: see FD-13.

### FD-13 — Existing tests whose expectation changed, and tests removed (CHG-005). **HUMAN REVIEW: test expectation changed**
- Date: 2026-09-19
- Context: search, Status and paging moved from the browser to the contract, and UI-04 supplied the real data. Every change below is a recorded requirement change (CLAUDE.md §5); no test was skipped, `.only`-ed or deleted to get green, and each removed assertion has a replacement named here.
- Changes (test, before, after, reason):
  1. `task-log-query.test.ts` (T-06, `filterTaskLog` and `sortTaskLog`): before, client-side title search, status filter and newest-day sort over the rows on screen; after, deleted with the code. Replaced by `load-task-log.test.ts` (search, Status and paging answered by the contract over 137 to 537 rows), `task-log-params.test.ts`, `pagination.test.ts`, and the page tests. Reason: client-side filtering silently covers only one page.
  2. `task-log-view.test.tsx`, `[AC-01] renders 9 rows starting Mon 30 Nov · Morning medication…` and `…lists every design row…`: before, 9 design-fixture rows in the design's drawn order (Morning medication first, then Physiotherapy, Afternoon check-in); after, page 1 of the real contract has 20 rows and starts Afternoon check-in, Physiotherapy, Morning medication, and the nine design-week rows come first in strict newest-first order. Reason: UI-04 FD-05 (the mandated order reverses the drawn order on Mon 30 Nov). Flagged with AC-01's rewording.
  3. `[AC-01] orders rows newest day first whatever order they arrive in (OQ-31 default)`: before, asserted the browser re-sorts a page; after, `keeps the order the contract returned and never re-sorts a page` asserts the opposite. Reason: re-sorting one page can never surface rows from other pages; ordering is the contract's job.
  4. `[AC-02] shows only Weekly weigh-in and Medication review… when Status is Overdue` and `shows the planned rows…`: before, chose the option and the rows filtered locally; after, `?status=overdue` rendered from the real contract shows the same two rows, and choosing a Status now asserts the URL (`router.replace`, page reset). Reason: filtering is server-side.
  5. `[AC-03] shows 'No matches for "Zoe"'` (typed), `matches task titles case-insensitively and combines…`, `brings every row back when the search is cleared`: before, typing filtered rows locally; after, `?q=Zoe` from the real contract shows the message, typing sends the search to the URL after a pause or Enter, and Clear removes q from the URL. Case-insensitive matching is the contract's (UI-04 tests). Reason: search is server-side.
  6. `[PRD] announces how many tasks are shown…`: before, "Showing 9 of 9 tasks"; after, "Showing 21-40 of 537 tasks" and "No tasks to show". Reason: paging.
  7. `[PRD] shows a no-tasks-found state when the status filter alone matches nothing`: before, produced by choosing a status; after, by `params.status` with a zero total. Same assertion text.
  8. `task-log-view.test.tsx` `[PRD] renders a very long task title in full`: before, one 245-character title; after, 120-character titles, 60-character names and non-ASCII text at volume. Strengthened, nothing removed.
  9. `find-occurrence.test.ts` (T-11): deleted with `findOccurrence`; replaced by `[occurrenceKey]/page.test.tsx` and `page.edge.test.tsx` (every one of the 137 tasks opens, the oldest row opens, a future task opens without the log, an unknown or other client's key is 404).
  10. `[occurrenceKey]/page.test.tsx` `shows the Documents card's empty state until a documents contract exists (FD-04)`: before, the Morning medication key expected "No documents attached."; after, it expects "Medication chart.pdf" with "PDF · 82.3 KB", and the empty state is asserted at the Evening medication key (an event with no document). Reason: UI-04 gave that event a document.
  11. `task-detail-view.test.tsx`: documents prop was `{id, name}` fixtures, now `EventDocument` from the real contract; design-fixtures replaced by `getOccurrence` rows. Assertions on Done · Aisha Rahman, Completed at 09:14, Assigned to, cards and axe are unchanged.
  12. `page.test.tsx` (T-12): still one row per occurrence the contract returns, now driven by `searchParams`; `page.error.test.tsx` passes `searchParams`.
  13. `task-log-view.test.tsx` fake-timer tests (mine, same session): first written with plain `vi.useFakeTimers()`, which hangs Testing Library; now `shouldAdvanceTime: true` and a half-debounce "not yet" check. Infrastructure defect, no assertion lost.
- Human confirmation required: yes (flag in the PR).

### FD-14 — This branch depends on unmerged UI-04; PR order
- Date: 2026-09-19
- Decision: `feature/shared-screen-contracts-fixtures` (UI-04, pushed, HEAD 22f84e9, PR to `main` not opened) is merged into this branch (commit 9a2b4c9) because the Task log needs `getTaskLog` paging and ordering, `getOccurrence` and `getEventDocuments`. Until UI-04 reaches `main`, this branch's diff includes UI-04's commits.
- PR order: (1) UI-04 to `main`, (2) `main` synced into `family-dev`, (3) then this feature's PR to `family-dev`. Do not merge this PR first.
- Human confirmation required: yes (sequencing).

### FD-15 — URL params are validated with Zod before the contract is called; a page past the last redirects to the last page
- Date: 2026-09-19
- Decision: `parseTaskLogParams` (Zod) reads `?q=&status=&page=` from the URL: bad or unknown status becomes all statuses; page must be ASCII digits, else 1, clamped to 1,000,000 (a 400-digit page would parse to Infinity); q takes the first of repeated values, drops lone surrogates (they break `encodeURIComponent`), normalises to NFC, turns control characters into spaces, is trimmed and capped at 200 characters (by code points, so an emoji is not split). Only the cleaned values reach `getTaskLog` and every href (`taskLogHref` / `taskDetailHref` re-validate, so a hostile caller cannot echo raw input or change the path; the client id is always one encoded segment).
- Page past the last (`page=99999`, or a shared link after tasks were removed): `loadTaskLog` computes the last page from the contract's `total` and `pageSize` and the page calls Next's `redirect()` (replace, so no history entry) to that page, keeping q and status. Chosen over re-fetching in place because the URL then always names the page shown. An empty result with `page > 1` redirects to page 1.
- Note: `task-log-params.ts` imports `zod` and is also used by the client view, so `zod` is now in the Task log's client chunk (about the same weight forms screens already carry). If bundle size matters, split the pure text helpers from the schema.
- Human confirmation required: no.

### FD-16 — Search interaction: debounce 400 ms, Enter and Clear act at once, the URL is the state
- Date: 2026-09-19
- Decision: typing waits for a 400 ms pause, then `router.replace` (no history entry, `scroll: false`) puts q on page 1; Enter (the field sits in a `form role="search"`) and Clear act at once; the Status select acts at once and carries the text in the box; changing q or status resets page to 1. Pager links are real `Link`s (push, so Back and Forward step through pages). The box follows the URL when it changes underneath (Back, Forward, a link from Home) but ignores the echo of its own search so words typed meanwhile are not overwritten, and a search still waiting when the URL moves elsewhere is cancelled. Next 16.3's router discards a pending navigation when a newer one is dispatched (checked in `app-router-instance.js`), so a stale echo cannot arrive after a newer search. `useTransition` shows the kit search spinner and `aria-busy`; `useOptimistic` keeps the Status select from snapping back.
- Human confirmation required: no (design has no search button; if users need one it is a design change).

### FD-17 — AC-01 reworded (UI-04 FD-05); Home vs Task log overdue count (UI-04 FD-04) noted. **HUMAN REVIEW**
- Date: 2026-09-19
- Decision: AC-01 now reads page 1 newest first, starting Afternoon check-in, Physiotherapy, Morning medication on Mon 30 Nov, with the nine design-week rows first. The design draws Morning medication first; the contract's strict newest-first rule cannot reproduce that, and re-sorting one page in the browser is not allowed (same precedent as PD-038 wording). UI-04 FD-04: Home's design shows 3 overdue, the Task log design 2; UI-04 chose 2, so Home on mock data shows a badge of 2. Human to confirm both.
- Human confirmation required: yes.

### FD-18 — Kit gaps: disposition (FD-08 and FD-09 revisited)
- Date: 2026-09-19
- Fixed locally, done: FD-09 item 1 (vertical document tile, now with type and size), item 2 (column widths via `TABLE_LAYOUT` arbitrary variants; a proper `DataTable` width API remains a nice-to-have, not a defect), item 3 (`melbourne-time.ts`, plus `document-format.ts` for size and type text).
- Improved locally: item 4 (SearchField has no label prop): the field now sits in a `form role="search" aria-label="Search tasks"`, so the landmark is named. The input itself is still named only by its placeholder. It cannot be labelled locally without duplicating the kit's SearchField or writing to its DOM from an effect; both are worse than a one-prop kit change. Request stays open (lane S).
- NOT yet reviewed in this session (context limit): the FD-09 item 5 visual differences (search border and placeholder colour, focus ring, table header colour and underline, row-separator inset, status pill height, 4px label gap) and the kit's 24px Clear-search button (below the 44px target rule). Next session: compare against `docs/design/screens/family-07-task-log.png` in the browser check; for each, apply a className override (SearchField root and `Field` accept `className`; tailwind-merge lets `gap-2` beat `gap-1`) if it is safe and testable, otherwise record the exact reason. FD-08 (design-gap copy and skeletons) is unchanged and still needs design review.
- Human confirmation required: yes (lane S owner for the kit requests).

### FD-19 — Documents: metadata tiles, not links
- Date: 2026-09-19
- Decision: `EventDocument` has no URL, so tiles are information only (no link or button): file name (two lines, `break-all`, full name in `title`), then "PDF · 82.3 KB". `fileTypeLabel` maps common MIME types (PDF, image subtype upper-cased, Word, Excel, Text) and says "File" otherwise; `formatFileSize` uses 1024 units, rounds up across a unit boundary and reads "0 B" for a broken size. A failing `getEventDocuments` rejects to the route's error state rather than claiming there are no documents. Opening a document (signed URL) is Phase 3 (F0-13).
- Human confirmation required: no.

### FD-20 — The Task log uses a local fixed-column table, not the shared `DataTable` (the human's "overlap" bug). Shared follow-up requested. **HUMAN REVIEW: design calls**
- Date: 2026-09-20
- Context: the human, on a screenshot of the Task log at about 630px wide (TASK text over NURSE, status pills past the card's right edge): "Things should fit into their tabs and if too big then should resize or get cutoff rather than overlap." Measured root cause in Chromium (page 1 of Margaret's log, which holds the 102-character title and the 51-character carer name on Wed 25 Nov): the shared `DataTable` is an auto-layout `<table>`, so each column is as wide as its widest cell. The Done pill for the 51-character name is about 430px (`StatusPill`'s label cannot shrink in an auto table, its min-content is the whole text), which set the STATUS column's minimum for every row, squeezed TASK until its text spilled into NURSE, and pushed pills past the card edge. Before (rows of 20 with text overlapping a neighbour / rows with the pill past the card edge / page-level horizontal scroll): 1440 0/0/no; 1100 1/0/no; 1024 18/0/no; 900 1/1/yes (110px); 768 18/1/yes (242px); 633 18/18/yes (377px); 375 18/20/yes (635px). After: see PROGRESS.md "Task A evidence" (0/0/no from 1920 to 375 for this feature; the only page-level scroll left, at 375, comes from the family layout header).
- Decision: CLAUDE.md 4.2 forbids editing `src/components/shared`, so the fix is local: `src/features/family-task-log/task-log-table.tsx`, used by `TaskLogView` instead of `DataTable`. Rows are CSS grids on real `<table>` elements (explicit ARIA roles, because some browsers drop table semantics when `display` changes):
  - Wide (the log at least `@3xl` = 48rem wide, a window of about 920px with the 88px rail): five tracks that do not depend on their content: DATE `7rem`, TASK `minmax(0,1fr)`, NURSE `clamp(9rem,20%,14rem)`, STATUS `clamp(12rem,26%,20rem)`, chevron `2.5rem`. Header and rows share the template, so nothing can widen or squeeze another column, on any data.
  - Narrow: each row is a compact card (about 101px): line 1 the title (two lines at most), line 2 date, a middle dot and the nurse on one truncating line, line 3 the status pill, chevron at the right. Whole-row click and the real link are kept. The switch is a container query on the log itself, not a viewport breakpoint, so it also holds if the rail or padding changes. Breakpoint chosen from the measurements: at 1024 the log is 872px wide and the table fits cleanly; at 920 the TASK column would fall under about 250px.
  - Text: title link `line-clamp-2` plus `[overflow-wrap:anywhere]` (an unbroken 300-character string wraps), full title in `title`; every cell `min-w-0`; nurse `truncate` with `title`; date `whitespace-nowrap`. The pill's wrapper is `min-w-0 max-w-full` with `title="Done · <name>"`, the kit pill's label already truncates with an ellipsis, and `[&>svg]:shrink-0` keeps its check icon full size (it shrank to a speck in Chromium). Truncation is CSS only, so the DOM, and a screen reader, keep the full actor name (no extra sr-only copy is needed); status is still icon plus word, never colour alone. Pill height is unchanged (26 to 28px).
  - One DOM for both layouts: one link and one copy of each title, nothing hidden with `display:none` and nothing doubled for assistive technology. Below the breakpoint the column headings are visually hidden (`sr-only`), not removed, so the table still has headers.
  - The toolbar (search and Status) wraps instead of squeezing: search `flex-[1_1_16rem]`, Status `w-[220px] max-w-full`.
- Alternatives considered: two structures (a table and a card list, one hidden with `display:none` at each width) (rejected: doubles every link and title in the DOM, and jsdom cannot tell which is visible, so tests would prove nothing); an auto-layout table with a `<colgroup>` (rejected: still content-driven); editing the shared `DataTable` (rejected: not lane F's).
- Follow-up request (lane S, shared): the shared `DataTable` should get fixed column widths (per-column width or share), cell overflow handling (min-w-0, truncate or line-clamp, a capped `StatusPill`) and a narrow-screen layout, so the Carer and Admin lists do not repeat this bug. Until then those lists will overlap the same way with long text. This feature does not edit it.
- Consequences: the Task log's table is no longer the kit component (same look at 1024 and wider); rows with a 2-line title are still 50px, cards are taller than table rows. Phone widths remain parked (PL-17); below 768 the log is information-only.
- Human confirmation required: yes (design call: the 48rem container breakpoint, the three-line card, the dot separator, and cutting long names and titles with an ellipsis instead of showing them whole).
- Test changes caused: none to existing tests. New tests: `task-log-table.test.tsx` (14) and three in `task-log-view.test.tsx`, run red first in 77af56f.

### FD-21 — Task detail and the document tile fit at any window width (the human's "overlap" rule, second half of Task A). **HUMAN REVIEW: design call and one test expectation changed**
- Date: 2026-09-20
- Context: the same rule as FD-20 ("Things should fit into their tabs and if too big then should resize or get cutoff rather than overlap"), applied to Task detail. Measured in Chromium against `next dev` (worst-case data through a throwaway preview route, not committed: a 102-character title, a 60-character carer name with no spaces, a 2,000-character description plus an unbroken 300-character string, six documents including a 92-character name and one with no spaces). Before: (a) the document tile was a fixed 104px (`w-26`) with `break-all`, so an ordinary name read "Medication ch / art.pdf" and "Budget spread / sheet 2026....", and the type and size line wrapped ("Excel · 25.0 / GB", "PDF · 1023.4 / KB"); (b) at 375 the "Assigned to <60 characters, no spaces>" line ran past the card edge and the page scrolled 118px sideways (57px is the family layout header, out of scope); (c) the Status pill's check icon shrank to a speck when the pill was cut. No overlap at 1920 to 640; the description and the unbroken 300-character string already wrapped (`break-words`).
- Decision (local files only, `src/features/family-task-detail/`):
  - Documents card: the list is a wrapping grid, `grid-cols-[repeat(auto-fill,minmax(min(10rem,100%),12rem))] gap-3`, so a tile is 160 to 192px wide and never wider (one document does not stretch across the card; `min(10rem,100%)` keeps a tile inside a card narrower than 10rem). Each `li` is `min-w-0`.
  - Tile: `w-full min-w-0` (takes its grid cell; no fixed width), name `line-clamp-2` with `[overflow-wrap:anywhere]` instead of `break-all` (the browser wraps at spaces first and breaks inside a word only when a run of characters has no break point, such as the 92-character no-space name), whole name in `title` and in the DOM; type and size on one line (`truncate`, `title`), file icon `shrink-0`.
  - Header: title and the "Assigned to" line use `[overflow-wrap:anywhere]` (was `break-words` on the title only).
  - Status card: the pill sits in a `min-w-0 max-w-full` wrapper with the whole "Done · <name>" in `title`; the pill gets `min-w-0 [&>svg]:shrink-0` (the same treatment as the Task log table, FD-20). The kit pill's label already truncates with an ellipsis; the text stays in the DOM, so a screen reader reads all of it.
  - Description: `whitespace-pre-line [overflow-wrap:anywhere]` (was `break-words`); never clamped or cut, because a reader must be able to read the whole description.
- Design calls for review (**HUMAN REVIEW: design call**): the tile is 160 to 192px wide where the design draws 104px, because the design shows the name only and this build adds a type and size line ("PDF · 82.3 KB", FD-19) that needs about 100px, and a 104px tile broke ordinary names mid-word; long names are cut at two lines with an ellipsis (the whole name is on hover and in the DOM) instead of shown whole.
- Alternatives considered: keep 104px and drop the type and size line (rejected: FD-19 and the human wanted type and size); wrap at 1fr (rejected: one document would stretch across a 1,200px card); `flex-wrap` with `w-40` (rejected: a grid keeps a tidy column rhythm and `min(10rem,100%)` protects narrow cards).
- Test changed (**HUMAN REVIEW: test expectation changed**): `document-tile.test.tsx` "[FAM-UI-07][PRD] cuts a 92-character name to two lines but keeps the whole name in its title and its text". Before: `expect(label).toHaveClass("break-all")`. After: `expect(label).not.toHaveClass("break-all")` (the two-line clamp, the `title` and the full text are still asserted). Reason: `break-all` is the measured cause of the mid-word breaks; the assertion enforced the bug. No test was skipped, `.only`-ed or deleted.
- New tests, run red first in 6f3d9ac: four in `document-tile.test.tsx` and seven in `task-detail-view.test.tsx` (`[FAM-UI-07][PRD]`): wrapping grid with a 10rem minimum, no `break-all`, `[overflow-wrap:anywhere]` as the last resort, one-line type and size, tile fills its cell, six documents in full, header wrapping, capped pill, 2,000-character description and unbroken 300-character string in full, Back and Edit links kept, axe.
- Human confirmation required: yes (the tile width and the ellipsis on long document names).

### FD-22 — The pager keeps one size for any log length and goes compact (Previous / Page x of y / Next) when the log is narrow. **HUMAN REVIEW: design call**
- Date: 2026-09-20
- Context: the human's rule (FD-20) and "design for 5,000 rows / 250 pages". Measured in Chromium through a throwaway preview route (not committed) at 137 rows (7 pages), 537 (27) and 5,000 (250), on the first, a middle and the last page. Before: from 1920 to 900 one row, 44px tall, controls 44x44 or larger, nothing past the pager's edge, nothing overlapping; at 768 and 640 the summary wrapped above the controls (70px); at 375 the seven numbered slots wrapped onto two rows ("Previous 1 ... 124" over "125 126 ... 250 Next"), so the current page sat on a different line from Previous.
- Decision: `task-log-pager.tsx` only. The window was already seven slots (first, last, the current page and its neighbours, gap markers), so 27 or 250 pages read the same; unchanged. The pager is a size container (`@container`, not a window breakpoint, the same reasoning as FD-20): at least `@md` (28rem, a window of about 585px with the rail and page padding) it is as before, numbers, Previous and Next in a row that wraps if it must; below that the numbered links (wrapped in one `hidden @md:contents` span, so the wide layout is unchanged) give way to a plain 'Page 125 of 250' line between Previous and Next (`@md:hidden`, `flex-1 text-center`), so the three sit on one line and where you are stays visible. Previous and Next never hide, keep their 44px height and minimum width, and keep `rel="prev"` and `rel="next"`. The compact line is text, not a link, and is not `aria-hidden`: it is `display:none` when wide, so a screen reader reads it once, only in the narrow layout; the numbered links are absent from the accessibility tree there (Previous, Next and the position remain).
- Alternatives considered: keep wrapping (rejected: the current page dropped to the second row and the layout changed with each page); a page-number `select` or a jump-to-page box (rejected: new pattern and scope, and the human did not ask); hide Previous/Next text and show only arrows (rejected: unlabelled targets, 44px rule and plain language for readers aged 55 to 80).
- After (real Chromium, 137, 537 and 5,000 rows, first, middle and last page, 1920 to 375): 1 row of controls, 0 controls past the pager's edge, 0 overlaps, smallest control 44x44 (54x44 for Next in the compact layout), no page-level scroll from the pager; nav 44px tall while summary and controls share a row, 70px when they wrap (768 and 640 for long summaries, 375 always). At 375 the row reads "Previous  Page 125 of 250  Next" under the summary. Page-level scroll at 375 is the family layout header (+57px), not this feature.
- Human confirmation required: yes (the compact layout and the 28rem breakpoint).
- Test changes caused: none to existing tests. New tests (run red first in 13a7a40): eight in `task-log-pager.test.tsx` (`[FAM-UI-07][AC-05]` and `[PRD]`): 250 pages in the middle, first and last page, never more than seven slots (7, 27, 250 pages and 100,000 rows), size container, compact line on every page, hidden numbers wrapper, Previous and Next never hidden and still 44px, wrapping controls, axe. Three of them pin behaviour that already held at scale; four failed first.

### FD-23 — Visual polish against the design (FD-18 item 5 and the 24px Clear button): what was changed locally and what was not, with the reason. **HUMAN REVIEW: design fidelity calls**
- Date: 2026-09-20
- Context: FD-09 item 5 and FD-18 listed differences between the built Task log and `docs/design/screens/family-07-task-log.png` (the design is 1440px wide at 1.5x). Compared again in a real browser at 1440 (screenshots of both). Changes below are className overrides only (CLAUDE.md 4.2: `src/components/shared` is not lane F's); each is pinned by a class test and confirmed in Chromium.
- Done (Chromium measurements in brackets):
  1. Search box border is the brand teal, like the design and like the Status select (`SearchField`'s `className` with `[&>div:first-child]:border-border-brand`; computed border rgb(7,114,125) on both).
  2. Clear search is a 44px by 44px target although the kit draws a 24px circle: the wrapper class adds a 44px `::after` (`[&_button]:relative`, `[&_button]:after:absolute`, `[&_button]:after:-inset-2.5`). The circle looks as designed; measured: button 24x24, `::after` 44x44; a click 19px left of the circle's centre and one 20px above it cleared the search, a click 27px to the right did not.
  3. 8px, not 4px, between the 'Status' label and its select (`Field` with `gap-2`; measured 8px), which also puts the select and the table card about 4px lower, as drawn.
  4. Done, Planned and Overdue pills are all 26px tall, as drawn (kit: Done 26px, Planned and Overdue 28px, because only those two have a border): `statusPillClassName(status)` in `status-pill-class.ts` gives every pill `py-[3px]` and the Done pill a transparent border; used by the Task log table and the Task detail Status card. Measured: 26px for all three; rows stay 50px.
  5. No underline under the column headings (the design has none); row separators stay.
- Not changed, with the reason (design owner to review):
  - Placeholder and column-heading colour: the design's muted blue (about #8DB8C8) is about 2:1 on white, below the 4.5:1 that REQ-N2 requires, so the kit's `text-text-secondary` stays.
  - Focus ring: `globals.css` has an unlayered `:focus-visible { outline: 2px solid brand; outline-offset: 2px }` (UI-§5.1) that beats the kit's `outline-none`, so the search input already shows a clear ring (WCAG 2.4.7). A second ring on the box would double it up, so nothing was added.
  - Row-separator inset: the design's separators start at the text's left edge (about 20px from the card edge); ours run from 8px. Insetting the row would also shrink the hover highlight until it touches the text, and a separator-only inset needs a pseudo-element or gradient hack on every row for a 12px difference on a hairline. Left as is.
  - Accessible name for the search input: the input's accessible name today is its placeholder, "Search tasks" (measured in Chromium), the form is a named `search` landmark, and axe is clean. `SearchField` has no label prop, so a real label cannot be given from here. Tried: wrapping the field in a `<label>` with a hidden "Search tasks": with the Clear button showing, Chromium computed the name "Search tasks Clear search", which is worse, so it was not kept. Request for lane S stays open: an `aria-label` (or label) prop on `SearchField`, and a `clearLabel`/size prop so the Clear target needs no override.
- Follow-ups for lane S (shared, not done here): the kit `SearchField` border and Clear-target size, `StatusPill` height with and without a border, `Field` label gap, `DataTable` header underline and colour and the separator inset, plus FD-20's `DataTable` widths and overflow request.
- Human confirmation required: yes (the not-changed items).
- Test changes caused: none to existing tests. New tests (run red first in ae3e25d): `status-pill-class.test.ts` (4), two in `task-log-table.test.tsx`, three in `task-log-view.test.tsx`, one in `task-detail-view.test.tsx`.

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
