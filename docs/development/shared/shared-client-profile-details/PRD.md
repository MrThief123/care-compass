# F0-28 — Client personal details (sign-up, Family Settings, Client Details)

| Field | Value |
|---|---|
| Feature ID | F0-28 |
| Dashboard / stream | Shared (sign-up, Family Settings, Family/Carer/Admin Client Details) |
| Phase | Phase 3 — Data wiring & behaviour |
| Development branch (PR target) | `main` |
| Feature branch | `feature/shared-client-profile-details` |
| Documentation | `docs/development/shared/shared-client-profile-details/` |
| Lane | S — Shared |
| Sprint | SPRINT · planned D22 |
| Change | CHG-063 (new requirement, human-approved in-session 2026-10-14) |
| Status / owner | See PROGRESS.md |

## Purpose
Record who the client is beyond their name: date of birth (shown as age), contact details, address and an emergency contact.

## Problem
Sign-up asks only for the client's first and last name. `clients.date_of_birth` and `clients.suburb` exist and the header already shows age and suburb, but nothing lets a family enter them, and there is nowhere to record the client's email, phone, address or an emergency contact.

## Description
Family sign-up gains an optional **More about them** group. Family **Settings** gains a **<First name>'s details** card (view, Edit, Save, Cancel) that edits the same fields at any time. **Client Details** (Family, Carer and Admin) gains a read-only **Personal details** card at the top.

## Users
- Family (enters and edits), Carer (assigned, reads), Admin (client's organisation, reads)

## Scope
- Fields, all optional: date of birth, client email, client phone, street address, suburb, emergency contact name, emergency contact relationship, emergency contact phone.
- Migration: add nullable `email`, `phone`, `address`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone` (text) to `clients`, with length and shape checks; `date_of_birth` and `suburb` already exist. Additive only. The existing `audit_clients` trigger covers the new columns.
- `save_client_details(p_client_id, …)`: SECURITY DEFINER, family of the client only (`is_family_of`), else 42501. Families have no UPDATE policy on `clients` (the transfer function's pattern). Replaces all eight fields (null clears).
- Reads use the existing `clients` select policies (family, assigned carer, admin of the organisation). No new policy.
- Contract in `src/server/clients/` (mock and Supabase): `getClientDetails(clientId)` and server action `saveClientDetails(clientId, input)`, both through one Zod schema shared with sign-up.
- Sign-up (`src/app/(auth)/sign-up/`, `signUp`): family accounts only; after `register_account` succeeds, non-empty details are saved with `save_client_details` (FD-02).
- Family Settings (`src/features/family-settings/`): the details card.
- Client Details (`src/features/family-info/`, `src/features/carer-patients/`): the read-only Personal details card from a new shared component `src/features/client-profile-details/`.

## Out of Scope
- Optional 2FA for family and carers (parked by the human, 2026-10-14; it would reverse CHG-040).
- Carer or admin editing these fields.
- Government identifiers (Medicare, NDIS numbers), photo, gender or pronouns.
- Emailing or calling the client from the app.

## Functional Requirements
- Date of birth: a real date, not in the future, not before 1900-01-01. Shown as "34 (born 2 Mar 1992)", age in whole years in Australia/Melbourne (`ageFromDob`).
- Email: valid address, up to 254 characters. Phones: digits, spaces and `+()-`, 6–20 characters. Address up to 200, suburb up to 100, emergency contact name up to 100, relationship up to 60. All trimmed; empty means not set.
- Settings card: read-only until Edit; Save persists and announces "Saved."; Cancel restores; a failed save shows "Couldn't save <First>'s details. Try again." and keeps the typed values; the first invalid field takes focus.
- Personal details card: shows only fields that are set; with none, "No personal details added yet." (family also sees "Add them in Settings."). No edit control on it.

## Non-Functional
- No PII in logs or error messages. Status never by colour alone. 44×44px targets. axe clean.

## Dependencies
F0-17 (sign-up), F0-22 (client header), FAM-12 (Family Settings), FAM-09 / CAR-04 / ADM-11 (Client Details) — all merged.

## Blocking decisions
None.
