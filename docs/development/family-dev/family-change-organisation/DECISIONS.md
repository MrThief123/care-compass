# Decisions — FAM-13 Family — Change organisation

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-06 | Organisation change model | YES | Family-initiated change per the latest design; Admin 'Remove' detaches without deleting. Picker design required. |
| OQ-15 | Incoming organisation's visibility of history | YES | Incoming organisation sees full history, labelled with the organisation that recorded it. |
| OQ-28 | Budget email recipients and budget period | no | Family + current organisation admins; registry parked (PL-02); period = bucket period. |

## Feature decisions log

### FD-01 — Two functions added from Lane F: the transfer and the picker's list
- Date: 2026-09-25
- Context: the PRD scopes `transfer_client_organisation(client_id, new_org_id)` to this feature, and the picker must list organisations. `supabase/**` is Lane B's folder (docs/AGENT_REFERENCE.md, CLAUDE.md §4.2); the human accepted the same route for FAM-12 (its FD-01) and asked for FAM-13 next, without answering the folder question again.
- Decision: added `supabase/migrations/20260925020000_transfer_client_organisation.sql` with (1) `transfer_client_organisation(p_client_id, p_new_org_id)` and (2) `list_organisations_for_transfer(p_client_id)`. Both are SECURITY DEFINER with a fixed search path, execute granted to `authenticated` only, and both refuse (42501) anyone who is not a family member of the client, including admins and carers of the client's own organisation. pgTAP `supabase/tests/transfer_client_organisation.test.sql` (26 tests).
- Reason: families have no UPDATE policy on `clients`, `shifts` or `carer_client_assignments` and must not get one; one function keeps the change in one transaction.
- Alternatives considered: waiting for Lane B; policies that let families update those tables (too broad).
- Consequences: **HUMAN REVIEW: the PR touches `supabase/**`.** `src/lib/supabase/database.types.ts` gained the two function types by hand (a full regeneration also pulls in unrelated drift such as `audit_log`).
- Human confirmation required: yes, at PR review.
- Test changes caused: none.

### FD-02 — Picker first, then the destructive confirmation; 'Change' is absent when there is nowhere to go
- Date: 2026-09-25
- Context: PD-036 and the PRD Scope have Change lead to a picker and then the confirmation. The picker is not designed (OQ-19). FAM-UI-06 FD-01 had Change open the confirmation directly.
- Decision: 'Change' opens "Choose a new organisation": the kit's `ConfirmationModal` (focus trap, Escape, focus back to Change) with a radio list of organisations. The client's current one is listed, marked "Current" in words, and disabled. 'Continue' with nothing chosen says "Choose an organisation to continue." With one chosen it opens the unchanged destructive dialog ("Change organisation?", FAM-UI-06 FD-04 wording). Cancel, X or Escape at either step call nothing. If no organisation other than the current one exists, or the client has none, the card has no Change button (absent, not disabled) and says "There is no other organisation registered with Care Compass yet."
- Reason: no shared-kit change; the same radio-row pattern as FAM-UI-08's Paid from; PRD Error/Edge Cases (current organisation not choosable).
- Alternatives considered: a new dialog component (a second copy of the focus-trap code); a `<select>` (no room for "Current").
- Consequences: **the picker layout and wording are proposed, undesigned: HUMAN REVIEW / design review.** The confirmation does not name the new organisation (the PRD wording is kept exactly).
- Human confirmation required: yes, design review.
- Test changes caused: see FD-07.

### FD-03 — The organisation list is a function, not a policy
- Date: 2026-09-25
- Context: `organisations_select_member` lets users read only their own organisation, so a family member (no organisation) sees none.
- Decision: `list_organisations_for_transfer` returns id, name and `is_current` for every organisation, only to a family member of that client. An `organisations` SELECT policy for families would expose ABN, phone and address.
- Reason: least data out.
- Alternatives considered: a policy on `organisations`; a view.
- Consequences: every organisation's name is visible to any family member of any client (OQ-06: "organisations registered with Care Compass"). Raise if a provider should be able to opt out.
- Human confirmation required: no.
- Test changes caused: none.

### FD-04 — What the transfer does to shifts and assignments
- Date: 2026-09-25
- Context: the PRD: end active carer assignments, cancel shifts starting after now(); in-progress shift PROPOSED ended at now().
- Decision: assignments with no end, or an end in the future, get `ended_at = greatest(now(), started_at)` (a future-dated one ends at its own start, so it can never become active). Shifts that have not started and are not cancelled get `cancelled_at = now()`. A shift in progress (`starts_at < now() < ends_at`, not cancelled) gets `ends_at = now()` and is not cancelled. Finished and already-cancelled shifts, and ended assignments, are untouched and keep the organisation that made them (history, REQ-N6). A shift starting exactly at now() counts as not started.
- Reason: the PRD; `shifts_ends_after_starts` forbids ending a shift at its own start.
- Alternatives considered: cancelling the in-progress shift (loses the time already worked).
- Consequences: the transfer is audited by the F0-08 triggers (actor Helen, role family, Banksia to Wattle), tested.
- Human confirmation required: no (the in-progress rule is the PRD's PROPOSED default; confirm at review).
- Test changes caused: none.

### FD-05 — AC-03 is proven on the tables that exist
- Date: 2026-09-25
- Context: AC-03 says events, budget entries, documents and completions have equal counts after a transfer. Those tables come with F0-11, F0-12 and F0-13, which are not merged.
- Decision: the transfer function touches only `clients`, `carer_client_assignments` and `shifts`; nothing else is written or deleted. AC-03 is tested with what exists: information sections, family links, shifts and assignments all keep their counts (pgTAP and integration). The function is a single organisation change, so tables keyed by `client_id` are unaffected by construction.
- Reason: nothing to count yet.
- Alternatives considered: waiting for F0-11 to F0-13 (blocks this feature).
- Consequences: **HUMAN REVIEW: AC-03 is met for the current schema only.** When F0-11, F0-12 and F0-13 merge, add their counts to the pgTAP test, and review any table that carries its own `organisation_id` (a comment in the migration says so). OQ-15 (the incoming organisation sees history, labelled with who recorded it) depends on those tables' RLS and is not built here.
- Human confirmation required: yes, at PR review.
- Test changes caused: none.

### FD-06 — Phase 1 (mock data source) cannot move a client, and says so
- Date: 2026-09-25
- Context: the fixtures are read-only; simulating a move would leave the card and the header on Banksia.
- Decision: with `DATA_SOURCE=mock`, `changeClientOrganisation` returns `NOT_AVAILABLE` with "Choosing a new organisation is not available yet." (the FAM-UI-06 wording) and the screen shows it, unchanged. `getOrganisationChoices` lists the fixture organisations; `OTHER_ORGANISATIONS` (Wattle Care, Eucalyptus Community Care) was added to `src/mocks/fixtures.ts`.
- Reason: honest previews; FAM-UI-06's behaviour is kept.
- Alternatives considered: an in-memory transfer (a mutable fixture the header would not follow).
- Consequences: **`src/mocks/fixtures.ts` is a Lane S file edited from Lane F** (additive; HUMAN REVIEW).
- Human confirmation required: yes, at PR review.
- Test changes caused: none.

### FD-07 — FAM-UI-06 test helpers changed (recorded requirement change: the picker comes first)
- Date: 2026-09-25
- Context: FAM-UI-06's helper `openChangeDialog` clicked 'Change' and expected the confirmation. FAM-13 puts the picker between them.
- Decision: in `src/features/family-settings/family-settings.test.tsx`: (1) `openChangeDialog` now also chooses "Wattle Care" in the picker and presses Continue before returning the confirmation; (2) `renderSettings` passes the contract's organisations; (3) the AC-04 test awaits the "not available yet" message, because the action is asynchronous. No assertion was changed or removed. Separately, before implementation, I changed my own new test "no other organisation" from "the picker says so" to "no Change button" (FD-02); it had not passed yet.
- Reason: the requirement changed; the behaviour the tests protect is intact.
- Human confirmation required: yes. **HUMAN REVIEW: test expectation changed (helpers only).**
- Test changes caused: FAM-UI-06 helpers only, as above.

### FD-08 — Non-blocking defaults and wording
- OQ-28: budget-email recipients follow the client's current organisation admins; re-deriving them is INT-01's, not built here.
- Notifying either organisation by email is out of scope (PRD).
- Wording is proposed and flagged: "Choose a new organisation", "Organisations registered with Care Compass", "Current", "Continue", "Choose an organisation to continue.", "{client}'s care has moved to {organisation}.", "Couldn't change the organisation. Try again.", "Only the client's family can change the organisation.", "That organisation is no longer available. Choose another.", "That is already the current organisation.", "There is no other organisation registered with Care Compass yet."
- Human confirmation required: no; design review.

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
