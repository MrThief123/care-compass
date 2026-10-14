# Acceptance Criteria — F0-28 Client personal details

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given family sign-up, when the form shows, then an optional 'More about them' group offers Date of birth, Email, Phone, Address, Suburb and Emergency contact name, relationship and phone; organisation sign-up does not show it. | MET |
| AC-02 | US-01 | regression | Given family sign-up with none of those fields, when submitted, then the account and client are created exactly as before. | MET |
| AC-03 | US-01 | happy | Given family sign-up with details filled in, when submitted, then the client is saved with those details. | MET |
| AC-04 | US-01 | validation | Given a future date of birth, an invalid email or a malformed phone, when sign-up is submitted, then that field shows an error and nothing is created. | MET |
| AC-05 | US-01 | error | Given the account is created but saving the details fails, when sign-up finishes, then the person still reaches Family Home and can add the details in Settings. | MET |
| AC-06 | US-02 | happy | Given Family Settings, when it loads, then '<First>'s details' shows the saved values read-only, with age beside the date of birth. | MET |
| AC-07 | US-02 | happy | Given the details card, when Helen presses Edit, changes the phone and presses Save, then the change is saved, 'Saved.' is announced and the card is read-only again; Cancel restores the saved values. | MET |
| AC-08 | US-02 | happy | Given a saved email, when Helen clears it and saves, then the email is removed. | MET |
| AC-09 | US-02 | validation | Given an invalid value, when Helen saves, then the field shows an error, the first invalid field takes focus and nothing is saved. | MET |
| AC-10 | US-02 | error | Given the save fails, when Helen saves, then "Couldn't save <First>'s details. Try again." shows and her typed values stay. | MET |
| AC-11 | US-03 | happy | Given Client Details, when it loads, then a 'Personal details' card shows age (born date), email, phone, address, suburb and the emergency contact, leaving out fields not set; with none it reads "No personal details added yet." | MET |
| AC-12 | US-03 | permission | Given an assigned carer or an admin of the client's organisation, when they open Client Details, then they see the same card read-only, with no edit control. | MET |
| AC-13 | US-02 | permission | Given a carer, an admin or another client's family member, when they call `save_client_details` for Margaret, then it is refused and nothing changes. | MET |
| AC-14 | US-02 | happy | Given a saved date of birth and suburb, when any Family page loads, then the header shows that age and suburb. | MET |
| AC-15 | US-02 | contract | Given `DATA_SOURCE=mock` or `supabase`, when `getClientDetails` / `saveClientDetails` are called, then both behave the same, input is validated with one Zod schema shared with sign-up, and errors name no client. | MET |
| AC-16 | US-01 | a11y | Given sign-up, Settings and Client Details, when axe runs, then there are no violations; every field is labelled and buttons are at least 44×44px. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
