# Decisions — ADM-04 Admin — Clients list and add client

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Answer |
|---|---|---|---|
| OQ-07 | Client record creation and family linking | YES | ANSWERED — PD-037: the family creates the client record and assigns a provider organisation; admin never creates a client. The original proposed default (admin adds client + invites family) is explicitly rejected. |
| OQ-08 | Account provisioning, sign-in method and MFA | YES | ANSWERED — PD-040/PD-057, but no longer applies to ADM-04: this feature creates no account any more (see CHG-035). |

## Feature decisions log

### FD-01 — CHG-035 applied; family-contact derivation; Remove stays unwired (ADM-05's scope)
- Date: 2026-09-29
- Context: CHG-035 (root DECISIONS.md) instructed this feature to correct its own stale docs
  (PD-037/CHG-010) before implementing. Having done that, two further implementation choices had no
  existing precedent: how to pick a display name when a client has more than one linked family
  member, and what to do with the Remove control ADM-UI-04 already drew.
- Decisions:
  1. **Family contact**: a client's first linked `client_family_members` row (joined to `profiles`,
     ordered by the profile's first name for determinism), shown as their full name (PD-038). A
     client with none shows "—". Undesigned corners (PRD.md Error/Edge Cases, both PROPOSED) — the
     design draws one name per row and PD-037's flow normally links exactly one family member, but
     neither is guaranteed by the schema.
  2. **Remove stays exactly as ADM-UI-04 built it**: a local-state-only preview (click Remove → confirm
     → row disappears until reload, no server call). ADM-04's own PRD Scope explicitly excludes wiring
     Remove for real ("Remove handled by ADM-05") — only the now-removed Add-client panel was this
     feature's write concern, and that write path is gone entirely (PD-037), not replaced by anything.
     `getAdminClients()` is a read-only contract; there is no `clients-actions.ts` in this feature.
- Reason: (1) follows the same pattern `documents/queries.ts`'s `uploader` embed and FAM-10's
  `getFundHistory` already use for a denormalised display name from a join; (2) is what the PRD's own
  Scope already said, restated here because implementing this feature could easily be mistaken for
  "wire everything ADM-UI-04 drew," which it is not.
- Alternatives considered: erroring on a client with zero or multiple family members (rejected — the
  screen needs to render regardless, and PD-037's flow makes multiples rare, not exceptional); wiring
  Remove now since it is simple (rejected — it is explicitly ADM-05's scope in this feature's own PRD,
  and ADM-05 has its own blocking OQs to resolve first).
- Consequences: none beyond what is stated above.
- Human confirmation required: no — CHG-035 already carries the human-relevant decision (PD-037/
  CHG-010); these are implementation defaults for undesigned corners, flagged here for review.
- Test changes caused: `src/features/admin-clients/clients-screen.test.tsx`'s Add-flow tests (empty
  client-name validation, "adds locally", "rejects invalid contact details", and the empty-list test's
  reference to the add form) removed, since the Add-client panel itself is removed (CHG-035, not a
  test bug — the feature the tests covered no longer exists). Remove-flow and rendering tests kept
  unchanged. A new test asserts no Add-client control exists at all (AC-04). Flagged HUMAN REVIEW in
  PROGRESS.md and the PR.

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
