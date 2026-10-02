# Decisions — FAM-08 Family — Event documents (file tiles)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-26 | File upload constraints | YES | PDF, JPEG, PNG, HEIC, DOCX up to 20 MB; video excluded for MVP; storage cost documented in handover. |

## Feature decisions log

### FD-01 — Add event's uploads cannot be linked to the new event on save; Edit event only gets working uploads this PR
- Date: 2026-10-01
- Context: Scope says "Documents attached on save of Add/Edit event," and PRD Error/Edge Cases proposes "Upload then Cancel form → uploaded file remains detached (not linked); confirm." On Add event there is no `eventId` yet when a file is chosen. `documents` (F0-13 migration `20260927020000_documents.sql`) grants `update (detached_at)` only — a client session cannot set `event_id` after the row exists, even via RLS, so a document uploaded during Add event (with `event_id` omitted) can never be linked to the event once it's created; it stays detached permanently, not only on Cancel. Making Add-mode linking work needs a new SECURITY DEFINER function (the established pattern here, e.g. `register_account`) to set `event_id` once, validated server-side — a migration change. `supabase/**` is Lane B-owned (`docs/AGENT_REFERENCE.md`), with no carve-out for dashboard features the way `src/server/<domain>/` has, so FAM-08 cannot make that change itself.
- Decision: Ship real upload/open behaviour for **Edit event** only (where `eventId` is already known, so every upload is correctly linked — this is what AC-01/02/03 and their tests exercise). On **Add event**, the '+ Add file' tile stays present but explains "Save the event first, then open it again to add files." instead of opening the picker, rather than silently creating permanently-orphaned documents.
- Reason: Avoids an unpermitted migration change and avoids shipping a control that looks like it works but produces data that can never be associated with its event. The PRD's own "confirm" flag on the detached-upload edge case suggested this needed a decision, not a guess.
- Alternatives considered: (a) Upload immediately in Add mode with `event_id` omitted, matching the PRD's literal proposed default — rejected because it would always orphan the document, not only on Cancel, silently breaking "Uploaded files linked to event_id and client_id" for every new event. (b) Stage files client-side and upload only after `createEvent` returns a real id — would satisfy Add mode without a migration, but Playwright/manual testing would need a reliable way to upload multiple files before the first network round trip completes; deferred as a follow-up rather than built speculatively since no AC requires it.
- Consequences: FAM-08's Scope line "Documents attached on save of Add/Edit event" is only true for Edit event this PR. A small Lane B follow-up (a `link_document_to_event`-style RPC, or alternative (b) above) is needed before Add event's uploads can work. Resolved 2026-10-02: a new feature, **F0-23** (CHG-045), using the `link_document_to_event` function (option a). FAM-08 itself is unchanged.
- Human confirmation required: yes — HUMAN REVIEW (flagged in PROGRESS.md)
- Test changes caused: none (no existing test asserted Add-mode upload behaviour)

### FD-02 — Fix stale FAM-UI-03 page test broken by this feature's real upload behaviour
- Date: 2026-10-01
- Context: `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.test.tsx`'s pre-existing
  `[FAM-UI-03][PRD] 'Add file' uploads nothing and says so` test predates this feature: it asserted
  the old Phase-1 stub, where clicking the 'Add file' tile itself showed a blocking message. FAM-08
  changed Edit event's 'Add file' tile to open a real hidden file input (`EventDocuments`), so a bare
  click is now a no-op and the test's `within(documents).getByRole("status")` assertion saw empty
  text instead of the expected message — not caught when FAM-08 merged (#184) because this file
  wasn't touched by that PR, and only surfaced later running the suite with `DATA_SOURCE=mock`.
- Decision: Updated the test to actually choose a file via the hidden input
  (`user.upload(screen.getByLabelText("Choose a file to add"), file)`) instead of only clicking the
  tile. That reaches `uploadDocument`, which already returns `"Documents are not available yet."` in
  `DATA_SOURCE=mock` (`src/server/documents/actions.ts`) — so the original assertion and intent are
  preserved, just reached the correct way.
- Reason: Invalid assumption in the old test (clicking alone triggers the message) made stale by a
  genuine, intentional behaviour change in this feature (real file picker instead of a stub). Not a
  requirements change — no AC or PRD text changed.
- Alternatives considered: none — the fix restores the original assertion via the correct interaction.
- Consequences: none; no behaviour changed, only the test's simulated interaction.
- Human confirmation required: no (CLAUDE.md §5 genuine test bug / invalid assumption case)
- Test changes caused: `[FAM-UI-03][PRD] 'Add file' uploads nothing and says so` — before: clicked
  the tile only; after: clicks the tile then chooses a file via the hidden input. Flagged below.

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
