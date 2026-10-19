# Decisions — F0-29 Tags on events and documents

## Open decisions affecting this feature
None.

## Feature decisions log

### FD-01 — Human answers (CHG-064)
- Date: 2026-10-19
- Decision: tags are per client and free text; only the family adds or changes them (carers see and filter); documents carry their own tags, not their event's; the filter goes on the Task log and the Documents page for Family and Carer. Calendar filtering is parked (PL-28, the human accepted the recommendation).

### FD-02 — Three tables, written only through family-only functions
- Date: 2026-10-19
- Decision: `client_tags` (the client's list) plus link tables `care_event_tags` and `document_tags`, each with its own `client_id` so RLS and the audit trigger read it directly. No write grants; `set_event_tags` / `set_document_tags` (SECURITY DEFINER, `is_family_of`) replace an item's whole set in one transaction and add new names to the list (the `save_client_details` pattern, F0-28 FD-01).
- Alternatives: a `text[]` column on `care_events` and `documents` (rejected: `documents` allows updating `detached_at` only, a carer on shift may update `care_events` and RLS cannot limit columns, and a shared list for suggestions would still be needed); insert/delete policies for families (rejected: the function keeps the item's and the tag's client the same without a trigger).

### FD-03 — Event tags saved by `createEvent` / `updateEvent`, like cost
- Date: 2026-10-19
- Decision: optional `tags` on both actions, saved through `set_event_tags` after the event, as FAM-11 saves cost through `set_event_cost`. Absent means unchanged, which is what the carer form sends (AC-04). One pattern per problem.

### FD-04 — Task log tag filter at the event level
- Date: 2026-10-19
- Decision: `getTaskLog({ tag })` first finds the client's events with that tag, then reads the log over only those events, so paging and totals stay exact over the whole history (CHG-005). Tag names match in any case.

### FD-05 — Tags kept out of `CareEvent` and `ClientDocument`
- Date: 2026-10-19
- Decision: tags come from their own contract functions (`getEventTags`, `getEventTagsByClient`, `getDocumentTagsByClient`) instead of new fields on existing domain types, so existing reads and their tests are unchanged.

### FD-06 — Cross-lane edits kept in this PR
- Date: 2026-10-19
- Decision: `src/features/family-event-form/`, `src/features/family-task-log/`, `src/features/client-documents/` and their Family and Carer routes are edited here so one PR ships the feature (precedent: CHG-058, CHG-061, CHG-063).

### FD-07 — Four Task log page tests now expect tags after the task title (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-19
- Tests: `src/app/(family)/family/[clientId]/tasks/page.test.tsx` — `[FAM-UI-07][AC-01]`, `[FAM-UI-07][AC-02]`, `[FAM-14][AC-01]`, `[FAM-14][AC-02]`.
- Before: the TASK cell's text was the title only, e.g. "Medication review".
- After: the TASK cell's text is the title followed by the event's tags, e.g. "Medication reviewDoctorsMedication", because the mock fixtures now tag Morning medication, Physiotherapy and Medication review, and AC-08 puts tags under the title.
- Reason: recorded requirement change (CHG-064, AC-08). Only the expected strings changed; no assertion was removed or weakened.

### FD-08 — Own pgTAP check corrected before the feature finished
- Date: 2026-10-20
- Test: `supabase/tests/tags.test.sql`, "[F0-29][AC-05] refused calls added no tags".
- Before: counted every `client_tags` row (want 3). After: counts only the test's two clients.
- Reason: genuine test bug. The local database also holds the seed's three tags for the demo client, so it saw 6. The refusals themselves were already checked separately. This is a new test in this branch; no existing test changed.

### FD-09 — Edit tags dialog reuses the kit `ConfirmationModal`
- Date: 2026-10-20
- Decision: the dialog uses `ConfirmationModal` (focus trap, Escape, focus return) rather than a second dialog pattern. That modal always shows a warning triangle beside the title, which suits a confirmation better than an edit. Left as is and flagged for human review; an optional icon prop on the kit modal would be a small shared change.
