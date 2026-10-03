# Decisions — INT-07 Scale and performance verification

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-17 | Hosting, email, scheduler, environments and availability | no | Vercel (or equivalent) + Supabase paid tier; Resend (or Supabase SMTP) for email; Vercel Cron or pg_cron for jobs — confirm budget with client. |

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

## FD-01 — Confirmed local budget and dataset (2026-10-03)

The human confirmed p95 below 1 second for Home, Calendar week and Task log, using 500 recurring events per client across 50 synthetic clients. Measure 20 samples per operation using nearest-rank p95 (19th sorted sample). Keep warm-up separate. Local-only assurance, not a production SLA. OQ-01 and OQ-17 were already answered in root DECISIONS.md (PD-030/PD-050).
