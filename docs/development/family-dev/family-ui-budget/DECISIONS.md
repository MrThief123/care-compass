# Decisions — FAM-UI-05 Family Budget screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status / default in use |
|---|---|---|---|
| OQ-04 | Funding model: buckets, categories and periods | no | ANSWERED — PD-033 (root DECISIONS.md): three fixed buckets NDIS / Fixed / Government, no categories. The screen draws whatever buckets the contract returns, in the order given. |
| OQ-05 | Who can add funds and record spending; Budget History contents | no | ANSWERED — PD-034 (root DECISIONS.md): Family and organisation admins both edit funds; carers record expenses; History shows top-ups and expenses, each attributed to the actor. The Update flow is undesigned (OQ-19, built by FAM-11). See FD-05 and FD-06 for what this screen does with it. |
| OQ-24 | Undesigned empty states | no | OPEN — the default is in use: the `EmptyState` primitive with proposed copy, flagged for review (FD-07). Not closed by this feature. |

## Feature decisions log

### FD-01 — Bucket cards reuse Home's `BudgetBucketTile`, not the kit `BudgetBucketCard`
- Date: 2026-09-25
- Context: the PRD Scope says "Three `BudgetBucketCard`s". The kit card (`src/components/shared/cards/budget-bucket-card.tsx`) rounds cents away (`formatMoney`), upper-cases the name, lets a long name or amount widen its cell, says nothing to a screen reader about a warning, and shows an overspend as a bare minus sign. Family · Home met the same problems and built `BudgetBucketTile` in Lane F (Home FD-17). `family-06-budget.png` draws the same three cards, with the same values, as Home's budget strip.
- Decision: import `BudgetBucketTile` from `src/features/family-home/budget-bucket-tile.tsx` and lay the cards out the way Home's strip does (`grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]`, so three sit side by side at the design's width and any other number wraps rather than scrolls sideways). The kit card is not edited (`src/components/shared/**` is Lane S's).
- Reason: one tile per design, not a second copy; the tile already carries the icon plus a screen-reader word for warning, alert and exhausted (status never by colour alone), and the cents, long-name and overspend rules. A dashboard feature reusing another Lane F feature's component is the same route Family · Info took with Task detail's `DocumentTile`.
- Alternatives considered: the kit card (breaks the rules above on real data); a private copy in `src/features/family-budget/` (a second copy of the same tile).
- Consequences: the PRD's "`BudgetBucketCard`" wording is met by the local tile, not the shared component; flag it in the PR. Moving the tile into the kit is a candidate for a shared PR before FAM-10 and FAM-03 wire their screens.
- Human confirmation required: no (CLAUDE.md §4.2 prescribes the route).
- Test changes caused: none.

### FD-02 — Contract read and fixtures added on this branch (CHG-019)
- Date: 2026-09-25
- Context: AC-02 and AC-03 need Margaret's fund entries through a `src/server/**` contract (CLAUDE.md §7). None existed: `src/server/budget/queries.ts` had only `getBudgetSummary`, and `FUND_ENTRIES` (two entries: a 1 Nov top-up worded "Quarterly NDIS plan top-up" and a 15 Nov physiotherapy expense) did not match the design, whose first row is 3 Nov 2026. `src/server/**` and `src/mocks/**` are not Lane F's folders.
- Decision: asked the human (stop-and-ask, CLAUDE.md §10). Answer, 2026-09-25: add them on this branch as CHG-019 (root DECISIONS.md), the same route as CHG-008, CHG-012 and CHG-018. Adds `getFundHistory(clientId): Promise<FundEntry[]>` (newest first; `[]` for none or an unknown client), its mock, and `FUND_ENTRIES` reshaped to the design's three rows plus one for Robert.
- Reason: the human's instruction in-session; the alternative was a separate shared PR first.
- Alternatives considered: a separate shared PR (slower, the screen not previewable end to end until it merges); fixtures inside `src/features/family-budget/` (breaks CLAUDE.md §7 and would have to be undone in Phase 3).
- Consequences: see CHG-019 Impact. FAM-10 wires the same function against Supabase.
- Human confirmation required: yes — given, Dhruv Verma, 2026-09-25 (in-session).
- Test changes caused: none to existing test expectations. `src/mocks/fixtures.test.ts` only schema-parses `FUND_ENTRIES` and still passes. New tests: `src/server/budget/queries.test.ts`, `src/mocks/queries/budget.test.ts`.

### FD-03 — History is a local table, not the shared `DataTable`
- Date: 2026-09-25
- Context: the PRD Scope says "History `DataTable`: DATE · DESCRIPTION · AMOUNT". The shared `DataTable` (`src/components/shared/lists/data-table.tsx`) is an auto-layout `<table>` with no control over column widths, so each column is as wide as its widest cell. A long description would squeeze DATE and AMOUNT or push the amount past the card's edge, and the PRD's edge case says "very long names/text wrap or truncate without breaking layout". This is the case Task log FD-20 met.
- Decision: a local table in `src/features/family-budget/` built on the Task log's pattern (container queries, explicit ARIA roles, fixed tracks): DATE and AMOUNT are fixed-width tracks, DESCRIPTION takes the rest (`minmax(0,1fr)`) and is cut to two lines by CSS with the whole text in the DOM and in `title`; the amount is right-aligned and never wraps or loses digits. On a narrow card the row becomes two lines (description, then date and amount). One DOM serves both layouts; the column headings stay in the accessibility tree at any width.
- Reason: a table whose cells have no size limits cannot be made safe from outside, and `src/components/shared` is not Lane F's to edit (CLAUDE.md §4.2).
- Alternatives considered: the shared `DataTable` as is (fails the edge case above); asking for a kit change first (slower, and the Task log already took this route).
- Consequences: the PRD's "`DataTable`" wording is met by composition, not by the shared component; flag it in the PR. A shared responsive table is a candidate for a shared PR (three screens now need one).
- Human confirmation required: no (the route is prescribed by CLAUDE.md §4.2).
- Test changes caused: none.

### FD-04 — Local formatters for the History's date and signed amount
- Date: 2026-09-25
- Context: the design writes dates as "3 Nov 2026" and amounts as "+$6,000". The shared `formatShortDate` has no year and writes September as "Sept"; the kit's `formatMoney` rounds cents away and adds no sign. A `FundEntry.date` is an ISO calendar date (a `date` column), not an instant.
- Decision: `src/features/family-budget/budget-format.ts` holds `formatFundDate` ("2026-11-03" → "3 Nov 2026", three-letter months, so "Sep", never "Sept") and `formatSignedDollars` (a top-up "+$6,000", an expense "-$320", cents only when present, "$0" for nothing). `formatFundDate` reads the date's own year, month and day from the string and builds no `Date`, so no time zone can move it (the Melbourne DST switch on Sunday 4 October 2026 is a test case); a string that is not a real calendar date is returned unchanged rather than shown as "Invalid Date" or rolled into the next month. Dollar amounts reuse Home's `formatDollars`.
- Reason: CLAUDE.md §7 (money `numeric(12,2)`, dates in Australia/Melbourne where they are instants) and the design's wording; `src/lib` is Lane S's, so the shared formatters are not changed (Home FD-13 precedent).
- Alternatives considered: the shared formatters (wrong output, above); `Intl.DateTimeFormat` on a `Date` (a time-zone dependency for a value that has none).
- Consequences: if a shared formatter later gains a year and "Sep", these two can be dropped.
- Human confirmation required: no.
- Test changes caused: none (new tests only: `budget-format.test.ts`).

### FD-05 — History draws date, description and amount only; PD-034's attribution is not drawn
- Date: 2026-09-25
- Context: PD-034 (CONFIRMED 2026-09-17) says "Budget History shows both top-ups and expenses, each attributed to the actor who recorded it". The design (`family-06-budget.png`) and the PRD Scope draw three columns, DATE · DESCRIPTION · AMOUNT, and all three drawn rows are top-ups. The two sources disagree on what a row carries. `FundEntry.recordedBy` exists in the domain type and the fixtures set it.
- Decision: draw what the design and the PRD draw. Every entry is one row of three cells; an expense (a negative amount) reads "-$320" in the same columns, and no "recorded by" text is drawn. The contract already returns `recordedBy`, so nothing has to change in the data when attribution is added.
- Reason: the PRD Scope is controlled (CLAUDE.md §9) and names the three columns; the attribution has no drawn place (an undesigned addition is OQ-19 territory) and the person who records an entry only exists once FAM-11 writes them.
- Alternatives considered: a secondary line under the description, "Recorded by Helen Doyle", drawn when `recordedBy` is present, built from tokens and flagged (OQ-19) — this is the cheapest way to honour PD-034 now; the design's own three rows would then need fixtures without `recordedBy` to stay pixel-identical.
- Consequences: FAM-10 must add the attribution when it wires real data, or the human may choose to add it here first.
- Human confirmation required: **yes — HUMAN DECISION**: keep to the design for now (default in use), or add the "Recorded by" line in this feature. Raised with the human when the tests were handed over.
- Test changes caused: none. A test asserts the three cells only, so it would change with a "yes".

### FD-06 — 'Update' does nothing but say so in Phase 1
- Date: 2026-09-25
- Context: the PRD Scope says "'Update' primary button (no action — flow undesigned)". The flow is FAM-11 (post-sprint); OQ-19 lists it as a design gap. PD-034 says both Family and organisation admins may edit funds, so the button is drawn for a family user.
- Decision: pressing 'Update' shows "Updating funds is not available yet." in a live region that is on the page from the start (so it is announced), and changes nothing: no card, no History row. Same pattern as Family · Info's 'Add file' (Info FD-05). The button is a primary 44px-tall button, as drawn.
- Reason: a control that silently does nothing fails users; a working flow is out of scope (CLAUDE.md §6).
- Alternatives considered: a button with no handler (silent); a disabled button (CLAUDE.md §7: hide, do not disable, and the design draws it enabled); a dialog with a fake form (invents behaviour).
- Consequences: the wording is undesigned, built from tokens, please review (OQ-19 design gap). FAM-11 replaces the message with the real flow.
- Human confirmation required: yes (design owner) for the wording; the human may prefer no message.
- Test changes caused: none.

### FD-07 — Empty, loading and error states, and their copy (OQ-24)
- Date: 2026-09-25
- Context: the PRD Scope asks for a loading skeleton, an empty state and an error state "(States sheet)". The States sheet does not draw a Budget empty state; OQ-24 (undesigned empty states) is open and non-blocking, default "the EmptyState primitive with proposed copy flagged for review".
- Decision: (1) No entries (AC-03): the History card keeps its heading and shows `EmptyState` (icon `dollar`) with "No fund history yet" and "Top-ups and expenses will appear here once funds are added."; no table headings. (2) No buckets: the Funds by source card shows `EmptyState` with the same wording as Home's budget strip ("No funding set up yet"), and 'Update' stays, because adding funds is what starts a budget. The two cards are independent, so either can be empty alone. (3) A contract that rejects: one error state in place of the whole screen ("Something went wrong" with Retry, `router.refresh()`), never half a page; the page logs `[family-budget]` and the error's class only (ARCHITECTURE.md §12.5: no PII). (4) Loading: a skeleton in the screen's own shape (two cards) as one labelled `role="status"`, bars hidden from assistive technology.
- Reason: PRD Scope, OQ-24's default, Info's states as the pattern.
- Alternatives considered: one empty state for the whole screen when both cards are empty (Info does this; here two independent cards read more simply); hiding the History card when empty (the AC asks for an empty state).
- Consequences: "No fund history yet" and its body line are proposed copy, please review; OQ-24 stays open.
- Human confirmation required: yes (copy, OQ-24), flagged in the PR.
- Test changes caused: none.

### FD-08 — The client's name is not repeated in the page body
- Date: 2026-09-25
- Context: the shell header already shows the client (name, age, suburb, organisation), and `family-06-budget.png` draws that header once, above the two cards. Family · Info FD-08 removed a duplicate block for the same reason.
- Decision: the screen draws no client name or summary line and does not read `getClientHeaderSummary`; it reads only `getBudgetSummary` and `getFundHistory`, for the route's client.
- Reason: the design, and no client data read that nothing draws (privacy: read only what is drawn).
- Alternatives considered: none.
- Consequences: none.
- Human confirmation required: no.
- Test changes caused: none.

### FD-09 — A fund entry with no description reads "No description"
- Date: 2026-09-25
- Context: `FundEntry.description` is optional in the domain type. A blank cell in a table row reads as missing data.
- Decision: a row with no description (or one that is only spaces) shows "No description" in the secondary text colour, in the same cell.
- Reason: a row must still say what it is; the type allows it.
- Alternatives considered: an empty cell (looks broken); a dash (read aloud as "dash" or not at all).
- Consequences: wording undesigned, please review with FD-07's copy.
- Human confirmation required: yes (copy), flagged in the PR.
- Test changes caused: none.

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
