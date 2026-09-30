# Acceptance Criteria — CAR-04 Carer — Client info

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md. Rewritten 2026-09-30 before implementation (FD-01 to FD-06).

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha has a shift with Margaret that is not in progress, when Margaret's Info renders, then Description, Habits, Medical history and Documentation are shown, no Edit links or Add file tile exist, and the 'View only' notice is shown. | NOT MET |
| AC-02 | US-01 | happy | Given Aisha is on an active shift for Margaret, when she edits Habits and saves, then the new text is shown, is still shown after a reload, and is recorded as saved by Aisha. | NOT MET |
| AC-03 | US-01 | permission | Given Aisha has no shift in progress for Margaret, when she inserts or updates `client_info_sections`, inserts a `documents` row or uploads to the `client-documents` bucket for Margaret directly, then RLS rejects each; while on shift each is accepted; an admin is still rejected; Aisha can still read. | NOT MET |
| AC-04 | US-01 | permission | Given Aisha has no shift that has not ended with a client (another organisation's, or none of hers), when she opens that client's Info (or any patient URL), then she is redirected to `/carer/patients` and nothing about the client is read. | NOT MET |
| AC-05 | US-01 | error | Given Aisha is editing Habits and her shift ends, when she saves, then 'Your shift has ended, so changes can't be saved.' is shown, her text stays in the box, the saved text is unchanged, and the Edit and Add file controls are gone after the next load. | NOT MET |
| AC-06 | US-01 | validation | Given the text is over 5,000 characters, when she saves, then an error is shown and nothing is saved. | NOT MET |
| AC-07 | US-01 | happy | Given Aisha is on shift, when she adds 'Care plan.pdf' on the Documentation card, then a tile with that name appears; a file type or size that is not allowed shows the upload's error; she has no way to remove a file. | NOT MET |
| AC-08 | US-01 | happy | Given Supabase data, when Info loads, then the sections come in the order Description, Habits, Medical history (a section never written is left out), and Documentation lists the client's own documents oldest first, without event documents or detached ones. | NOT MET |
| AC-09 | US-01 | error | Given a contract function rejects, when Info loads, then the error state is shown and nothing logged or thrown names a client or carer. | NOT MET |
| AC-10 | US-01 | happy | Given a document tile on the Documentation card (on or off shift), when Aisha clicks it, then its signed URL opens in a new tab; if it cannot be opened an inline message shows and no tab stays open; a tile added in this session has no open action. Added by CHG-CAR04-01 (FD-10). | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
