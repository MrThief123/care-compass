# Acceptance Criteria — F0-20 Client header wiring and family route guard

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given `DATA_SOURCE=supabase` and a family member linked to Margaret, when `getClientHeaderSummary` runs, then it returns her first and last name, age in whole years (Melbourne), suburb and organisation name. | NOT MET |
| AC-02 | US-01 | edge | Given a client with no organisation, suburb or date of birth, when the summary loads, then those fields are omitted and nothing throws. | NOT MET |
| AC-03 | US-01 | error | Given a malformed id, a client the user cannot read, or a database error, when the summary loads, then it throws a generic error that names no client, id or date of birth. | NOT MET |
| AC-04 | US-01 | error | Given the organisation lookup fails, when the summary loads, then the rest of the header is returned without an organisation name. | NOT MET |
| AC-05 | US-02 | permission | Given Helen (linked to Margaret only), when `assertClientAccess` runs for Robert, then it redirects to her landing path and the client is not read. | NOT MET |
| AC-06 | US-02 | permission | Given a signed-in carer or admin, when they open a family URL, then they go to their own home and no client data call is made (role check runs first). | NOT MET |
| AC-07 | US-02 | edge | Given a family member with no linked client, when they open any client URL, then they go to `/no-client-linked`. | NOT MET |
| AC-08 | US-01 | happy | Given `DATA_SOURCE=mock`, when the family layout renders, then it behaves exactly as before (no redirect, mock header). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
