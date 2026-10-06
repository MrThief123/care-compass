# Test Plan — FAM-17 Family — Info tips on main buttons

## Approach
Tests first (TESTING.md §2); confirm they fail for the right reason before implementing. Run with `DATA_SOURCE=mock`.

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | InfoTip renders named 44px button, tip hidden | ☐ | NOT RUN |
| T-02 | AC-02, AC-03 | component | hover opens, leave closes, moving onto the tip keeps it open | ☐ | NOT RUN |
| T-03 | AC-04 | component | focus opens with `aria-describedby`, blur closes | ☐ | NOT RUN |
| T-04 | AC-05 | component | click toggles; outside click closes | ☐ | NOT RUN |
| T-05 | AC-06 | component | Esc closes, focus stays | ☐ | NOT RUN |
| T-06 | AC-07 | component | Home and Calendar "Enter event" tips | ☐ | NOT RUN |
| T-07 | AC-08 | component | Budget "Edit" and "Export" tips | ☐ | NOT RUN |
| T-08 | AC-09 | unit + axe | help-text length rule; axe with tip open | ☐ | NOT RUN |
| T-09 | AC-10 | component | Carer and Admin screens render no tips | ☐ | NOT RUN |
| T-10 | AC-10 | component | Existing Family home, calendar, budget suites unchanged | ☐ | NOT RUN |

Titles start `[FAM-17][AC-xx]`.

## Regression scope
`DATA_SOURCE=mock npx vitest run src/features/family-* src/features/carer-* src/features/admin-* src/components`; lint; typecheck; format check.

## Test data
Existing fixtures only.
