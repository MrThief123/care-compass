# Decisions — ADM-02 Admin — Staff list and add/edit staff

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-08 | Account provisioning, sign-in method and MFA | YES | Email + password via Supabase Auth, invitation emails for new users, TOTP MFA required for admins; confirm. |
| OQ-13 | Staff names and job titles | YES | Store first and last name; display first name + initial everywhere (matches design); job titles are a per-organisation editable list seeded with the three design values. |
| OQ-36 | Staff deactivation | no | Design a Deactivate action in the Add/edit panel with confirmation. |

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
