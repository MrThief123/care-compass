# Decisions — F0-16 Development seed data from the design content

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-22 | Event fields | no | Add Title, Start time and Duration fields to the event form (design update). |
| OQ-29 | Which nurse is shown on an event | no | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |

## Feature decisions log

### FD-01 — Helen's seeded login is helen.doyle@example.com
- Date: 2026-09-30
- Context: the PRD lists Helen's email as helen@example.com. Eight pgTAP files (audit_log, budget, care_events, documents, profiles_update, shifts, tenancy_rls, transfer_client_organisation) insert the same throwaway address into `auth.users`, so once `supabase db reset` seeds it, `supabase test db` fails on the unique email.
- Decision: seed Helen as `helen.doyle@example.com`; leave the pgTAP files alone. F0-16 PRD.md, PROGRESS.md, `docs/JIRA_TICKETS.md` and `docs/JIRA_BACKLOG.csv` (the F0-16 cards) updated to match. The Family Settings design, its docs and the mock fixtures keep helen@example.com: that is design content, not the seed.
- Reason: the address was made up in the PRD; this touches no existing test.
- Alternatives considered: change the emails in the eight pgTAP files (rejected by the human).
- Consequences: signing in as Helen locally uses `helen.doyle@example.com`, so a screen that prints her email shows a different address from the design until Family Settings is wired to data.
- Human confirmation required: answered 2026-09-30 (Prajeet).
- Test changes caused (if any): none to existing tests. T-01 to T-03 were first written with `helen@example.com`, before the clash showed; changed to `helen.doyle@example.com` (same assertions).

### FD-02 — Events start in the design week; "Mon, Fri" physiotherapy is weekly from Monday
- Date: 2026-09-30
- Context: recurrence is only `{frequency, interval}` (src/lib/recurrence, PD-046), with no weekday choice, so "Mon, Fri" cannot be stored. Overdue is derived: a daily event that starts in October would show every earlier day as Overdue. The designs also disagree with themselves (Physiotherapy done on Sat 28 Nov but planned Mon 30 Nov and Fri 4 Dec; Medication review at 10:00 on Sat 28 Nov, 14:00 on Sat 5 Dec).
- Decision: each event starts at its first occurrence in the design week (26 to 30 Nov), so exactly the two occurrences the designs mark Overdue are Overdue (Weekly weigh-in, Medication review). Physiotherapy repeats weekly from Mon 30 Nov 11:30. Medication review is fortnightly at 14:00 as the PRD says. Morning medication on Sat 28 and Sun 29 Nov is also Done (no design row, but a daily event has those days).
- Reason: gives the Home, Task log and Admin Home states the PRD asks for using only what the schema can store.
- Alternatives considered: start events in September and seed a long completed history (as `src/mocks/history.ts` does) — much larger, out of the PRD's scope.
- Consequences: Physiotherapy's Done row on Sat 28 Nov and the long Task log history are not seeded. A screen built from the seed can differ from the design's row list there.
- Human confirmation required: yes (Prajeet), especially the Medication review time.

### FD-03 — Opening balance entries make fund totals agree
- Date: 2026-09-30
- Context: the design's three fund-history rows do not add up to the bucket totals.
- Decision: each bucket has a 1 Jul 2026 `bucket_added` entry "Opening balance" (NDIS 18,000, Fixed 4,000, Government 2,250); the three design rows are `funds_added`. Used amounts are `paid` costs with no event (NDIS 9,120, Fixed 2,250, Government 2,760). The Physiotherapy event carries $90 against NDIS, but no occurrence is completed, so it charges nothing yet.
- Reason: as the PRD's edge case directs.
- Human confirmation required: no.

### FD-04 — Seed shape: seed.sql plus a guarded script for the files
- Date: 2026-09-30
- Context: `supabase db reset` loads only SQL, which cannot put file bytes in Storage; AC-03 needs a script that can refuse to run.
- Decision: `supabase/seed.sql` holds all rows and users and refuses a non-empty database; `scripts/seed.mjs` (`npm run db:seed`) uploads five identical 193-byte placeholder PDFs and refuses `NODE_ENV=production` or a non-local Supabase URL before any request. Seed runs with `session_replication_role = replica`, so no audit rows or cost charges are created and the data is identical each run. Users are inserted straight into `auth.users` / `auth.identities` with a fixed bcrypt salt.
- Reason: one source of rows, deterministic, no second data path.
- Consequences: after every `db reset` the script must be run for documents to open.

### FD-05 — Differences from the PRD text, and one extra organisation name
- Date: 2026-09-30
- Context: the PRD lists Banksia's ABN, phone and address, and Daniel K. as a Registered Nurse; the mock fixtures (`src/mocks/fixtures.ts`) differ (ABN 12 345 678 901, Ringwood address, Daniel Enrolled Nurse, Fatima Registered Nurse). Carer access no longer uses assignments (F0-18), so the PRD's implied assignments are shifts. `pgTAP` sign_up test 21 expects exactly one organisation named "Wattle Care".
- Decision: follow the PRD for the seed (Preston address, ABN 54 123 456 789, Daniel Registered Nurse, Fatima Support Worker); the mocks are not changed. The second organisation is "Kookaburra Care" so it cannot clash with that test. Access comes from shifts.
- Human confirmation required: yes (Prajeet) — say if the mocks or the PRD should be brought in line.

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
