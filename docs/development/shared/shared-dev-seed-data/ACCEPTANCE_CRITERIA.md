# Acceptance Criteria — F0-16 Development seed data from the design content

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given `supabase db reset`, when the budget summary for Margaret is queried, then NDIS remaining 14880, Fixed 2750, Government 240 are returned. | NOT MET |
| AC-02 | US-01 | happy | Given the seed, when signing in as Helen, Aisha and Priya with seed credentials, then each succeeds and lands on their role home. | NOT MET |
| AC-03 | US-01 | security | Given NODE_ENV=production, when the seed script runs, then it exits non-zero without writing. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
