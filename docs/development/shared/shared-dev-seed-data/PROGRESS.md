# Progress — F0-16 Development seed data from the design content

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D7
Branch: `feature/shared-dev-seed-data` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-11 — NOT STARTED
- F0-12 — NOT STARTED
- F0-13 — NOT STARTED
- F0-10 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Organisation Banksia Home Care (ABN 54 123 456 789, 03 9555 0102, 220 High St, Preston VIC 3072) and a second organisation for negative tests.
- Admin Priya; carers Aisha Rahman (Registered Nurse, 0423 987 654), Daniel K. (Registered Nurse), Sarah Nguyen (Enrolled Nurse), Marcus Chen (Support Worker), Fatima Ali (Support Worker).
- Clients Margaret (78, Preston VIC; family Helen, 0412 345 678, helen@example.com, 12 Wattle St, Preston VIC 3072), Robert (82, Reservoir; Michael), Elsie (90, Thornbury; Susan), Frank (76, Northcote; Karen), Doris (85, Preston; Tom), Harold (79, Coburg), Jean (88, Fairfield).
- Margaret's info sections (Description, Habits, Medical history) with the design text; documents Care plan.pdf, Medication schedule.pdf, Physio referral.pdf, Exercise plan.pdf, Medication chart.pdf (placeholder PDFs).
- Events around reference date Mon 30 Nov 2026: Morning medication 09:00 1 hr (daily per calendar), Physiotherapy 11:30 1 hr 30 min (Mon, Fri), Afternoon check-in 15:00 1 hr, Wound dressing check 10:00, Weekly weigh-in 09:30, Medication review 14:00, Evening medication; completions/overdue states matching Family Home, Task log and Admin Home.
- Budgets: NDIS $24,000 / $9,120 used; Fixed $5,000 / $2,250; Government $3,000 / $2,760; fund history 3 Nov 2026 +$6,000 'NDIS quarterly plan top-up', 15 Oct 2026 +$1,000 'Fixed funding top-up', 1 Oct 2026 +$750 'Government subsidy payment'.
- Shifts for Aisha (including 11:30–13:00 with Margaret used by the conflict warning) and Daniel K.
- Test users with known local-only passwords; seed guarded so it never runs outside local/test.

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/seed.sql`, `scripts/seed.ts`, `docs/SEED_DATA.md`, `tests/integration/seed.test.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-16, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
