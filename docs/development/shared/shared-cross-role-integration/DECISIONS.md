# Decisions — INT-12 Cross-role integration journey

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-40 | Care alert email triggers and recipients (INT-09) | no | Out of scope for INT-12; add a phase once INT-09 is merged |

## Feature decisions log

### FD-01 — "Sees the change" means after in-app navigation, not live push
- Date: 2026-10-03
- Context: the human asked that a change by one role is seen by the other two. The app has no Supabase Realtime subscriptions; screens load data when they are opened.
- Decision: a role "sees" a change when, with the screen already open, it moves away and back through the app's own links (no reload) and reads the new data, and again after a fresh sign-in. Same rule as ADM-11's `tests/e2e/shared-cross-role-sync.spec.ts`.
- Reason: tests what the product does today; catches stale pages and stale client caches.
- Alternatives considered: live push without navigation (would fail by design; would be a new feature).
- Consequences: if the human wants live updates, raise a new feature.
- Human confirmation required: yes (Dhruv Verma, when approving CHG-054)

### FD-02 — Defects found are recorded, not fixed here
- Date: 2026-10-03
- Context: an integration suite will find real bugs; fixing them inside INT-12 would grow scope across every lane's folders.
- Decision: a product defect gets a `test.fail()` with its defect ID, a PROGRESS.md entry with repro steps, and is raised with the human as a Parking lot item or feature proposal (AC-44).
- Reason: CLAUDE.md §6 and §4.2.
- Human confirmation required: yes (with CHG-054)

### FD-03 — Two-factor is admin-only
- Date: 2026-10-03
- Context: the request lists "two factor working". Only admins have TOTP (F0-20, CHG-040); Family and Carer have no second factor.
- Decision: Phase 1 tests admin TOTP enrolment, sign-in, wrong code and the AAL1 guard. Family and Carer 2FA are not tested because they do not exist.
- Human confirmation required: no (follows CHG-040)

### FD-04 — Carer accounts come from an admin invite
- Date: 2026-10-03
- Context: the request lists "creating an account" for carers. Carers cannot sign up publicly (F0-17); an admin adds them and they set a password from an invite link (ADM-02, F0-24).
- Decision: AC-07 tests the invite path end to end; AC-08 checks public sign-up cannot create a carer.
- Human confirmation required: no

### FD-05 — Items added beyond the original request
- Date: 2026-10-03
- Context: the human asked for missed features to be appended.
- Decision: added event documents (AC-16, AC-23), Settings and client info edits (AC-18, AC-22, AC-38), Overdue clearing (AC-34), pending costs (AC-36), shift cancel (AC-28), carer deactivation (AC-29), client removal (AC-31), Admin Home counts (AC-30), wrong-password and role routing (AC-11), expired reset links (AC-10), budget emails (AC-40, AC-41).
- Human confirmation required: yes (with CHG-054)
