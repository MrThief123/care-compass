# Test Plan — FAM-UI-08 Family event cost fields (UI)

## Approach
Tests are written before production code (TESTING.md §2). Run them and confirm they fail for the expected reason before implementing.

## Test levels used
- **unit** → `src/**/<module>.test.ts`
- **component** → `src/**/<component>.test.tsx`
- **e2e** → `tests/e2e/<feature>.spec.ts`

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Entering a cost and picking NDIS holds $90.00 from NDIS; each bucket option shows its remaining balance | ☐ | NOT RUN |
| T-02 | AC-02 | unit | Cost/bucket schema refuses 0, negatives, 3 decimals, and a cost with no bucket; accepts no cost and no bucket | ☐ | NOT RUN |
| T-03 | AC-03 | component | A $0 bucket and a bucket with pending costs are struck through, read "No funds left", and cannot be chosen by click or keyboard | ☐ | NOT RUN |
| T-04 | AC-04 | component | A cost above a selectable bucket's balance shows the pending warning and keeps the selection | ☐ | NOT RUN |
| T-05 | AC-05 | component | A recurring event with a cost reads "Charged each time it's completed" | ☐ | NOT RUN |
| T-06 | AC-06 | component | Edit event opens with the fixture event's $90 NDIS cost and the future-only note | ☐ | NOT RUN |

Test titles must start with `[FAM-UI-08][AC-xx]`.

## Regression scope
- FAM-UI-03 component and e2e tests (the form this extends); `npm run typecheck`, `npm run lint`, unit/component suite; real-browser width sweep 1920 to 768.

## Test data
- Budget fixtures from FAM-UI-05 (one bucket with pending costs); add a $0 bucket for another fixture client if none exists, and one fixture event with a $90 NDIS cost.
