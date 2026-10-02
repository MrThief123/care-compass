# Decisions — INT-10 Budget threshold email names the bucket

## Open decisions affecting this feature
None.

## Feature decisions log

### FD-01 — Wording and bucket lookup
- Date: 2026-10-02
- Context: PL-26 asks the email to name the bucket for multi-bucket clients; copy was unspecified.
- Decision: always name the bucket, single or multi: "The Schedule of Care Program for <CLIENT> has reached <N>% of its <BUCKET> allocation for the present period. Log in and refer to plan." The job reads `budget_buckets.name` with its admin client; no migration, no snapshot change.
- Reason: simplest; one template, no bucket-count query; reads fine for one bucket.
- Alternatives considered: only name the bucket when the client has more than one (extra query and two templates); add `bucket_name` to `budget_thresholds_snapshot()` (migration for no gain).
- Consequences: INT-01's body text is the only changed output. INT-01's tests never asserted the full body, so none changed.
- Human confirmation required: no (wording chosen as the simplest; human may amend in PR review).
