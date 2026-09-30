# Decisions — F0-21 Auth security audit

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| — | Which claim RLS reads for the AAL check | no | `auth.jwt() ->> 'aal'` |

## Feature decisions log
None yet. Created by CHG-041 (root DECISIONS.md).

## Proposed scope addition (needs a human-confirmed CHG before it enters the PRD)
- Missing config is found only when a page first needs data: no boot-time env validation and no health endpoint. Found in F0-20 manual testing on 2026-10-01 (server started without `DATA_SOURCE`: sign-in and 2FA worked, then `/admin/home` showed "This page couldn't load"). Proposal: validate required env vars at server start and add a health endpoint that checks config and database, used by the host's readiness check, plus a required-env list in the deploy checklist.
