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

### FD-03 — Documentation reuses the square `DocumentTile` and `AddFileTile`, name only
- Date: 2026-09-25
- Context: `family-04-info.png` draws each document as a 104px square tile with the file icon above the name, then a dashed 'Add file' tile. Task detail and Edit event already draw those two tiles. The Info design shows no type or size line, and client documents in the fixtures (CHG-018) carry a name only.
- Decision: reuse `DocumentTile` (Task detail) and `AddFileTile` (Edit event), both in Lane F. `DocumentTile`'s `document` prop is widened to `DocumentTileDocument` (`name` required, `mimeType` and `sizeBytes` optional). The type and size line is drawn only when `showDetails` is set and both are present, so Task detail and Edit event draw as before. The tiles wrap onto further rows; a long name is cut to two lines with the whole name in `title`.
- Reason: one tile per design, not a third copy (FD-01 named this as the candidate for a shared PR).
- Alternatives considered: a private tile in `src/features/family-info/` (a third copy of the same tile); adding fake type and size to the fixtures (invents data the design does not show).
- Consequences: measured against the design at device-pixel level, the tile's border is about 1 CSS px of `bg-muted` (`#8db8c8`), where the design's core is about 2 device px with soft edges. The colour matches; the thickness is slightly lighter. It is left as it is because the tile is shared with Task detail and Edit event. Built from tokens, please review with the design owner.
- Human confirmation required: no for the reuse; yes for the border note (design review).
- Test changes caused: none to existing tests. New: `document-tile.test.tsx` additions (name-only tile).

### FD-04 — Inline edit interaction (PROPOSED in the PRD), and the undesigned parts of it
- Date: 2026-09-25
- Context: the design shows the cards and an 'Edit' text button. It does not show the editing state, Save/Cancel, a blank section or where focus goes. The PRD marks "Edit toggles an inline textarea with Save/Cancel (local state)" as a PROPOSED interaction.
- Decision: each text card edits on its own (`InfoSectionCard`). Edit swaps the text for a textarea holding the current text, with Save (primary) and Cancel (secondary) under it, and the Edit button is not offered a second time while editing. Focus moves into the textarea on Edit and back to Edit on Save or Cancel. Save keeps the words and trims stray space at either end; Cancel restores the original. Saving a blank textarea shows "Nothing added yet." (secondary text) rather than an empty card. The edit lives in local state only and is gone on reload (Phase 1: no persistence; FAM-09 wires it).
- Reason: PRD Scope, the PROPOSED interaction, and the 44px target and focus rules in CLAUDE.md §7.
- Alternatives considered: one shared editor for all three cards (only one card editable at a time, more state, not what the design suggests); a modal (not in the PRD).
- Consequences: the Save/Cancel layout, the blank wording and the focus behaviour are undesigned, built from tokens, please review (OQ-19 design gaps).
- Human confirmation required: yes (design owner), when the PROPOSED interaction is validated in F0-01.
- Test changes caused: none (new tests only).

### FD-05 — 'Add file' does nothing but say so in Phase 1
- Date: 2026-09-25
- Context: uploads are FAM-08 (Phase 3, storage). OQ-26 (file constraints) is non-blocking and its default (PDF, JPEG, PNG, HEIC, DOCX up to 20 MB) is not exercised here because nothing is uploaded.
- Decision: pressing 'Add file' shows "Adding files is not available yet." in a live region that is on the page from the start (so the message is announced) and adds no tile. The tile and the message are absent when `canEdit` is false.
- Reason: a control that silently does nothing fails users; a working upload is out of scope (CLAUDE.md §6).
- Alternatives considered: a disabled tile (CLAUDE.md §7: hide, do not disable); a file picker that adds a fake tile (invents behaviour).
- Consequences: wording is undesigned, built from tokens, please review. FAM-08 replaces the message with the real flow.
- Human confirmation required: no.
- Test changes caused: none.

### FD-06 — Empty, loading and error states
- Date: 2026-09-25
- Context: the PRD asks for a loading skeleton, an empty state and an error state "(States sheet)". The Info screen has no state of its own drawn.
- Decision: loading is the route's `loading.tsx`, a skeleton of the screen's own shape (name line, three text cards, the Documentation card with three tiles) with one labelled status for the whole screen. Empty (no sections and no documents) is one `EmptyState` "No information yet" in a card, with no Edit and no Add file. A rejected contract read shows the shared `ErrorState` with Retry (`router.refresh()`), and logs `[family-info] could not load info data:` plus the error's class only, never its message (ARCHITECTURE.md §12.5, no PII in logs). A client with documents but no text sections still shows the Documentation card.
- Reason: PRD Scope; the same pattern as Family Home.
- Alternatives considered: a per-card skeleton and per-card errors (the three reads are one screen; a partial screen is worse than a clear retry).
- Consequences: the empty-state wording is undesigned, built from tokens, please review.
- Human confirmation required: no for the pattern; wording for design review.
- Test changes caused: none.

### FD-07 — Card padding inside the kit's border; shell differences left alone
- Date: 2026-09-25
- Context: the kit `CardShell` draws a 1px `border-default` hairline (`rounded-card border p-4`); the design's cards have no border. With `p-4` the text cards measured 108px tall against the design's 106px.
- Decision: the Info cards use `p-3.75` (15px) inside the kit's 1px border, so the inset stays 16px and the text cards are 106px tall, with the 10px title-to-content gap the design has. The kit is not edited (Lane S). The visible differences that remain against `family-04-info.png` all sit in the shell, outside this feature: the live date against the design's fixed date, the sign-out icon, the Budget rail icon, and the dev-only overlay badge.
- Reason: matches the design's geometry without editing shared components (CLAUDE.md §4.2).
- Alternatives considered: `p-4` (2px taller per card than the design); editing `CardShell` (not ours).
- Consequences: the hairline is the kit's, not the design's. Built from tokens, please review.
- Human confirmation required: yes (design owner), as part of the kit review.
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
