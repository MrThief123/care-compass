# Decisions — F0-17 Self-serve sign-up for Family and Organisation accounts

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared work | YES | ANSWERED (PD-030) |
| OQ-07 | Client record creation and family linking | YES | ANSWERED (PD-037) |
| OQ-08 | Account provisioning, sign-in method and MFA | YES | ANSWERED (PD-040; amended by PD-057) |
| OQ-30 | Multi-client family accounts | no | One client per sign-up; switcher parked (PL-15). |

## Project decisions this feature implements
- PD-057 / CHG-010: self-serve Family and Organisation sign-up; carers invite-only; no email confirmation; same look as sign-in.
- CHG-010 risk 1: admin MFA follows whatever F0-07 shipped on `main`; this feature does not change it.

## Feature decisions log

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
