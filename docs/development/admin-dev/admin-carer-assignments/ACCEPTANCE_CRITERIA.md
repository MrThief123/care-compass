# Acceptance Criteria — ADM-08 Admin — Manage carer-client assignments

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

AC-02 to AC-07 were added before implementation to record the human's answers on UI location and scope (FD-01, FD-02); AC-01 is unchanged. AC-08 to AC-11 were added after implementation, on the human's in-session requests, recorded as FD-05, FD-07 and FD-08 (controlled change; human confirmation in DECISIONS.md).

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha's assignment to Elsie is ended, when Aisha queries Elsie, then zero rows are returned. | MET |
| AC-02 | US-01 | happy | Given Aisha has future, in-progress, finished and already-cancelled shifts with Margaret, and other shifts with Nell (Aisha) and with Margaret (Daniel), when the admin ends Aisha's assignment to Margaret, then Aisha's future shifts with Margaret are cancelled, her in-progress one ends now, the count of shifts changed is returned, and the finished shift, the already-cancelled shift, and every other carer–client pair are unchanged (nothing is deleted); ending it again changes nothing. | MET |
| AC-03 | US-01 | permission | Given a carer, a family member, another carer, an admin of another organisation, an admin without MFA (AAL1), an admin naming a carer from another organisation, or a caller with no session, when they end an assignment, then it is refused and no shift changes. | MET |
| AC-04 | US-02 | happy | Given the Staff screen, when a carer is selected, then a "Clients for <carer>" list shows that carer's clients by full name, each with a Remove button; clients count only while the carer has a non-cancelled shift with them that has not ended; a carer with none shows "No clients assigned"; adding a new staff member shows no list; the list shows only the admin's own organisation. | MET |
| AC-05 | US-02 | happy | Given a client in the list, when Remove is pressed, then a confirmation names the carer and the client and nothing changes until "Yes, remove"; on confirm the pair is removed, the row disappears and a status message says the client was removed and their future shifts cancelled; Cancel changes nothing. | MET |
| AC-06 | US-01 | error | Given the removal fails, when the admin confirms, then the row stays and a plain-English error is shown (no client data in logs); an empty carer or client id is rejected before any change. | MET |
| AC-07 | US-02 | a11y | Given the Clients list and the confirmation, when audited, then there are no axe violations, the Remove buttons are 44x44px with names that include both people, and nothing overlaps from 1920px to 768px. | MET |
| AC-08 | US-02 | happy | Given the Staff screen, when it loads, then only the staff list and an Add Staff button show (no form, nobody selected); pressing a name opens a side panel with that person's details and their Clients list; Add Staff opens the panel empty with no Clients list; Close, Escape or a successful Save closes it and clears the fields. | MET |
| AC-09 | US-02 | happy | Given an admin invited a carer who has not yet signed up, when the Staff screen loads or is reloaded, then that carer shows a "Pending" label in the list and "Invite sent. Pending until they sign up." in their panel, a carer just added shows it at once, and it disappears once the account is confirmed; only carers of the admin's own organisation are reported. | MET |
| AC-10 | US-02 | permission | Given a carer who has not signed up, when the admin opens Manage or tries to assign them a shift, then they are not listed and the shift is refused with nothing created (also if the lookup fails); once they have signed up they are listed and can be given shifts. | MET |
| AC-11 | US-02 | a11y | Given the side panel, when it opens, then focus moves to its first field; when it closes, then focus returns to the button that opened it. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
