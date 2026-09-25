# Decisions — FAM-12 Family — Settings: family info and password reset

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-35 | Settings forms save behaviour | ANSWERED (PD-054, 2026-09-17) | Applied: Save per card; the email field is the contact email only. |
| OQ-08 | Account provisioning, sign-in method and MFA | no | Email + password via Supabase Auth, invitation emails for new users, TOTP MFA required for admins; confirm. |

## Feature decisions log

### FD-01 — Migration added from Lane F: users update their own contact columns only
- Date: 2026-09-25
- Context: `profiles` had only SELECT policies, so nothing could be saved (AC-01) and AC-04 had nothing to test. `supabase/**` is Lane B's folder (docs/AGENT_REFERENCE.md, CLAUDE.md §4.2). The PRD scopes the save and AC-04 to this feature. Asked the human (stop-and-ask, CLAUDE.md §10) with a recommendation to add it here; the human started the local stack for it and did not answer the question in words.
- Decision: added `supabase/migrations/20260925010000_profiles_self_update.sql`: policy `profiles_update_self` (own row only), `revoke update on profiles from anon, authenticated`, then `grant update (first_name, last_name, phone, email, address) on profiles to authenticated`. A plain own-row policy would have let a family user set their own `role`, `organisation_id` or `is_active`, so the columns are limited. An attempt on any other column fails with 42501. pgTAP `supabase/tests/profiles_update.test.sql` (9 tests) covers it.
- Reason: RLS is the source of truth (ARCHITECTURE.md §12); the smallest grant that makes AC-01 possible.
- Alternatives considered: wait for Lane B (blocks the feature); a SECURITY DEFINER `update_own_contact()` function (more surface for the same effect).
- Consequences: **HUMAN REVIEW: the PR touches `supabase/**`.** ADM-02 / CAR-09 will need their own paths for admin-managed and job-title changes. The migration must also be applied to any hosted project (see PROGRESS, Problems).
- Human confirmation required: yes, at PR review. No explicit answer was given in words; proceeded on the recommended option after the human started Docker.
- Test changes caused: none.

### FD-02 — Contact rules and the profile mapping live in `src/server/profiles/`
- Date: 2026-09-25
- Context: FAM-UI-06 FD-03 kept the Family info schema beside the screen "so FAM-12 can move it next to the action".
- Decision: `familyInfoSchema` moved (git mv) to `src/server/profiles/contact-schema.ts`; `src/features/family-settings/settings-schema.ts` re-exports it, so the screen and its FAM-UI-06 test are unchanged. `contact-details.ts` holds the pure mapping (row to details, form to row values, name split). The action validates again on the server and returns per-field messages the screen shows.
- Reason: one set of rules on both sides of the trust boundary (CLAUDE.md §7, one pattern per problem).
- Alternatives considered: `src/server` importing from `src/features` (backwards layering); a second copy of the rules.
- Consequences: none for other features.
- Human confirmation required: no.
- Test changes caused: none.

### FD-03 — Name is split at the first space
- Date: 2026-09-25
- Context: the screen has one Name field; `profiles` has `first_name` and `last_name` (PD-038: full name is first and last).
- Decision: the first word is `first_name`, the rest is `last_name` (null for a one-word name). The name is shown as the two joined by a space, so it reads back exactly as typed ("Mary Jane van der Berg" is stored as Mary / Jane van der Berg).
- Reason: lossless round trip; no guessing about surnames.
- Alternatives considered: split at the last space (breaks "van der Berg" the other way); two fields (a design change).
- Consequences: staff lists that show first and last separately will show "Jane van der Berg" as the last name of that user. Raise with the design owner if that matters.
- Human confirmation required: no.
- Test changes caused: none.

### FD-04 — The reset link goes to the login email, from the session
- Date: 2026-09-25
- Context: PD-054 keeps the contact email on this screen separate from the login email. `requestPasswordReset({ email })` (F0-07) takes an address. Asked the human, who did not answer in words.
- Decision: `requestOwnPasswordReset()` takes no arguments, reads the address from the signed-in session and calls `requestPasswordReset`. The caller can never choose an address. The confirmation still names no address (FAM-UI-06 FD-02). A failure says "Couldn't send the reset link. Try again." and never "emailed".
- Reason: the contact email can be anything the user types, so sending recovery links to it would let a typo, or someone else's address, receive one.
- Alternatives considered: sending to the contact email.
- Consequences: none.
- Human confirmation required: yes, at PR review (default used).
- Test changes caused: none.

### FD-05 — Two tests are at a lower level than the plan, and why
- Date: 2026-09-25
- Context: TEST_PLAN T-01 is e2e and T-03 is integration. TESTING.md says push each test to the lowest layer that proves the AC. An e2e for AC-01 needs the app running with `DATA_SOURCE=supabase`, and `getClientHeaderSummary` (the header every Family page reads) has no Supabase branch yet, so the page cannot render against the database. A real reset email is limited to 2 an hour on the local stack.
- Decision: T-01 is an integration test (`tests/integration/family-settings-profile.test.ts`): save through the action as a signed-in user, then read through the contract (the "reload"). T-03 is `src/server/profiles/actions.test.ts` with a fake Supabase client (asserts the address and redirect) plus the signed-out refusal against the real auth service. The screen path is proven with a component test and a real-browser run on the mock data source. No assertion was dropped.
- Reason: as above.
- Alternatives considered: an e2e with a second Playwright server on `DATA_SOURCE=supabase` (blocked by the header contract).
- Consequences: **HUMAN REVIEW: two test levels differ from TEST_PLAN.** When `getClientHeaderSummary` is wired, add the e2e.
- Human confirmation required: yes, at PR review.
- Test changes caused: TEST_PLAN levels for T-01 and T-03 only.

### FD-06 — Two FAM-UI-06 tests changed (recorded requirement change: Phase 3 wiring)
- Date: 2026-09-25
- Context: FAM-UI-06 tests were written for Phase 1, before Save and Reset were wired.
- Decision: (1) `src/server/profiles/queries.test.ts`, "[FAM-UI-06][CHG-023] getFamilyContactDetails throws the not-implemented error…": before, it asserted that `DATA_SOURCE=supabase` throws "not implemented yet"; after, it is three FAM-12 tests (reads the row as the signed-in user and maps it; leaves out blanks; throws, naming no profile, when no row comes back), because FAM-12 implements that branch. (2) `src/features/family-settings/family-settings.test.tsx`, "[FAM-UI-06][AC-06] Save keeps an edited phone number…": added `await screen.findByText("Saved.")` before the same assertions, because Save now awaits the Server Action. No other assertion changed or removed.
- Reason: the requirement changed (the branch now exists; Save is asynchronous); the behaviour the tests protect is intact.
- Human confirmation required: yes. **HUMAN REVIEW: test expectation changed** (flagged in PROGRESS and the PR).
- Test changes caused: the two above.

### FD-07 — Non-blocking defaults used
- OQ-08: no change to sign-in or provisioning here; the reset uses F0-07's flow.
- Failure wording is undesigned: "Couldn't save your details. Try again.", "Couldn't send the reset link. Try again.", "Your session has ended. Sign in again." and "Check the highlighted fields." Flagged for design review.
- In `DATA_SOURCE=mock` (Phase 1 screens, the default) Save validates and succeeds without persisting, and Reset succeeds without sending, so the screen behaves as before.
- Human confirmation required: no.

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
