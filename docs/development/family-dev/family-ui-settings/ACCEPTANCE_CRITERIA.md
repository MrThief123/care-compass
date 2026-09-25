# Acceptance Criteria — FAM-UI-06 Family Settings screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

Fixtures: client `Margaret` (current organisation Banksia Home Care), signed-in family member `profile-helen` (CHG-023).

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Settings renders, then the 'Family info' card shows inputs labelled Name 'Helen Doyle', Phone '0412 345 678', Email 'helen@example.com' and Address '12 Wattle St, Preston VIC 3072', in that order. *(Name changed from 'Helen' by CHG-023, PD-038.)* | NOT MET |
| AC-02 | US-01 | happy | Given the 'Change organisation' card reads 'Currently registered with Banksia Home Care.', when 'Change' is clicked, then a destructive dialog opens titled 'Change organisation?'. Its body is the FAM-13 wording (FD-04) and states that Banksia Home Care will lose access immediately. Its buttons are 'Cancel' and 'Change organisation', with a close X. | NOT MET |
| AC-03 | US-01 | happy | Given the dialog is open, when Cancel, the close X or Escape is used, then the dialog closes, focus returns to 'Change', no message appears and the card still reads 'Currently registered with Banksia Home Care.' | NOT MET |
| AC-04 | US-01 | happy | Given the dialog is open, when 'Change organisation' is clicked, then the dialog closes and 'Choosing a new organisation is not available yet.' is announced in a live region, and the organisation shown does not change (FD-01). | NOT MET |
| AC-05 | US-01 | happy | Given the 'Reset username / password' card reads 'We'll email you a secure link to reset your credentials.', when 'Reset' is clicked, then 'We've emailed you a link to reset your password.' is announced in a live region, and no email address appears in the message (FD-02). | NOT MET |
| AC-06 | US-01 | happy | Given the Family info card has a 'Save' button (PD-054), when Phone is changed to '0400 000 000' and Save is clicked, then the field keeps '0400 000 000' and 'Saved.' is announced. When the page is reloaded, then the fixture values show again (local state only). | NOT MET |
| AC-07 | US-01 | error | Given the Family info card, when Save is clicked with Name blank, Email 'helen@', or Phone 'abc', then nothing is saved and each bad field shows its message: 'Enter your name.', 'Enter an email address like name@example.com.', 'Enter a phone number like 0412 345 678.' The message is tied to its input (`aria-invalid`, `aria-describedby`). A blank Phone, Email or Address is allowed (FD-03). | NOT MET |
| AC-08 | US-01 | edge | Given a profile with no phone or address, then those inputs render empty and the card still shows. Given a client with no current organisation, then the card reads 'Not registered with an organisation.' and 'Change' is absent. Given a contract read rejects, then the shared error state shows with Retry. While loading, the route skeleton shows (FD-05). | NOT MET |
| AC-09 | US-01 | a11y | Given the rendered screen and the open dialog, then axe reports no violations, every button is at least 44×44px, and a 200-character name or address stays inside its card (FD-06). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
