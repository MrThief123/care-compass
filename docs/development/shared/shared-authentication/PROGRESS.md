# Progress — F0-07 Sign-in, sign-out, password reset and role-based routing

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D5
Branch: `feature/shared-authentication` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-08 — Account provisioning, sign-in method and MFA

## Dependencies status
- F0-06 — NOT STARTED
- F0-15 — NOT STARTED
- UI-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `/sign-in` page: email + password, submit, error message on failure, link 'Forgot password?' (layout built from existing primitives and tokens — no bespoke visual design exists, OQ-19).
- Password reset: request page sending Supabase reset email; `/reset-password` page to set a new password from the emailed link.
- Reusable `requestPasswordReset()` server action used later by the Settings 'Reset' buttons (FAM-12, CAR-09, ADM-10).
- Sign-out action (placed in the top bar by F0-15).
- Post-sign-in redirect by role: family → `/family/[clientId]/home` (first linked client), carer → `/carer/home`, admin → `/admin/home`.
- Route-group guards: `(family)`, `(carer)`, `(admin)` layouts verify role server-side; wrong role → redirect to own home.
- Inactive profile → signed out with 'Your access has been withdrawn' message.
- MFA for admin per OQ-08 answer (not implemented until answered).
- Replace the mock `getCurrentUser()` data source with the Supabase session; keep the contract signature unchanged.

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 0 / 8
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/server/auth/actions.ts`, `src/app/(family)/layout.tsx`, `src/app/(carer)/layout.tsx`, `src/app/(admin)/layout.tsx`, `tests/e2e/auth.spec.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-08; then complete dependencies, run START FEATURE F0-07, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
