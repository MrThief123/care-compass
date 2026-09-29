# Acceptance Criteria — CAR-03 Carer — Patients

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md. Rewritten 2026-09-29 before implementation (FD-01, FD-02).

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha has a shift that has not ended with each of Margaret Doyle, Robert Hale, Elsie Marsh, Frank Novak, Doris Petrov, Harold Byrne and Jean Ahmed, when Patients loads, then 7 cards are shown, soonest shift first, each with the full name, and Margaret's reads 'Margaret Doyle' and '78 years · Preston VIC'. | NOT MET |
| AC-02 | US-01 | happy | Given search 'Els' (the URL's `?q=`), when Patients loads or the search is submitted, then only Elsie Marsh is shown; the match is case-insensitive, ignores padding, and also finds her by 'marsh'. | NOT MET |
| AC-03 | US-01 | empty | Given no shifts that have not ended and no search, when Patients renders, then 'No patients assigned yet' is shown and there is no search box. | NOT MET |
| AC-04 | US-01 | permission | Given a client in Aisha's organisation with no shift with her, and a client of another organisation, when Patients loads (with or without a search naming them), then neither is present. | NOT MET |
| AC-05 | US-01 | boundary | Given a client whose only shift with Aisha has ended or was cancelled, then they are absent; given a future shift only, then they are present and not on shift; given a shift in progress, then only that client is on shift; given two shifts with one client, then there is one card. | NOT MET |
| AC-06 | US-01 | empty | Given a search with no match, when Patients renders, then no cards are shown, 'No matches for "<q>".' is shown and the search box stays. | NOT MET |
| AC-07 | US-01 | error | Given the contract rejects, when Patients loads, then the error state is shown and nothing logged or thrown names a client or carer. | NOT MET |
| AC-08 | US-01 | happy | Given the carer types 'Els', when typing pauses (or Enter is pressed), then the URL becomes `/carer/patients?q=Els`; clearing the box removes `q`; the box opens holding the URL's `q`. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
