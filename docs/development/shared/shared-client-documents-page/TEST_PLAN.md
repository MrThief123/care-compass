# Test Plan — F0-25 Client Documents page

## Approach
Tests first (TESTING.md §2); confirm they fail for the right reason before implementing. Run with `DATA_SOURCE=mock`. Titles start `[F0-25][AC-xx]`.

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Family nav items include Documents between Info and Calendar | ☐ | |
| T-02 | AC-02 | component | Patient tabs include Documents after Info with correct href | ☐ | |
| T-03 | AC-03 | unit | mock `getAllClientDocuments`: both kinds, client-scoped, order, unknown client | ☐ | |
| T-04 | AC-04 | component | Row shows name, type, size, Melbourne date, uploader, event title | ☐ | |
| T-05 | AC-05, AC-07 | unit + component | filter by name/event title, trim, case; no-match state and Clear | ☐ | |
| T-06 | AC-06 | unit + component | sort by name/size/date both ways, default, ties | ☐ | |
| T-07 | AC-08 | component | Download all shows count and href | ☐ | |
| T-08 | AC-09, AC-10, AC-11 | unit (route) | zip route: success contents and dedupe; no session; no access; mock mode; over limit | ☐ | |
| T-09 | AC-12 | component | open uses signed URL; failure message | ☐ | |
| T-10 | AC-13 | component | Family and Carer routes render the screen; no upload control | ☐ | |
| T-11 | AC-14 | component | empty state; error state with no PII in log | ☐ | |
| T-12 | AC-15 | component + axe | labels, long name, axe | ☐ | |
| T-13 | AC-16 | regression | existing Family/Carer suites | ☐ | |

## Regression scope
`DATA_SOURCE=mock npx vitest run src`; lint; typecheck; format check.

## Test data
Existing fixtures (`DOCUMENTS`, `EVENT_DOCUMENTS`).
