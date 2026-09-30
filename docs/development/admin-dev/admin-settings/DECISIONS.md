# Decisions — ADM-10 Admin — Settings

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-35 | Settings forms save behaviour | ANSWERED (PD-054) | Add a Save button per card; Role read-only for carers; email field is contact email only. |

## Feature decisions log

### FD-01 — Docs brought up to date
- Planning pack said `admin-dev`, OQ-35 open, ADM-UI-05 not started. Now: target `main` (CHG-036), OQ-35 ANSWERED (PD-054), ADM-UI-05 merged. AC-04 to AC-06 added before any implementation (Save persists, failed save, Reset), from PRD scope; AC-01 to AC-03 unchanged.

### FD-02 — Write path is an RPC, not a table grant
- Decision: `admin_update_organisation(p_name, p_abn, p_phone, p_address)` SECURITY DEFINER, org from `admin_current_org_id()` (ADM-02). No `update` policy or grant on `organisations`.
- Reason: matches `admin_update_staff`; no organisation id from the caller, so "another organisation" cannot even be addressed. Audit trigger on `organisations` already exists (F0 audit log).
- Consequences: additive migration only; nothing else reads or writes these columns differently.

### FD-03 — ABN rule
- 11 digits, spaces allowed, stored `XX XXX XXX XXX`, no checksum (synthetic data; PRD 'PROPOSED' validation). Checked in Zod and again in the RPC (22023). Non-blocking; confirm with the human.

### FD-04 — Reset card
- Reuses `requestOwnPasswordReset` (FAM-12), so it goes to the sign-in email, not the contact email (PD-054). Screen swaps the preview notice for real sent/failed messages.

### FD-05 — Table UPDATE revoked on organisations
- Decision: the migration also runs `revoke update on organisations from anon, authenticated`.
- Reason: with RLS and no update policy a direct update silently matches zero rows; T-03 requires a refusal (42501). Same pattern as `profiles` and `documents`.
- Consequences: additive; nothing else updates `organisations` as `authenticated` (service role unaffected).

### FD-06 — Changed existing tests (ADM-UI-05) — HUMAN REVIEW: test expectation changed
- `settings-screen.test.tsx`: the screen now calls server actions, so the file mocks `next/navigation`, `updateOrganisationSettings` and `requestOwnPasswordReset`. Before: 'saves local changes ... resets on remount' expected 'Organisation details saved' and a reset on remount; after: expects 'Saved.' and unmutated props. Before: 'clears saved feedback' expected no 'saved' text straight after clicking Save; after: waits for 'Saved.' then expects it cleared on typing. Before: reset expected 'No email was sent'; after: expects the sent message and unchanged details. Reason: the local-preview behaviour and notices were removed (this feature's scope). No assertion dropped.
- `queries.test.ts`: 'rejects unwired live mode' replaced by a live-mode read test (`[ADM-10][AC-01]`); live mode no longer throws.

### FD-07 — ABN storage
- FD-03 confirmed as built: the Zod schema lives in `src/server/admin/settings-schema.ts` (shared by screen and action); the RPC re-checks. Still non-blocking; human to confirm no checksum.

### FD-08 — Generated types
- `database.types.ts` got only the `admin_update_organisation` entry by hand: the generator in this CLI version reorders unrelated entries (about 450 lines of noise). The action types `.single<Row>()` because the hand entry has no `SetofOptions`.

### FD-09 — Edit and Cancel flow (AC-07)
- Date: 2026-09-30
- Context: reviewing the preview, the human asked for Organisation info to work like Family info (CHG-024): read-only until Edit, then Save and Cancel. ADM-UI-05 built it always-editable with Save only.
- Decision: added AC-07. Same behaviour as Family info; built locally in `src/features/admin-settings/` because the kit's `DetailsFormCard` has no Cancel slot (no shared edit, CLAUDE.md §4.2).
- Test changes caused: ADM-UI-05 and ADM-10 component tests now click Edit before typing or saving (`settings-screen.test.tsx`, `settings-wiring.test.tsx`), no assertion removed. **HUMAN REVIEW: test expectation changed** (requirement change confirmed by the human in session).
- Human confirmation required: given, this session.

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
