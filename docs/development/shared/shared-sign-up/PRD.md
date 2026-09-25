# F0-17 — Self-serve sign-up for Family and Organisation accounts

| Field | Value |
|---|---|
| Feature ID | F0-17 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-sign-up` |
| Documentation | `docs/development/shared/shared-sign-up/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Added by CHG-010 (PD-057), 2026-09-24.** Same lane, stream and visual pattern as F0-07 sign-in.

## Purpose
Let families and organisations create their own accounts, so the confirmed workflow (family creates the client, then links a provider) can start.

## Problem
F0-07 signs people in, but no feature creates an account. Under PD-037 the family creates the client record, but no one exists yet to invite a family.

## Description
A public `/sign-up` page creates a Family account together with its client, or an Organisation (admin) account together with a new organisation. Everything is created in one database transaction, and then the user is signed in and routed exactly as F0-07 does. Carers cannot sign up; their admin invites them (ADM-02).

## User value
A family member or a provider can start using Care Compass on their own, "as simply as their online bank" (CIS3).

## Users
- Family
- Admin (organisation)

## Scope
- `/sign-up` page in the `(auth)` route group and layout, built with the same components and tokens as `/sign-in` (`CardShell`, `Field`, `InlineAlert`, `Button`). Heading 'Create an account'. Only the fields differ.
- Fields:
  - **Account type** (required): 'Family member' or 'Organisation'. Use the UI-02 forms kit choice control; if the kit has none, record it in DECISIONS.md and ask before adding a component. No carer option.
  - **Your first name**, **Your last name** (required, PD-038).
  - **Email**, **Password**, **Confirm password** (required).
  - Family only: **Their first name**, **Their last name** — the person being cared for (required).
  - Organisation only: **Organisation name** (required).
  - Help text under the account type: 'Carers: ask your organisation to invite you.'
- A 'Create an account' link on `/sign-in` and an 'Already have an account? Sign in' link on `/sign-up`.
- `signUp()` Server Action in `src/server/auth/actions.ts` (Zod-validated, same `ActionResult` shape as `signIn`). It calls Supabase Auth sign-up, then creates the account's records, then returns the same `redirectTo` that `signIn` would.
- New migration: a security-definer registration function that creates, in one transaction:
  - **Family:** `profiles` (role `family`, no organisation), `clients` (the names given, `organisation_id` null) and `client_family_members`.
  - **Organisation:** `organisations` (the name given) and `profiles` (role `admin`, `organisation_id` = the new organisation).
  - It only accepts `family` or `admin`, only for the calling user, and only once per user.
- Post-sign-up routing reuses F0-07's `resolvePostSignInPath`. Family goes to `/family/<new client id>/home`. Admin goes to `/admin/home`. MFA is not mandatory (PD-040, CHG-010). Until the CHG-010 follow-up removes F0-07's forced admin enrolment, a new admin passes through it like any existing admin.

## Out of Scope
- Carer sign-up, carer join requests or join codes (carers are invited, ADM-02, PD-040/PD-057).
- Linking the client to an organisation (FAM-13 organisation picker; CHG-010 note).
- Family linking carers directly (PD-041).
- Email confirmation (PD-057: not required).
- Joining an existing organisation as a second admin, deleting organisations (PL-18).
- An organisation unique identifier (e.g. ABN) and organisation verification (PL-24). The identifier is not yet chosen; do not add a required field for it until it is decided.
- More than one client per family account (PL-15, OQ-30).

## Functional Requirements
- Public sign-up can never create a `carer` profile, set an existing `organisation_id`, or link to an existing client. This is enforced in the database, not only in the form.
- A user cannot change their own `role`, `organisation_id` or `is_active` after sign-up.
- If the records cannot be created, the user is left with no half-made account: either no auth user remains, or signing in again completes or cleanly reports the problem. Record the approach in DECISIONS.md.

## UI / UX Requirements
- Visually the same as `/sign-in`: `(auth)` layout, card, heading, spacing, field and button styles. Plain-language errors. 44×44px targets. Conditional fields appear only for their account type, and hidden fields are not submitted.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-07 (Sign-in, sign-out, password reset and role-based routing)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-07, OQ-08
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-30

## Inputs
- Account type, first and last name, email, password, confirm password
- Family: client first and last name · Organisation: organisation name

## Outputs
- New auth user, profile, and client + family link, or organisation
- Session cookie
- Redirect

## Error / Edge Cases
- Email already registered → 'An account with this email already exists. Sign in or reset your password.' with both links (copy PROPOSED). Nothing new is created.
- Passwords do not match, password shorter than Supabase's minimum, or a missing required field → field-level errors. Nothing is created.
- Signed-in user opens `/sign-up` → redirected to their own home.

## Security / Permissions
- Role is limited to `family` and `admin` by the registration function; `carer` is rejected even from a hand-crafted request.
- No email confirmation (PD-057). Sign-up can reveal that an email is registered; accepted for MVP (CHG-010 risk 3). `/sign-in` and reset keep their no-enumeration behaviour.
- Rate limiting relies on Supabase Auth defaults (record in DECISIONS).
- No PII in logs.

## Technical Considerations
- Server Action for sign-up, `redirect()` after success, as in F0-07. Read `node_modules/next/dist/docs/` for forms/Server Actions before coding (CLAUDE.md §14).
- The registration function is the only write path for these tables at sign-up; do not grant the `authenticated` role a general insert on `organisations`, `clients` or `profiles`.

## Traceability
- Product requirements: REQ-01, REQ-36
- Sources: Human 2026-09-24, Prajeet (PD-057, CHG-010); CIS3 Order 1–3; CM-1908; PD-036; PD-037; PD-040; PD-041
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
