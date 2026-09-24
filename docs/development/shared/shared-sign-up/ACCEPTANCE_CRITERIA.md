# Acceptance Criteria — F0-17 Self-serve sign-up for Family and Organisation accounts

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given no account for grace@example.test, when she signs up as 'Family member' with her names, a valid password and client 'Harold Smith', then she is signed in and lands on `/family/<Harold id>/home`, Harold has no organisation, and she is Harold's family member. | NOT MET |
| AC-02 | US-02 | happy | Given no account for owner@example.test, when they sign up as 'Organisation' with organisation name 'Wattle Care', then 'Wattle Care' exists, their profile is `admin` of it, and they are routed exactly as an existing admin's sign-in is (`/admin/home`; MFA not mandatory, PD-040/CHG-010). | NOT MET |
| AC-03 | US-01, US-02 | error | Given a missing required field, mismatched passwords or a too-short password, when sign-up is submitted, then a field-level error is shown and no auth user, profile, client or organisation is created. | NOT MET |
| AC-04 | US-01, US-02 | error | Given helen@example.test is already registered, when someone signs up with that email, then 'An account with this email already exists' is shown with Sign in and reset links, and no new records are created. | NOT MET |
| AC-05 | US-03 | permission | Given a freshly authenticated user with no profile, when they call the registration function with role `carer`, then it is rejected and no profile is created. | NOT MET |
| AC-06 | US-03 | permission | Given Banksia Home Care and client Margaret exist, when a sign-up request is crafted to include Banksia's organisation id or Margaret's client id, then the new account is not linked to either and can read zero Banksia or Margaret rows. | NOT MET |
| AC-07 | US-03 | permission | Given a signed-up family or admin user, when they try to update their own `role`, `organisation_id` or `is_active`, then the update is rejected and the row is unchanged. | NOT MET |
| AC-08 | US-01, US-02 | happy | Given `/sign-up`, when it renders, then it uses the `(auth)` layout and the same card, field and button components as `/sign-in`; client name fields show only for 'Family member' and Organisation name only for 'Organisation'; there is no carer option and the carer help text is shown; sign-in and sign-up link to each other. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
