# Decisions — F0-07 Sign-in, sign-out, password reset and role-based routing

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-08 | Account provisioning, sign-in method and MFA | YES | Email + password via Supabase Auth, invitation emails for new users, TOTP MFA required for admins; confirm. |
| OQ-30 | Multi-client family accounts | no | Routes include clientId; switcher parked (PL-15). |

## Feature decisions log

### CHG-001 — Implement admin TOTP MFA in this feature, not deferred
- Date: 2026-09-22
- Context: PRD.md Scope lists "MFA for admin per OQ-08 answer (not implemented until answered)". OQ-08 is now ANSWERED (TOTP MFA required for admins), but ACCEPTANCE_CRITERIA.md/TEST_PLAN.md as originally drafted had no AC/test covering it — MFA scope wasn't reflected there.
- Decision: implement TOTP enrollment (forced on first admin sign-in with no verified factor) and the AAL2 challenge (required on every sign-in once enrolled) in this feature. Added AC-09/AC-10 and T-09/T-10.
- Reason: human explicitly chose this over deferring MFA to a follow-up feature when asked.
- Alternatives considered: defer MFA to ADM-10 (Admin Settings) or a new ticket, ship F0-07 against only the original 8 ACs.
- Consequences: F0-07's scope and test count grow by 2 ACs/tests; `src/app/(auth)/mfa/{enroll,verify}` routes and matching server actions are added.
- Human confirmation required: yes — given in-session 2026-09-22.
- Test changes caused: none (ACCEPTANCE_CRITERIA.md/TEST_PLAN.md gained new rows; no existing AC/test was altered).

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
