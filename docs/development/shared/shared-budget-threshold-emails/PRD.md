# INT-01 — Automatic budget threshold emails

| Field | Value |
|---|---|
| Feature ID | INT-01 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-budget-threshold-emails` |
| Documentation | `docs/development/shared/shared-budget-threshold-emails/` |
| Lane | B — Backend |
| Sprint | STRETCH · planned D11–D12 |
| Status / owner | See PROGRESS.md |

## Purpose
Warn people before funds run out.

## Problem
Thresholds, recipients, provider and scheduler are undecided.

## Description
Sends plain-language warning emails without operator input when a bucket reaches each configured threshold.

## User value
Delivers the client's repeatedly emphasised requirement that previous groups missed.

## Users
- Family
- Admin
- Carer (per OQ-28)

## Scope
- `budget_threshold_notifications` (bucket_id, threshold, period_start, sent_at) unique(bucket_id, threshold, period_start).
- Job `src/server/jobs/budget-thresholds.ts` using the service-role client; invoked by scheduler (OQ-17) via protected Route Handler `/api/jobs/budget-thresholds` with secret header.
- Email template: 'The Schedule of Care Program for <CLIENT NAME> has reached <N>% of its allocation for the present period. Log in and refer to plan.' (CIS5 wording; program name configurable).
- Recipients per OQ-28; exclude users from organisations no longer serving the client and inactive profiles.
- Email provider adapter interface with a test double.

## Out of Scope
- In-app budget notifications (excluded D23)
- Appointment reminder emails (parked)

## Functional Requirements
- Each threshold email sent at most once per bucket per period.
- Spending that jumps past several thresholds sends each crossed threshold once (PROPOSED) — or only the highest (confirm).

## UI / UX Requirements
- None (email).

## Dependencies
- Features: F0-12 (Budget buckets, fund top-ups, spending and summary calculation), FAM-10 (Family — Budget overview and history)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-03, OQ-17, OQ-28
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- Budget summaries

## Outputs
- Emails
- Notification records

## Error / Edge Cases
- Email provider failure → not marked sent; retried next run.
- Funds added dropping usage below threshold then re-crossing in same period → no second email (per 'once per period').

## Security / Permissions
- Job endpoint rejects requests without the secret.
- Service-role use confined to jobs directory.

## Technical Considerations
- Idempotent via unique constraint insert-before-send pattern with status.

## Traceability
- Product requirements: REQ-31 (Budget warning emails are sent automatically, once per threshold per period, email only.)
- Sources: BRIEF item 8; CIS3 Data Entry 6a; CIS5 Sending Notification (template wording; removed organisation gets no emails); UI-D4, D23; US P-18; UC-F02, UC-F03; TM-2808 (scheduled server-side jobs); ADR-02 consequence (service role only in jobs)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
