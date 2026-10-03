# Decisions — F0-24 Auth emails: working reset and invite links, set-password page

## Open decisions affecting this feature
None blocking.

## Feature decisions log
- FD-01 (2026-10-02, confirmed by the human with the rest of CHG-047): links in the emails use `token_hash` templates rather than relying on Supabase's default redirect, because the admin invite API has no PKCE verifier and puts tokens in the URL hash. `/auth/confirm` also accepts `code` as a fallback.
- FD-02 (2026-10-02, human-confirmed): email confirmation is not required, on local or hosted. No sign-up confirmation template is built; if it is ever turned on, that is a new change.
- FD-03 (2026-10-02, human-confirmed): the sender is Resend via SMTP for Supabase Auth, the same provider INT-01 uses. The human must create the domain records (SPF/DKIM) and the SMTP credentials; names only in `.env.example`, never values.
- FD-04 (2026-10-02, human-confirmed): Resend invite sits in the Admin Staff edit panel and shows only for staff who have not signed in.

- FD-05 (2026-10-03, default, no human decision needed): `/auth/confirm` accepts only `type=recovery` and `type=invite`. Other OTP types (signup, email_change, magiclink) are refused as an expired link, so the route cannot be used to mint a session from a token type the app never emails.
- FD-06 (2026-10-03, default): "has not signed in" for Resend invite means the carer is in `admin_pending_staff_ids()` (`email_confirmed_at` null, ADM-08 FD-07), the same rule that shows the Pending tag. Resend uses `inviteUserByEmail` again, which Supabase refuses for an accepted account, a second line of defence.
- FD-07 (2026-10-03, revised 2026-10-03): the template files are in the repo and registered in `supabase/config.toml`, which configures the local stack only. On the hosted project, paste the two templates (and their subjects) into the dashboard under Authentication → Emails → Templates, after custom SMTP is on. Do not use `supabase config push`: Supabase rejects template changes until custom SMTP is set ("not available for free tier projects using the default email provider"), and the push also sends the whole local `[auth]` block (`site_url = http://127.0.0.1:3000`, localhost redirects, `jwt_expiry`, OTP settings), which would overwrite the hosted values and break the links. Ticked in the checklist below.
- FD-08 (2026-10-03): `resetPassword` and the new `setPassword` share one private helper in `src/server/auth/actions.ts`. `resetPassword`'s result and messages are unchanged. `setPassword` returns `redirectTo` from the same resolver `signIn` uses, so an invited admin-role account would hit the MFA gate the same way.

## Hosted checklist (human, tick when done on the hosted project)
- [ ] Custom SMTP set (host, port, user, sender address, sender name)
- [ ] Sender domain verified (SPF, DKIM)
- [ ] Site URL = the deployed origin
- [ ] Redirect allow-list includes `<origin>/auth/confirm` and `<origin>/set-password`
- [ ] Recovery and invite templates installed (paste in the dashboard, after SMTP; not `supabase config push`, FD-07)
- [ ] "Confirm email" is off on hosted (FD-02)
- [ ] Email OTP expiry and Auth email rate limits recorded
- [ ] A real reset and a real invite sent to an address outside the project team and followed to sign-in
