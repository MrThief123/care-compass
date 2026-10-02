# Acceptance Criteria — ADM-08 Admin — Manage carer-client assignments

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-02 to AC-07 were added before implementation to record the human's answers on UI location and scope (FD-01, FD-02); AC-01 is unchanged.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha's assignment to Elsie is ended, when Aisha queries Elsie, then zero rows are returned. | NOT MET |
| AC-02 | US-01 | happy | Given Aisha has future, in-progress, finished and already-cancelled shifts with Margaret, and other shifts with Nell (Aisha) and with Margaret (Daniel), when the admin ends Aisha's assignment to Margaret, then Aisha's future shifts with Margaret are cancelled, her in-progress one ends now, the count of shifts changed is returned, and the finished shift, the already-cancelled shift, and every other carer–client pair are unchanged (nothing is deleted); ending it again changes nothing. | NOT MET |
| AC-03 | US-01 | permission | Given a carer, a family member, another carer, an admin of another organisation, an admin without MFA (AAL1), an admin naming a carer from another organisation, or a caller with no session, when they end an assignment, then it is refused and no shift changes. | NOT MET |
| AC-04 | US-02 | happy | Given the Staff screen, when a carer is selected, then a "Clients for <carer>" list shows that carer's clients by full name, each with a Remove button; clients count only while the carer has a non-cancelled shift with them that has not ended; a carer with none shows "No clients assigned"; adding a new staff member shows no list; the list shows only the admin's own organisation. | NOT MET |
| AC-05 | US-02 | happy | Given a client in the list, when Remove is pressed, then a confirmation names the carer and the client and nothing changes until "Yes, remove"; on confirm the pair is removed, the row disappears and a status message says the client was removed and their future shifts cancelled; Cancel changes nothing. | NOT MET |
| AC-06 | US-01 | error | Given the removal fails, when the admin confirms, then the row stays and a plain-English error is shown (no client data in logs); an empty carer or client id is rejected before any change. | NOT MET |
| AC-07 | US-02 | a11y | Given the Clients list and the confirmation, when audited, then there are no axe violations, the Remove buttons are 44x44px with names that include both people, and nothing overlaps from 1920px to 768px. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
