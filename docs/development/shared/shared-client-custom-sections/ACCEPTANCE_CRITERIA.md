# Acceptance Criteria — F0-26 Custom sections on Client Details

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a client with custom sections, then Client Details shows them after Medical history and before Documentation, oldest first, each with its title and text ("Nothing added yet." when it has no text). | MET |
| AC-02 | US-01 | happy | Given a user who may write, when they choose Add section, enter a title and text and Save, then the new section appears last, focus moves to its heading, and it is still there after a reload. | MET |
| AC-03 | US-01 | validation | Given the add or edit form, when the title is blank, over 60 characters, or matches another section on the client (including Description, Habits, Medical history or Documentation, any case), or the text is over 5,000 characters, then a message shows under the field and nothing is saved; the draft is kept. | MET |
| AC-04 | US-02 | happy | Given a custom section, when the user chooses Edit, changes the text and Saves, then the new text shows and survives a reload; Cancel restores the saved text. | MET |
| AC-05 | US-02 | happy | Given a custom section in edit mode, when the user changes the title and Saves, then the section shows the new title and survives a reload. | MET |
| AC-06 | US-03 | happy | Given a custom section, when the user chooses Remove section, then an inline confirmation "Remove <title>? Its text will be lost." shows with Remove and Keep; Keep leaves it unchanged; Remove deletes it, focus moves to Add section, and it stays gone after a reload. | MET |
| AC-07 | US-04 | permission | Given Description, Habits and Medical history, then they show no title field, no Remove section and behave exactly as before. | MET |
| AC-08 | US-01 | edge | Given a client with 20 custom sections, then Add section is replaced by a note saying the limit is reached; the server action also refuses a 21st. | MET |
| AC-09 | US-04 | happy | Given the contract, then `getClientCustomSections` returns the client's sections oldest first (mock and Supabase), an unknown client returns `[]`, and `addClientCustomSection`, `updateClientCustomSection` and `removeClientCustomSection` validate input with Zod and return the server's message on refusal. | MET |
| AC-10 | US-04 | security | Given the database, then family, an on-shift carer and an admin (AAL2) of the client's organisation can insert, update and delete; an assigned carer off shift can read but not write; an unlinked family member, an unassigned carer and another organisation's admin can neither read nor write (pgTAP). | MET |
| AC-11 | US-03 | security | Given an add, edit or removal, then an audit row is written, and the removal row holds the old title and text. | MET |
| AC-12 | US-04 | permission | Given a carer on shift, then Add section, Edit and Remove section show; given the same carer off shift, then custom sections with text show read-only, empty ones are hidden, and no controls show. | MET |
| AC-13 | US-04 | happy | Given an admin on a client's Client Details, then custom sections show with Add section, Edit and Remove section. | MET |
| AC-14 | US-02 | error | Given a save the server refuses (for example the shift ended, or the section was removed by someone else), then the server's message shows, the draft is kept, and a removed section is dropped from the list; given a failed page load, the existing error state shows and the log names no client data. | MET |
| AC-15 | US-04 | edge | Given the page, then title and text fields are labelled, targets are at least 44×44px, a long title or text wraps without overflow from 1920 to 768 px, and axe finds no violations. | MET |
| AC-16 | US-04 | edge | Given the existing Family, Carer and Admin Client Details suites, then they pass unchanged. | MET |

Types: happy · validation · error · permission · empty · edge · security.
