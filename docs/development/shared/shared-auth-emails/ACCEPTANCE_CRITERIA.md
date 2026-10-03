# Acceptance Criteria — F0-24 Auth emails: working reset and invite links, set-password page

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a registered user who requested a password reset on the local stack, when they open the link in the email that arrives in Mailpit and set a new password, then they are signed in, the new password signs in and the old one does not. | MET |
| AC-02 | US-01 | error | Given a reset or invite link that is expired, already used, tampered with, or missing its token, when it is opened, then the user lands on `/sign-in?reason=reset-link-expired` with a way to request a new link, and no session exists. | MET |
| AC-03 | US-02 | happy | Given an admin invited a carer, when the carer opens the invite email's link and sets a password on `/set-password`, then they are signed in and land on `/carer/home`. | MET |
| AC-04 | US-02 | edge | Given an email that already has an account, when an admin invites it, then no new account or email is created and the admin sees the existing generic error. | MET |
| AC-05 | US-03 | permission | Given a carer who has not signed in, when an admin of the same organisation chooses Resend invite, then a new invite email is sent; and given a carer who has signed in, an admin of another organisation, or a non-admin, the request is refused and nothing is sent. | MET |
| AC-06 | US-01 | security | Given a registered and an unregistered email, when each requests a reset, then the responses are identical; and `next` pointing off-site is ignored. | MET |
| AC-07 | US-04 | happy | Given the feature is done, then the templates and settings are in the repo, `.env.example` lists any new variable names, and a hosted-project checklist (SMTP, sender and domain, site URL, redirect allow-list, templates, expiry, rate limits) is in DECISIONS.md and ticked by the human for the hosted project. | NOT MET |
