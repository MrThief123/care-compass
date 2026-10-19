# Acceptance Criteria — F0-29 Tags on events and documents

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Family Add event, when the form shows, then a Tags field lists the client's tags as toggle chips and lets her type a new one; when she chooses "Doctors", adds "Dentist" and presses Save event, then the event is saved with both tags and "Dentist" joins the client's tags. | NOT MET |
| AC-02 | US-01 | happy | Given Family Edit event for an event tagged "Doctors", when it opens, then "Doctors" is chosen; when she unchooses it and saves, then the event has no tags. | NOT MET |
| AC-03 | US-01 | validation | Given the tag box, when a name over 30 characters or an 11th tag is added, then a message explains the limit and nothing is added; when a name already in the list is typed in another case, then that tag is chosen and no second one is made. | NOT MET |
| AC-04 | US-01 | permission | Given a carer on shift on Add or Edit event, when the form shows, then there is no Tags field, and saving leaves the event's tags as they were. | NOT MET |
| AC-05 | US-01 | permission | Given a carer, an admin or another client's family member, when they call `set_event_tags` or `set_document_tags` for Margaret's event or document, then it is refused and nothing changes; nobody can insert, update or delete tag rows directly. | NOT MET |
| AC-06 | US-01 | error | Given the event saves but its tags do not, when Save event finishes, then "The event was saved, but its tags weren't. Open the event and add them again." shows. | NOT MET |
| AC-07 | US-02 | happy | Given the Task log (Family or Carer) for a client with tags, when "Doctors" is chosen in Tag, then only tasks of events tagged "Doctors" are listed, across all pages, with the right total; the URL has `tag=Doctors`, page resets to 1, and it combines with search and Status. | NOT MET |
| AC-08 | US-02 | happy | Given the Task log, when it shows a task whose event has tags, then the tags show under the task title. | NOT MET |
| AC-09 | US-02 | edge | Given a `tag` in the URL that is not a valid tag name, when the Task log loads, then it is ignored; given a valid name no event has, then "No tasks found" shows. | NOT MET |
| AC-10 | US-03 | happy | Given the Documents page (Family or Carer), when it loads, then each document shows its tags, and choosing a tag in Tag lists only documents with it, together with the search; the count reads "n of m documents". | NOT MET |
| AC-11 | US-03 | happy | Given Family on Documents, when she presses Edit tags on a document, chooses "Doctors" and presses Save, then the document is saved with that tag and the row shows it; Cancel changes nothing. | NOT MET |
| AC-12 | US-03 | permission | Given a carer on Documents, when the page loads, then tags and the Tag filter show but there is no Edit tags control. | NOT MET |
| AC-13 | US-03 | error | Given the document tag save fails, when Save is pressed, then "Couldn't save the tags. Try again." shows in the dialog and the choice is kept. | NOT MET |
| AC-14 | US-01 | contract | Given `DATA_SOURCE=mock` or `supabase`, when the tag contracts and `getTaskLog({ tag })` are called, then both behave the same, names are validated by one Zod schema, one client's tags never appear for another, and errors name no client. | NOT MET |
| AC-15 | US-02 | regression | Given a client with no tags, when the Task log, Documents page and event form load, then they behave as before, with no Tag select. | NOT MET |
| AC-16 | US-01 | a11y | Given the tag picker, Task log and Documents page, when axe runs, then there are no violations; chosen chips are `aria-pressed` with a check mark (not colour alone) and every control is at least 44×44px. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
