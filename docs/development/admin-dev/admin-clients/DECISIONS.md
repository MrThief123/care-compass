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
  3. **Empty-state copy changed**: "Add a client to get started" → "Clients appear here once their
     family links your organisation" — the old copy referenced the removed Add-client action, so it
     would have been actively misleading (there is no add button to follow it with). Undesigned
     (PD-052-style, no copy exists for this state post-PD-037); flagged for review like any undesigned
     copy.
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

### FD-02 — New RLS policy: an admin can read a linked family member's profile
- Date: 2026-09-29
- Context: implementing FD-01's family-contact derivation revealed a real RLS gap, not just a query
  bug: `client_family_members_select` already lets an admin read the *link* row for their own clients,
  but the linked `profiles` row has its own RLS, and neither existing SELECT policy
  (`profiles_select_self`, `profiles_select_same_org`) covers it — a self-registered family account
  usually has no `organisation_id` at all (PD-057), so `profiles_select_same_org` never matches. The
  family contact's name was invisible to the admin under RLS even though AC-01 requires showing it.
- Decision: new migration `supabase/migrations/20260929020000_admin_clients_family_contact.sql` adds
  `profiles_select_linked_family`: a profile becomes readable to a caller when it is linked, via
  `client_family_members`, to a client that caller administers (`is_admin_of_client`). Narrow and
  additive — nothing about an existing policy changes, and only a profile actually linked to one of the
  caller's own clients becomes visible.
- Reason: PD-002/ADR-03 (authorisation lives in the database) — the fix belongs in RLS, not in
  application code working around a query that silently returns nothing.
- Alternatives considered: a SECURITY DEFINER RPC that looks up the name and bypasses `profiles`' own
  RLS entirely (rejected — a new RLS policy is narrower, and keeps the existing `profiles` SELECT the
  single, RLS-governed read path CLAUDE.md §7 expects, rather than adding a second one specific to this
  screen); denormalising the family contact's name onto `client_family_members` at write time (rejected
  — no write path adds those rows outside `register_account()`/future features, and the extra
  denormalised column would need its own sync logic for a problem RLS already solves cleanly).
- Consequences: any other feature reading `profiles` gains this one additional visibility case for
  free (an admin reading a family member linked to their own client) — checked this is never wider than
  what `client_family_members_select` already permitted for the link itself, so no new leak.
- Human confirmation required: no — a narrow, additive RLS fix required for this feature's own AC-01 to
  work at all, not a design choice. Flagged here and in the PR since it touches the shared `profiles`
  table's RLS (Lane B territory) from a Lane A feature, following the same "flag rather than hide"
  approach as FD-01/ADM-02's out-of-lane file.
- Test changes caused: none. New coverage: `supabase/tests/admin_clients.test.sql` (5 pgTAP cases:
  admin reads their own linked family member, not another org's; the family member still reads their
  own profile via the untouched `profiles_select_self`; anon reads nothing).
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
