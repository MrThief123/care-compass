# Decisions — F0-24 Auth emails: working reset and invite links, set-password page

## Open decisions affecting this feature
None blocking.

## Feature decisions log
- FD-01 (2026-10-02, confirmed by the human with the rest of CHG-047): links in the emails use `token_hash` templates rather than relying on Supabase's default redirect, because the admin invite API has no PKCE verifier and puts tokens in the URL hash. `/auth/confirm` also accepts `code` as a fallback.
- FD-02 (2026-10-02, human-confirmed): email confirmation is not required, on local or hosted. No sign-up confirmation template is built; if it is ever turned on, that is a new change.
- FD-03 (2026-10-02, human-confirmed): the sender is Resend via SMTP for Supabase Auth, the same provider INT-01 uses. The human must create the domain records (SPF/DKIM) and the SMTP credentials; names only in `.env.example`, never values.
- FD-04 (2026-10-02, human-confirmed): Resend invite sits in the Admin Staff edit panel and shows only for staff who have not signed in.

## Hosted checklist (human, tick when done on the hosted project)
- [ ] Custom SMTP set (host, port, user, sender address, sender name)
- [ ] Sender domain verified (SPF, DKIM)
- [ ] Site URL = the deployed origin
- [ ] Redirect allow-list includes `<origin>/auth/confirm` and `<origin>/set-password`
- [ ] Recovery and invite templates installed (paste, or `supabase config push`)
- [ ] "Confirm email" is off on hosted (FD-02)
- [ ] Email OTP expiry and Auth email rate limits recorded
- [ ] A real reset and a real invite sent to an address outside the project team and followed to sign-in
