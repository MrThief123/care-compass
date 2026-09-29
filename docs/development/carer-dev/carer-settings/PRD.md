# CAR-09 — Carer — Settings

| Field | Value |
|---|---|
| Feature ID | CAR-09 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-settings` |
| Documentation | `docs/development/carer-dev/carer-settings/` |
| Lane | C — Carer |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **CAR-UI-04**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Manage own profile.

## Problem
CAR-UI-04 built the screen on fixtures: Save and Reset only change the screen. Nothing is stored and no reset email is sent. (OQ-35 is answered: PD-054.)

## Description
Carer Settings screen for own details and password reset.

## User value
Carers keep their contact details current and recover access without help.

## Users
- Carer

## Scope
- The screen, route `/carer/settings`, 'My info' card (Name, Phone, Email, Role) and Reset card already exist (CAR-UI-04). This feature wires them.
- My info Save: a Server Action `updateCarerContactDetails` writes the signed-in carer's own first name, last name, phone and contact email, then the screen shows 'Saved.' (PD-054).
- Reset: the existing `requestOwnPasswordReset` (FAM-12, through F0-07) emails a link to the carer's login address.
- Role (`job_title`) stays read-only (PD-054, PD-008). The carer cannot change it, `role`, `organisation_id` or `is_active` through the API; the column grant from FAM-12 (`20260925010000_profiles_self_update.sql`) already blocks this, and CAR-09 proves it for a carer.
- Loading: `getCarerContactDetails` (CAR-UI-04 FD-02) already reads the `profiles` row as the signed-in user; verify it against real data.

## Out of Scope
- Changing login email (PD-054)
- Editing Role / job title, or the per-organisation job-title list (ADM-02, OQ-13)
- Address (Family only)
- New migration: the FAM-12 grant and `profiles_update_self` policy already cover carers

## Functional Requirements
- Reuse FAM-12's `requestOwnPasswordReset`, `splitName` and phone/email rules (`src/server/profiles/`). There is no shared ProfileForm component; the Carer view stays its own, as built in CAR-UI-04.
- Server-side validation with the same rules as the form (Name required, phone 8 to 12 digits, email format, blank phone/email allowed).

## UI / UX Requirements
- Match design.

## Dependencies
- Features: F0-07 (Sign-in, sign-out, password reset and role-based routing), CAR-UI-04 (Carer Settings screen (UI))
- Blocking decisions: none. OQ-35 is ANSWERED (PD-054).
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-13 (names: full first + last is shown, per CHG-032; the job-title list is out of scope)

## Inputs
- Profile fields

## Outputs
- Profile update

## Error / Edge Cases
- —

## Security / Permissions
- Own profile only. The action takes no id: the row is the session user's (`.eq('id', user.id)`), RLS is the second lock.
- The action writes only `first_name`, `last_name`, `phone`, `email`. It must never send `address` (a carer has none; sending it would write null) nor `job_title`, `role`, `organisation_id`, `is_active`.
- Carer cannot change `job_title` or `role` via the API (column privileges, 42501).

## Technical Considerations
- Reuse components. `contactRowValues` writes `address`, so the Carer action needs its own row mapping without `address`.
- No PII in logs (class name only).

## Traceability
- Product requirements: REQ-01 (Users sign in simply and securely; users can reset their password by email.)
- Sources: Design: Carer · Settings
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
