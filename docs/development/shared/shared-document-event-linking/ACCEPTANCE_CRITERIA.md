# Acceptance Criteria — F0-23 Link uploaded documents to a new event

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-02 | happy | Given a document Helen uploaded for Margaret with no event, and an event of Margaret's, when Helen calls `link_document_to_event`, then the document's `event_id` is that event, nothing else on the row changes, and the change is in the audit log. | NOT MET |
| AC-02 | US-02 | permission | Given a user with no access to Margaret's documents (another family, an unassigned carer, an admin of another organisation) or no session, when they call the function, then it raises an error and the document is unchanged. | NOT MET |
| AC-03 | US-02 | edge | Given a document that already has an `event_id`, or has been detached, when the function is called, then it raises an error and the document is unchanged. | NOT MET |
| AC-04 | US-02 | error | Given an event of a different client, or an unknown event or document id, when the function is called, then it raises an error and nothing changes. | NOT MET |
| AC-05 | US-02 | permission | Given a document uploaded by someone else (for example a carer's upload), when a different user with client access calls the function, then it raises an error and the document is unchanged. | NOT MET |
| AC-06 | US-01 | happy | Given the Add event form with two files chosen, when the user saves the event, then `createEvent` runs first, then `linkDocumentsToEvent` with both document ids and the new event id, and the saved event lists both files. | NOT MET |
| AC-07 | US-01 | error | Given the event saves but linking one file fails, when the save completes, then the event exists, a notice names the file that did not attach and says it can be added on Edit event, a Continue link goes back, Save is gone so the event cannot be created twice, and no other file is affected. | NOT MET |
| AC-08 | US-01 | happy | Given Add event before saving, when the user chooses '+ Add file', then the file picker opens and the tile appears after upload, with no "Save the event first" message. Cancel leaves the files as client-level documents. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
