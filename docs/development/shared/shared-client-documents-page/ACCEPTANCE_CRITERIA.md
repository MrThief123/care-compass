# Acceptance Criteria — F0-25 Client Documents page

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the Family rail, then a "Documents" item sits between Info and Calendar and links to `/family/<clientId>/documents`. | MET |
| AC-02 | US-01 | happy | Given a carer's patient profile, then a "Documents" tab follows Info and links to `/carer/patients/<clientId>/documents`. | MET |
| AC-03 | US-01 | happy | Given a client with client-level and event documents, then `getAllClientDocuments` returns both kinds for that client only, newest upload first, with no detached document; an unknown client returns `[]`. | MET |
| AC-04 | US-01 | happy | Given the page, then each document shows its name, type, size, date added (Melbourne time), who added it and, for an event file, the event title. | MET |
| AC-05 | US-02 | happy | Given documents, when the user types in Search, then only those whose name or event title contains the text (case-insensitive, trimmed) remain, and the count is announced. | MET |
| AC-06 | US-02 | happy | Given documents, when the user sorts by Name, Size or Date added and flips the direction, then the order follows (names case-insensitive and numeric-aware; ties by name); the default is Date added, newest first. | MET |
| AC-07 | US-02 | empty | Given a search that matches nothing, then a no-match state with a Clear search action shows, and Download all stays available. | MET |
| AC-08 | US-03 | happy | Given documents, then a "Download all" control shows the total count and points at the zip route for that client. | MET |
| AC-09 | US-03 | happy | Given a signed-in user with access, when the zip route is called, then it returns a .zip containing every non-detached document of the client, with duplicate names made unique. | MET |
| AC-10 | US-03 | permission | Given no session, or a client the user cannot access, when the zip route is called, then no file is returned and nothing about the client is revealed. | MET |
| AC-11 | US-03 | error | Given mock data mode or a storage failure, when the zip route is called, then a plain-language error is returned with no partial file; given more than 300 documents, it refuses with a clear message. | MET |
| AC-12 | US-01 | happy | Given a document row, when the user opens it, then a signed URL opens in a new tab; if that fails, a plain-language message shows. | MET |
| AC-13 | US-01 | permission | Given a carer, then the page works for an assigned patient whether or not they are on shift, an unassigned patient redirects to Patients, and no upload control appears for anyone. | MET |
| AC-14 | US-01 | empty | Given a client with no documents, then an empty state shows and no search, sort or Download all; given a rejected read, an error state shows and the error log names no client data. | MET |
| AC-15 | US-01 | edge | Given the page, then sort and search are labelled, targets are at least 44×44px, a very long file name wraps without overflow, and axe finds no violations. | MET |
| AC-16 | US-01 | edge | Given the existing Family and Carer suites, then they pass unchanged except the recorded nav/tab expectations (DECISIONS FD-06). | MET |

Types: happy · validation · error · permission · empty · edge · security.
