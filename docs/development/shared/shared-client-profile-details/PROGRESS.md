# Progress — F0-28 Client personal details (sign-up, Family Settings, Client Details)

Status: PR OPEN (#247)
Owner: Shwethan Potu
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-client-profile-details`
PR target: `main`
Last updated: 2026-10-15

## Blockers
- None. Scope given by the human in-session 2026-10-14 (CHG-063).
- HUMAN REVIEW: test expectation changed: four Client Details heading-order tests now expect 'Personal details' first (FD-09); one F0-17 e2e selector made exact (FD-08, no assertion change).
- HUMAN REVIEW: no Figma frame for the sign-up group, the Settings card or the Personal details card; built from the existing kit and tokens.
- Not run: browser visual check of the three screens.

## Completed
- Claimed; CHG-063; DEVELOPMENT_PLAN row and card; feature pack
- Tests first: T-01–T-08 written, all failing for the right reason (TEST_PLAN results)
- Database: six `clients` columns, `save_client_details` (family only), synthetic seed for Margaret
- Contracts: shared Zod schema, `getClientDetails`, `saveClientDetails` (mock and Supabase)
- Sign-up 'More about them'; Family Settings '<First>'s details'; read-only 'Personal details' on Family, Carer and Admin Client Details
- All 16 ACs MET; suite results in TEST_PLAN.md

## Commits on this branch
claim → docs pack → tests first → feat(db) → contracts → sign-up → type fix → Settings card → Client Details card → results

