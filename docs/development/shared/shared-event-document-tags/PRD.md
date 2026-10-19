# F0-29 — Tags on events and documents (Task log and Documents filters)

| Field | Value |
|---|---|
| Feature ID | F0-29 |
| Dashboard / stream | Shared (Family/Carer event form, Task log, Documents) |
| Phase | Phase 3 — Data wiring & behaviour |
| Development branch (PR target) | `main` |
| Feature branch | `feature/shared-event-document-tags` |
| Documentation | `docs/development/shared/shared-event-document-tags/` |
| Lane | S — Shared |
| Sprint | SPRINT · planned D22 |
| Change | CHG-064 (new requirement, human-approved in-session 2026-10-19) |
| Status / owner | See PROGRESS.md |

## Purpose
Let a family group care by kind ("Doctors", "Medication", "Therapy") and find it again: tag events and documents, then filter the Task log and the Documents page by tag.

## Problem
The Task log can be searched by title and filtered by status only, and the Documents page by file name or event title only. There is no way to see "everything to do with doctors" in one place.

## Description
Each client has its own list of tags, made up by the family as they go. On **Add event** and **Edit event** the family picks tags from that list or types a new one. On the **Documents** page the family tags each document with **Edit tags**. The **Task log** (Family and Carer) gains a **Tag** filter and shows each task's tags; the **Documents** page (Family and Carer) gains a **Tags** column and a **Tag** filter.

## Users
- Family (creates and assigns tags), Carer (assigned: sees tags and filters), Admin (client's organisation: reads through RLS; no admin screen changes)

## Scope
- Tags are per client, free text, made by the family. A tag name is trimmed, inner spaces collapsed, 1–30 characters, no control characters; unique per client in any case (the first spelling saved is kept). At most 10 tags on one event or document.
- Migration (additive): tables `client_tags`, `care_event_tags`, `document_tags`, RLS on in the same migration, audit triggers. Read: `client_tags` and `document_tags` by family, assigned carer and org admin (as documents); `care_event_tags` by whoever can read the client's care events. No insert, update or delete grants: writes go only through `set_event_tags(p_event_id, p_names)` and `set_document_tags(p_document_id, p_names)`, SECURITY DEFINER, family of the client only (`is_family_of`), else 42501; bad names or too many give 22023. Each replaces the item's whole tag set and adds any new name to the client's list.
- Contracts in `src/server/tags/` (mock and Supabase): `getClientTags`, `getEventTags`, `getEventTagsByClient`, `getDocumentTagsByClient`, server action `setDocumentTags`; one Zod schema `TagNamesSchema`. `createEvent` / `updateEvent` take optional `tags` and save them after the event, the way they save cost (FAM-11). `getTaskLog` takes optional `tag`.
- Shared UI in `src/features/tags/`: `TagPicker` (toggle chips + add a tag) and `TagList` (read-only chips).
- Event form (`src/features/family-event-form/`, family pages only): a Tags field.
- Task log (`src/features/family-task-log/`, Family and Carer): Tag select in the URL as `?tag=`, tags shown under each task title.
- Documents (`src/features/client-documents/`, Family and Carer): Tags column, Tag select, and for Family an Edit tags dialog per document.

## Out of Scope
- Filtering the Calendar by tag (parked: PL-28).
- Renaming, deleting or colouring tags; a tag management screen; preset tag lists.
- Carers or admins adding or changing tags.
- Tags on Home, Task detail, Budget or in emails; tagging a document at upload time.
- Choosing more than one tag in a filter (one tag at a time).

## Functional Requirements
- Tag picker: the client's tags as toggle chips (pressed = chosen, shown with a check mark, not by colour alone), a text box and **Add tag** button that adds and chooses a new tag; Enter in the box adds it. Errors: "Tags can be up to 30 characters.", "Up to 10 tags." A name already in the list (any case) chooses that tag instead of adding a second.
- Event form: Tags shown only when the page passes the client's tags (Family Add/Edit event). Carer pages omit it and their saves send no `tags`, so tags stay as they were. If the event saves but its tags do not: "The event was saved, but its tags weren't. Open the event and add them again."
- Task log: **Tag** select ("All tags" + the client's tags, A to Z), shown only when the client has tags or the URL names one. It combines with search and Status, resets to page 1, and runs over the whole history (CHG-005). A `tag` in the URL that is not a valid tag name is ignored; a valid name nobody uses shows "No tasks found".
- Documents: Tags column (chips or "—"). **Tag** select ("All tags" + tags in use), combines with search and the count line ("2 of 5 documents"). Family sees **Edit tags** per row: a dialog with the picker, Save and Cancel. A failed save keeps the dialog open with "Couldn't save the tags. Try again."

## Non-Functional
- No PII in logs or error messages. 44×44px targets. axe clean. Status never by colour alone.

## Dependencies
F0-11 (care events), F0-13 (documents), FAM-06 / FAM-07 (event form), FAM-UI-07 / CAR-06 (Task log), F0-25 (Documents page) — all merged.

## Blocking decisions
None.
