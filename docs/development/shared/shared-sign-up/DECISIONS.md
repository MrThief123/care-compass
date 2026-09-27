# Decisions — F0-17 Self-serve sign-up for Family and Organisation accounts

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared work | YES | ANSWERED (PD-030) |
| OQ-07 | Client record creation and family linking | YES | ANSWERED (PD-037) |
| OQ-08 | Account provisioning, sign-in method and MFA | YES | ANSWERED (PD-040; amended by PD-057) |
| OQ-30 | Multi-client family accounts | no | One client per sign-up; switcher parked (PL-15). |

## Project decisions this feature implements
- PD-057 / CHG-010: self-serve Family and Organisation sign-up; carers invite-only; no email confirmation; same look as sign-in.
- CHG-010 risk 1 (decided): admin MFA is not mandatory. Removing F0-07's forced admin enrolment is a separate shared follow-up fix, not part of this feature.
- CHG-010 risk 2: organisations need a unique identifier (PL-24); not yet chosen, so this feature adds no identifier field.

## Feature decisions log

### FD-01 — A half-made account is cleaned up in the database, not with the service role
- Date: 2026-09-27
- Context: Sign-up creates the auth user first (Supabase Auth), then the records (`register_account`). If the second step fails the person is left with an auth user and no profile. PRD requires either no auth user left, or a clean way back, and asks for the approach to be recorded. The service-role client is limited to `src/server/jobs/**` (ADR-02, lint-enforced), so the action cannot delete the auth user itself.
- Decision: a second security-definer function, `discard_unregistered_account()`, deletes the caller's own auth user, and only while they have no profile. The action calls it, then signs out, and returns a plain-language error, so the person can try again with the same email.
- Reason: keeps the service role out of the request path; the function cannot remove a working account (tested: a caller with a profile is left alone).
- Alternatives considered: (a) leave the auth user and let sign-in "complete" the registration, which needs a second code path and a form to collect the missing details; (b) move sign-up into `src/server/jobs/**`, which misuses that folder; (c) create the profile by a database trigger on `auth.users`, which cannot know the account type, names or client name.
- Consequences: if `discard_unregistered_account()` itself fails (for example the database is unreachable) the auth user remains, and the same email then shows 'already exists'. Rare; accepted for MVP, and F0-07's sign-in reports a profile-less user as 'Your access has been withdrawn'.
- Human confirmation required: yes (Prajeet or the human owner; the PRD asked for the approach to be recorded)

### FD-02 — Shape of `register_account()`
- Date: 2026-09-27
- Context: AC-05 and AC-06 require that public sign-up can never create a carer, join an existing organisation or link to an existing client, enforced in the database.
- Decision: `register_account(p_role app_role, p_first_name, p_last_name, p_client_first_name, p_client_last_name, p_organisation_name) returns jsonb` (`role`, `profile_id`, `client_id`, `organisation_id`). No organisation-id or client-id parameter exists, so a request cannot name an existing one. The role is checked first (42501), then that the caller has no profile (23505), then blank names (22023). The contact email is copied from the caller's auth account. Execute is granted to `authenticated` only.
- Reason: one function is the only write path (PRD Technical Considerations); the absence of the parameters makes AC-06 true by construction, and a test asserts it.
- Alternatives considered: separate functions per account type (two RPCs and two grants for the same rules).
- Consequences: the result carries `client_id` so the action can route a family user without another query.
- Human confirmation required: no

### FD-03 — Same client-side pattern as F0-07's sign-in
- Date: 2026-09-27
- Context: The Next.js forms guide shows `useActionState`. F0-07's `SignInForm` calls a Server Action inside `useTransition` and navigates with `router.push(redirectTo)`.
- Decision: `/sign-up` follows F0-07's pattern, with the same `AuthActionResult` shape.
- Reason: CLAUDE.md §7, one pattern per problem; PRD says "as in F0-07".
- Alternatives considered: `useActionState` with a `<form action>`.
- Consequences: none for behaviour.
- Human confirmation required: no

### FD-04 — One Zod schema shared by the form and the action
- Date: 2026-09-27
- Context: The form needs field errors as the person types; the action is the trust boundary and must not trust the form.
- Decision: `SignUpInputSchema` in `src/server/auth/sign-up-schema.ts` (a discriminated union on `accountType`, with the password-match check on `confirmPassword`) is imported by both. It strips unknown keys, so `organisationId`, `clientId` or `role` in a crafted request are never read. Password minimum is 6, matching `minimum_password_length` in `supabase/config.toml`.
- Reason: the pattern `validation.ts` already describes ("the same object can be reused by a server action later").
- Alternatives considered: two schemas (they would drift).
- Consequences: the schema lives beside the actions but has no `"use server"`, so client code may import it.
- Human confirmation required: no

### FD-05 — `AuthActionResult` gains `fieldErrors` and two error codes
- Date: 2026-09-27
- Context: AC-03 needs field-level errors from the action; AC-04 and a failed registration need their own codes. The type is defined in F0-07's `src/server/auth/actions.ts`, which this feature already edits (CHG-010).
- Decision: add an optional `fieldErrors?: Record<string, string>` to the error, and the codes `EMAIL_EXISTS` and `REGISTRATION_FAILED`. Existing codes and every F0-07 caller are unchanged.
- Reason: additive; F0-07's tests and ACs do not change.
- Alternatives considered: a separate result type for sign-up (a second shape for the same idea).
- Consequences: none.
- Human confirmation required: no

### FD-06 — `database.types.ts` is not regenerated
- Date: 2026-09-27
- Context: `register_account` and `discard_unregistered_account` are not in `src/lib/supabase/database.types.ts`. F0-12 found that regenerating the file changes about 1,500 lines and then breaks typecheck in `src/app/api/test/route.ts`, outside this lane (its FD-04, still awaiting a decision).
- Decision: leave the file alone; call the two RPCs through a small typed wrapper inside `src/server/auth/`.
- Reason: avoids a large unrelated change and a conflict with F0-12's branch.
- Alternatives considered: regenerate and fix the route (outside this lane).
- Consequences: remove the wrapper when the types are regenerated (F0-12's decision, or a shared follow-up).
- Human confirmation required: no (follows F0-12's open question)

### FD-07 — Test change: pgTAP plan count
- Date: 2026-09-27
- Context: `supabase/tests/sign_up.test.sql` declared `plan(38)` but has 42 assertions; the run reported 'planned 38 but ran 42' while all 42 passed.
- Decision: `plan(42)`. No assertion was added, changed or removed.
- Reason: genuine test bug (a miscount), found on the first green run.
- Alternatives considered: none.
- Consequences: none.
- Test changes caused: T-05 and T-07 file, count only. Not flagged HUMAN REVIEW (no behaviour or assertion changed).
- Human confirmation required: no

### FD-08 — ARCHITECTURE.md would list the new function (needs a controlled change)
- Date: 2026-09-27
- Context: `ARCHITECTURE.md` line 122 lists the Postgres functions called via RPC (`set_occurrence_done`, `add_funds`, `record_expense`, `transfer_client_organisation`, …). `register_account` and `discard_unregistered_account` are new members. `ARCHITECTURE.md` is a controlled document (CLAUDE.md §9).
- Decision: not edited. Raised here for the human: either add both names to that list through a `CHG-xxx`, or confirm CHG-010 already covers it. `TESTING.md` line 65 lists example SQL functions and needs no change.
- Reason: controlled documents change only to record an answered decision or through a confirmed CHG.
- Alternatives considered: editing it on this branch anyway.
- Consequences: until then the list is one entry short.
- Human confirmation required: yes

### Rate limiting and MFA (recorded because the PRD asks)
- Rate limiting relies on Supabase Auth's defaults; `supabase/config.toml` sets no custom sign-up limit. Nothing extra is added by this feature.
- After an organisation sign-up the person is routed like an existing admin, so today that is `/mfa/enroll` (F0-07's forced TOTP enrolment). CHG-010 decided MFA is not mandatory; removing the enrolment is a separate shared follow-up, not part of F0-17.

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
