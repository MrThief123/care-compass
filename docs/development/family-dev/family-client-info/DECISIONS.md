# Decisions — FAM-09 Family — Client info

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-26 | File upload constraints | YES | ANSWERED (PD-051): PDF, JPEG, PNG, HEIC, DOCX up to 20 MB; no video. |
| OQ-38 | Client information fields | no | Build the design for MVP; remaining fields parked (PL-13, PL-22) pending client confirmation. |

## Feature decisions log

### FD-01 — Branch from `main`; CAR-04 is already merged
- Date: 2026-10-01
- Context: a stacked branch off CAR-04 was considered; plan-status was stale and CAR-04 (PR #173) is in `main`.
- Decision: `feature/family-client-info` is cut from current `main`. PR to `main`, after human approval.
- Human confirmation: Dhruv Verma, 2026-10-01 (in-session).

### FD-02 — Reuse CAR-04's contract; no new contract or migration by default
- Date: 2026-10-01
- Decision: FAM-09 calls `saveClientInfoSection`, `uploadDocument`, `getDocumentUrl`, `getClientInfoSections`, `getClientDocuments` as merged. Family rules are proven by `supabase/tests/family_client_info.test.sql`; a migration is added only if one of those tests fails for a missing family rule.

### FD-03 — No shared `ClientInfoView`
- Date: 2026-10-01
- Decision: the PRD line about a shared `ClientInfoView` is dropped. CAR-04 shipped carer wrappers (its FD-02); family cards in `src/features/family-info/` are wired in place (Lane F owns them). Merging the two sets of cards is a follow-up, not this feature.

### FD-04 — Copy and always-three-cards
- Date: 2026-10-01
- Decision: empty section copy stays 'Nothing added yet.' (already shipped by FAM-UI-04 and CAR-04), not the PRD's 'Not added yet'. Family always sees the three text cards, written or not, so a first entry can be added. 5,000-character cap is the PRD's PROPOSED value, enforced in `saveClientInfoSection`.

### FD-05 — AC-04 follows CAR-04 FD-07 (supersedes D28 for admin)
- Date: 2026-10-01
- Context: AC-04 said an admin update is rejected. The human ruled on 2026-09-30 (CAR-04 FD-07) that the client's own-organisation admin may read and write Info sections; the merged migration does that.
- Decision: AC-04 and T-04 now reject another organisation's admin and an unlinked family member. HUMAN REVIEW: test expectation changed before implementation (test never ran).
- Human confirmation: Dhruv Verma, 2026-10-01 (in-session, following FD-07).

### FD-06 — FAM-UI-04 tests changed for the wired behaviour
- Date: 2026-10-01
- Context: `src/features/family-info/family-info.test.tsx` assumed nothing is saved. FAM-09 wires Save, Add file and the always-three-cards rule (TEST_PLAN "Existing tests expected to change"). The file now also mocks `@/server/clients/actions` and `@/server/documents/actions`.
- Decision: HUMAN REVIEW: test expectations changed. Changes (test, before, after, reason):
  - "Save shows the edited text…": before, text shown at once; after, awaited (`findByText`) because Save now awaits the contract. Behaviour same.
  - "saving a blank textarea shows 'Nothing added yet.'": before, sync; after, awaited. Same reason.
  - "Save keeps the words but trims stray space": before, sync; after, waits for Edit to reappear. Same reason.
  - "an edit lives in local state only…": before, asserted local-only state; after, asserts a fresh render shows what the contract returns (an edit is saved through the contract, not kept in the page). Assertion reworded, not removed.
  - "pressing 'Add file' says adding files is not available yet": before, asserted that message; after, asserts the file chooser opens, the status stays empty and no upload is sent. The "not available yet" message is removed because uploads are wired.
  - "a client with documents but no text sections still shows the Documentation card": before, asserted no Description card; after, asserts Description shows 'Nothing added yet.' (FD-04).
  - "empty state: no sections and no documents…": before, rendered through the page (canEdit true); after, renders `FamilyInfoView` with `canEdit={false}`, because the empty state now shows only when the viewer cannot edit (FD-04). The page always passes `canEdit`, so the page shows the three cards instead.
- Reason: behaviour change recorded in FD-02 and FD-04; no assertion on look, focus or wrapping was dropped.
- Human confirmation required: yes (review the flagged tests in the PR).

### FD-07 — Temporary header wiring for verification only
- Date: 2026-10-01
- Context: `getClientHeaderSummary` is unimplemented under `DATA_SOURCE=supabase`, so no Family page renders against real data. No plan feature owns it.
- Decision: a local, uncommitted patch of `src/server/clients/queries.ts` is used to run the FAM-09 browser check and e2e, then reverted. The patch and a draft feature card are in `TEMP_HEADER_WIRING.md`. The gap is to be picked up as its own shared feature; the PR for FAM-09 must say verification used the temporary patch.
- Human confirmation: Dhruv Verma, 2026-10-01 (in-session).

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
