# INT-10 — Budget threshold email names the bucket

| Field | Value |
|---|---|
| Feature ID | INT-10 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main` |
| Feature branch | `feature/shared-budget-threshold-email-bucket-name` |
| Documentation | `docs/development/shared/shared-budget-threshold-email-bucket-name/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D18 |
| Status / owner | See PROGRESS.md |

## Purpose
Say which bucket crossed its threshold.

## Problem
INT-01's email names only the client. A client with several buckets (e.g. Government allocation, NDIS) cannot tell which one needs attention. Parking lot PL-26, parked by CHG-044, promoted by CHG-050.

## Description
The threshold warning email includes the name of the bucket that crossed the threshold.

## User value
Family and admins go straight to the right bucket.

## Users
- Family
- Admin

## Scope
- Email body: "The Schedule of Care Program for <CLIENT NAME> has reached <N>% of its <BUCKET NAME> allocation for the present period. Log in and refer to plan." (FD-01).
- `src/server/jobs/budget-thresholds.ts` reads each due bucket's name (`budget_buckets.name`) via the existing admin client.

## Out of Scope
- Any change to thresholds, recipients, idempotency, scheduling, subject line, provider or the snapshot function.
- The pending-cost email (PL-25).
- A migration.

## Dependencies
- Features: INT-01 (merged)
- Blocking open decisions: None
- Non-blocking open decisions: None

## Inputs
- Due (bucket, threshold) pairs from `budget_thresholds_snapshot()`; bucket names from `budget_buckets`.

## Outputs
- Same emails as INT-01, with the bucket named.

## Error / Edge Cases
- Bucket name lookup returns nothing (bucket removed mid-run): fall back to the INT-01 wording without the bucket, never skip or fail the send.
- Single-bucket client: bucket still named; reads as one sentence.

## Security / Permissions
- Service-role job only, as INT-01. Bucket name is client data: not logged, not returned in the job result.

## Technical Considerations
- No new dependency, no migration, no new table.

## Traceability
- Product requirements: REQ-31
- Sources: CHG-044, CHG-050, INT-01

## Labels
CONFIRMED
