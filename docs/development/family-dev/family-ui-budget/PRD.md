# FAM-UI-05 — Family Budget screen (UI)

| Field | Value |
|---|---|
| Feature ID | FAM-UI-05 |
| Dashboard / stream | Family |
| Phase | Phase 1 — Screens on fixtures (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-ui-budget` |
| Documentation | `docs/development/family-dev/family-ui-budget/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D6 |
| Status / owner | See PROGRESS.md |

## Purpose
Deliver the Family · Budget UI on fixtures.

## Problem
Waiting for the backend delays every visible screen; UI can be built safely against the data contract.

## Description
Builds the Family · Budget screen(s) exactly as designed, using the shared kit and design fixtures via the data contract. No database, no persistence — interactions change local state only.

## User value
A clickable, reviewable screen that matches the design, ready for data wiring in Phase 3.

## Users
- Family

## Scope
- Route `/family/[clientId]/budget` inside the family layout.
- 'Funds by source' card with 'Update' primary button. **CHG-020 (PD-058):** it opens a simple form: bucket, Add or Remove, amount, optional note (dated the reference day). Saving changes local state only: the bucket's figures and a new first History row ("Funds added" / "Funds removed" when the note is blank). A removal larger than the bucket's balance is refused ("Only $X available"). Amount > 0 with at most 2 decimals.
- **CHG-021 (PD-059), replacing the inline form above:** the button reads 'Edit' and opens the **Edit budget** page, route `/family/[clientId]/budget/edit`, with Save and Cancel. On it, in one save: add or remove funds on any bucket (blank amount = no change), rename a bucket, add a bucket (name and starting amount, $0 allowed; NDIS, Fixed and Government offered as name suggestions for each of those kinds the client does not have), and remove a bucket that has nothing spent and no pending costs (otherwise the control is absent and a line says why). One optional note covers the save. A name is required, at most 40 characters, unique for the client ignoring case and surrounding spaces. A save with any wrong field is refused whole, with a message on each field to fix and focus on the first. Cancel or Escape returns to Budget with nothing changed. Save returns to Budget, which shows the new figures and History rows and "Budget updated."; the changes are held in local state across the two pages until reload. History rows: "Funds added" / "Funds removed" (or the note) with the amount; "Bucket added" with the starting amount; "Bucket removed" with minus the money left; a rename adds no row. Family · Home does not see Phase 1 edits.
- **CHG-020 (PD-058):** a bucket with pending costs shows the pending total and count in words on its card; History lists pending items marked "Pending" in text. Fixture data only; settling pending costs is F0-12's.
- **CHG-022 (PD-060):** a "Pending costs" section between the bucket cards and History: one row per unpaid cost (date, bucket, description, amount), oldest first, or "No pending costs." Selecting a History or pending row (click, Enter or Space) opens a details dialog titled with the description: date, bucket, amount, status (Paid, Pending, or "Paid on <date>"), who recorded it, and the save's note when there was one; Close or Escape closes it and focus returns to the row. Rows made on Edit budget read "Recorded by you" and keep the save's note on every row it makes. Adding funds to a bucket pays its pending costs whole, strictly oldest first, stopping at the first the balance cannot cover: each paid cost comes off the bucket's remaining, loses "Pending" in History and leaves the pending section (local state only). History has an 'Export' button that downloads a CSV (`budget-history-<reference day>.csv`: Date, Bucket, Description, Amount, Status, Recorded by, Note), one line per row in the order shown, with text a spreadsheet would read as a formula neutralised; with no rows the button is absent.
- Three `BudgetBucketCard`s (CHG-021: one per bucket the client has, any number, including none).
- History `DataTable`: DATE · DESCRIPTION · AMOUNT.
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Out of Scope
- Real data, permissions and persistence (Phase 3 wiring features)
- Paying pending costs for real (F0-12); CHG-022 simulates it in local state only
- Saving budget edits anywhere (FAM-11); showing Phase 1 edits on Family · Home
- Undesigned flows (listed in DECISIONS.md OQ-19)

## Functional Requirements
- Interactions (ticks, selections, toggles, form input) update local state only and are clearly reset on reload.

## UI / UX Requirements
- Pixel-level match to the design image in `docs/design/screens/`; attach side-by-side screenshot to the PR.

## Dependencies
- Features: F0-15 (Role app shell: rail, header and layouts), UI-03 (Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view)
- Blocking open decisions (must be answered before START FEATURE): None
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-04, OQ-05, OQ-24

## Inputs
- Fixtures

## Outputs
- Screen UI

## Error / Edge Cases
- Very long names/text wrap or truncate without breaking layout.

## Security / Permissions
- Mock role switch available only in development.

## Technical Considerations
- Compose shared kit components; screen-only components in `src/features/<screen>/`. Do not edit `src/components/shared/**` in this feature — request kit changes through a shared PR.

## Traceability
- Product requirements: REQ-02 (Three separate role dashboards — Family, Carer, Admin — each with its own navigation; cont…), REQ-N1 (Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; des…), REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…), REQ-N3 (Visual system follows Figma Foundations tokens, IBM Plex Sans, 88px rail, 76px header, 144…)
- Sources: Design: Family · Budget; UI-D7, D19
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
