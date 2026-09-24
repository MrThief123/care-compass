# Decisions — FAM-UI-04 Family Info screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-38 | Client information fields | no | Build the design for MVP; remaining fields parked (PL-13, PL-22) pending client confirmation. |
| OQ-26 | File upload constraints | no | PDF, JPEG, PNG, HEIC, DOCX up to 20 MB; video excluded for MVP; storage cost documented in handover. |

## Feature decisions log

### FD-01 — The screen is a local composition, not the shared `ClientInfoView`
- Date: 2026-09-25
- Context: the PRD Scope says "`ClientInfoView` with canEdit=true" and "Edit toggles an inline textarea". The shared `ClientInfoView` (`src/components/shared/client-info-view.tsx`) cannot do that: it renders each section body as a `<p>`, and its `onEditSection` callback is the only hook. It also differs from `family-04-info.png`: it has no avatar beside the client summary, it draws Documentation as a bare heading rather than a card, and its `FileTile` is a one-line 44px chip where the design has 104px square tiles with the icon above the name. `src/components/shared/**` is Lane S's folder (CLAUDE.md §4.2).
- Decision: build `src/features/family-info/` as a local composition of kit parts (`CardShell`, `Button`, `Avatar`, `Field`, `EmptyState`, `ErrorState`, `CardGridSkeleton`/`ListRowSkeleton`) and the two square tiles already drawn on Edit event and Task detail. The card structure (`CardShell` `p-4`, `gap-2`, 44px Edit row) is the kit's, and it measures the same as the design. The shared component is not edited and stays for the Carer Info screen to use.
- Reason: CLAUDE.md §4.2 names "build a local wrapper in `src/features/<screen>/`" as the route when a dashboard feature needs something a shared component cannot do.
- Alternatives considered: wait for a shared PR to add inline edit, an avatar and a Documentation card to `ClientInfoView` (slower, and Carer's use of the same component would need to agree); use `ClientInfoView` as is and open the editor in a modal (not what the PRD or the design describes).
- Consequences: a request to move inline edit and the design-matching tiles into the kit is a candidate for a shared PR before FAM-09 wires this screen (three screens now draw the same square document tile).
- Human confirmation required: no (the route is prescribed by CLAUDE.md §4.2). Flag in the PR: the PRD's "`ClientInfoView`" wording is met by composition, not by the shared component.
- Test changes caused: none.

### FD-02 — Contract reads and fixtures added on this branch (CHG-018)
- Date: 2026-09-25
- Context: AC-01 and AC-03 need Margaret's three section texts and two client documents through a `src/server/**` contract (CLAUDE.md §7). None existed: `clients` had only `getClientHeaderSummary`, `documents` only `getEventDocuments`, `DOCUMENTS` held one file (`Care plan 2026.pdf`), and no section fixtures existed. `src/mocks/**` and `src/server/**` are not Lane F's folders.
- Decision: asked the human (stop-and-ask, CLAUDE.md §10). Answer, 2026-09-25: add them on this branch as CHG-018 (root DECISIONS.md), the same route as CHG-008 and CHG-012. Added `getClientInfoSections` and `getClientDocuments`, their mocks and the fixtures.
- Reason: the human's instruction in-session; the alternative was a separate shared PR first.
- Alternatives considered: separate shared PR (slower, screen not previewable end to end until it merges); fixtures inside `src/features/family-info/` (breaks CLAUDE.md §7 and would have to be undone in Phase 3).
- Consequences: see CHG-018 Impact. The notification `notif-aisha-2` still says "Care plan 2026.pdf" while Family · Info now says "Care plan.pdf"; both are as drawn in their designs. Raise with the design owner if the file should carry one name.
- Human confirmation required: yes — given, Dhruv Verma, 2026-09-25 (in-session).
- Test changes caused: none to existing tests. New tests: `src/server/clients/queries.test.ts`, `src/mocks/queries/clients.test.ts`, and additions to `src/server/documents/queries.test.ts`.

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
