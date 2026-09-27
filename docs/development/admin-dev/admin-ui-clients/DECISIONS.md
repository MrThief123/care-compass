# Decisions — ADM-UI-04 Admin Clients screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-06 | Organisation change model | no | Family-initiated change per the latest design; Admin 'Remove' detaches without deleting. Picker design required. |
| OQ-07 | Client record creation and family linking | no | Admin adds client + family contact email → family receives an invitation to set a password; confirm. |

## Feature decisions log

_No decisions recorded yet._

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

### FD-01 - Local preview authorization (2026-09-27)
- Human requested Admin Clients UI and a local site, with no commits or pushes.
- Human explicitly requested all this work on admin-dev. Isolated worktree uses admin-dev at 697c646; existing Family worktree is untouched.
- This session instruction overrides feature-branch, remote-claim and commit/push workflow for this preview.
- Human authorized adding src/server/admin/clients-queries.ts and src/mocks/admin-clients.ts.
- No shared UI components changed; synthetic fixtures only.

### FD-02 - Requirements conflict awaiting human direction
- PD-037 answers OQ-07: families create clients; the Admin Add client design must be reworked or removed.
- ADM-UI-04 PRD and AC-02 still require the Add client form. Asked whether to show list only or retain the form as a local preview exception. Do not finalize the route until answered.
- CHG-020 adds full admin client access in later ADM-11/ADM-04 work. This preview does not implement those routes or authorization.
- OQ-06 is answered by PD-036. Remove remains inactive in this Phase 1 feature.
- No Clients reference image exists in docs/design/screens. Using the existing Staff composition for the draft; exact pixel comparison is not available.

### FD-03 - Test helper type correction
- Removed unsupported exact: true from getByRole options in the new form tests.
- String accessible-name matching is already exact. Assertions and intended behavior unchanged.

### FD-04 - Human approved preview-only Add client exception
- Human explicitly chose "Keep Add client for this preview only."
- The local form remains; no database writes, invitations or persistence.
- PD-037 remains unchanged for production. No controlled requirements edited.
- Full admin client-view work under CHG-020 remains in its separate feature.
- Query test uses an explicit missing-fixture guard to satisfy strict indexed-access typing; assertions unchanged.

### FD-05 - Commit and push authorization (2026-09-27)
- Human requested committing and pushing this Clients work to the relevant branch and verifying its check status.
- Existing explicit instruction to use admin-dev remains in force; this overrides the usual feature-branch workflow for this work.
- The prior no-commit/no-push restriction is superseded.
- Add client remains fixture-only; PD-037 production workflow is unchanged.
- Report actual remote check results for the pushed SHA, distinguishing passes, skips and failures.

### FD-06 - Restore normal Admin UI feature branch workflow
- Human clarified: "do it how the other admin-ui stuff is done."
- Work is on feature/admin-ui-clients, based on origin/admin-dev; PR target admin-dev.
- The initial implementation commit 6ce0735 is preserved intact. No admin-dev push reached origin, verified with ls-remote.
- Local admin-dev now points back at unchanged origin/admin-dev (697c646); no remote history rewritten.
- This supersedes FD-05's direct-admin-dev branch instruction.
