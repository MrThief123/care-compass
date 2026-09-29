# Acceptance Criteria — CAR-05 Carer — Calendar (shifts)

Rewritten 2026-09-29 before implementation, for CHG-025/030/031/032 (the original AC-01 to AC-03 described a Carer Calendar screen and a task panel that no longer exist; recorded in DECISIONS.md FD-01). Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha has a Margaret Doyle shift 08:00–12:00 today (Melbourne), when `getCarerShifts` runs against Supabase for today's range, then it returns that shift with `clientName` 'Margaret Doyle'. | MET |
| AC-02 | US-01 | happy | Given shifts on several days, when a week range is read, then only shifts whose start falls on a Melbourne day in `from`..`to` inclusive are returned, earliest first; a shift starting 23:30 Melbourne on the last day is included and one starting 00:30 the next day is not. | MET |
| AC-03 | US-01 | permission | Given Daniel also has shifts (same organisation, and another organisation), when Aisha's shifts load, then none of Daniel's appear. | MET |
| AC-04 | US-01 | edge | Given a cancelled shift in the range, when shifts load, then it is not returned. | MET |
| AC-05 | US-02 | happy | Given a shift that has ended and Aisha has no other shift with that client, when last week is read, then the shift is returned with the client's full name. | MET |
| AC-06 | US-02 | permission | Given `get_carer_shifts`, when it is called with another carer's id, or by a family user, then it returns no rows, and a normal row holds only shift fields plus the client's names (no date of birth, address or other client data). | MET |
| AC-07 | US-02 | happy | Given two clients who share a first name, when Carer Home renders the shifts in Day, Week and Month, then each block or chip shows the full name ('Margaret Doyle', 'Margaret Chen'), not 'Margaret'. | MET |
| AC-08 | US-01 | error | Given a range whose `to` is before `from` or that is over-long, when `getCarerShifts` runs in either data-source mode, then it rejects before any database call. | MET |
| AC-09 | US-01 | error | Given the database call fails, when `getCarerShifts` runs against Supabase, then it throws a generic error whose message contains no client or carer name. | MET |
| AC-10 | US-01 | empty | Given no shifts in the range, when shifts load, then `[]` is returned and Carer Home shows 'No shifts' with D/W/M and the arrows still present. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
