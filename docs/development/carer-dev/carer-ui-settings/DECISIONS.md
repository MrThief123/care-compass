# Decisions — CAR-UI-04 Carer Settings screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-35 (ANSWERED, PD-054) | Settings forms save behaviour | no | Add a Save button per card; Role read-only for carers; email field is contact email only. |
| OQ-13 (ANSWERED, PD-038) | Staff names and job titles | no | Store first and last name; display first name + initial everywhere (matches design); job titles are a per-organisation editable list seeded with the three design values. |

## Feature decisions log

### FD-01: Aisha's fixture gets the design's phone and email
- Date: 2026-09-26
- Context: AC-01 expects '0423 987 654' and 'aisha.r@banksiahomecare.com.au'. `staff-aisha` in `src/mocks/fixtures.ts` has no phone, and its email is `aisha.rahman@banksiahomecare.example`.
- Decision: add `phone: "0423 987 654"` to `staff-aisha` and change its email to `aisha.r@banksiahomecare.com.au`. This is a shared-folder (`src/mocks/**`) edit, following the CAR-UI-01 FD-02 precedent.
- Reason: the human approved it in session. It matches the design and the AC.
- Alternatives considered: keep the `.example` email and change AC-01 through a controlled change (rejected).
- Consequences: flag the shared-folder edit in the PR. Any test that asserts the old email must be updated and recorded here.
- Human confirmation required: no (given 2026-09-26).

### FD-02: New contract `getCarerContactDetails`
- Date: 2026-09-26
- Context: no contract returns a carer's own details.
- Decision: add `getCarerContactDetails(profileId)` to `src/server/profiles/queries.ts`, with a mock in `src/mocks/queries/profiles.ts`. It returns `CarerContactDetails { profileId, name, phone?, email?, role? }`. `name` is the full name (PD-038), `email` is the contact email (PD-054), and `role` is the job title. A missing value is left out, never returned as `""` (CHG-023). An unknown id rejects. Every call returns a new object.
- Reason: the human approved it in session. It matches the `getFamilyContactDetails` shape.
- Consequences: this is a shared-folder edit, so flag it in the PR. The Supabase branch reads `profiles` (`first_name, last_name, phone, email, job_title`) as the signed-in user. CAR-09 verifies it against RLS.
- Human confirmation required: no (given 2026-09-26).

### FD-03: My info is read-only in Phase 1; Reset only confirms locally
- Date: 2026-09-26
- Context: the design has no buttons on My info. PD-054 gives each card its own Save, and Role is read-only for carers.
- Decision: all four My info fields are read-only inputs, and there is no Edit, Save or Cancel. CAR-09 adds Edit/Save when it wires the form, and Role stays with no edit control. Pressing 'Reset' calls nothing. It announces "We've emailed you a link to reset your password." in a `role="status"` region (local state only, the same wording as Family Settings).
- Reason: the human chose this in session. It matches the design and keeps within the two ACs.
- Consequences: CAR-09 owns the Save and Reset wiring.
- Human confirmation required: no (given 2026-09-26).

### FD-04: How the PRD-scope state tests are tagged
- Date: 2026-09-26
- Decision: the loading, error and empty-phone tests (T-04 to T-06) cover PRD Scope states that have no AC of their own. They are tagged `[AC-01]` because they are states of the My info read. No AC was added, since the ACs are controlled.
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
