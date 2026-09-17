# Acceptance Criteria — F0-04 Environment configuration and Supabase integration

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | validation | Given `NEXT_PUBLIC_SUPABASE_URL` is missing, when `env.ts` is loaded, then it throws an error naming `NEXT_PUBLIC_SUPABASE_URL`. | NOT MET |
| AC-02 | US-01 | permission | Given a file outside `src/server/jobs/` imports the service-role client, when lint runs, then lint fails with the restricted-import message. | NOT MET |
| AC-03 | US-01 | happy | Given a signed-in user session cookie, when the server client queries a table, then the query runs with that user's JWT (auth.uid() equals the user id). | NOT MET |
| AC-04 | US-01 | edge | Given a production build, when the client bundle output is searched for the service-role key variable name, then no match is found. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
