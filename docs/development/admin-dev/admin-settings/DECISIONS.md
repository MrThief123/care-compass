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
