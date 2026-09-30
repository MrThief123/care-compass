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
