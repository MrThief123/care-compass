# Acceptance Criteria — INT-12 Cross-role integration journey

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

Names below (Helen Carter, family; Margaret Carter, client; Aisha Rahman, carer; Priya Shah, admin; Tom Nguyen, second admin) are synthetic and created fresh by each run. "Sees it" means: already signed in with the screen open, the role moves to another screen and back through the app's own links (no reload) and reads the new data, and reads it again after a fresh sign-in (PRD Scope).

## Phase 0 — Harness

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | guard | Given `NEXT_PUBLIC_SUPABASE_URL` is not a local address or `E2E_DATA_SOURCE` is not `supabase`, when the suite starts, then every INT-12 test is skipped with a message saying why, and nothing is written to any database. | MET |
| AC-02 | US-01 | happy | Given a local stack, when any phase runs, then it seeds its own organisation, admin with TOTP, carer, family and client, and after the phase (passed or failed) no user, organisation or client carrying that run's `int-12-<runId>` marker remains. | MET |
| AC-03 | US-01 | happy | Given a local stack, when `npm run test:journey` runs, then phases 1 to 7 run in order with one worker, and each phase can also be run alone with `--grep @phase-N`. | MET |

## Phase 1 — Accounts, sign-in, 2FA and passwords

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-04 | US-02 | happy | Given a new email, when Helen signs up as Family at `/sign-up` with Margaret as the client, then she lands on Margaret's Family Home; after signing out and in again she lands there again. | NOT MET |
| AC-05 | US-02 | happy | Given a new email, when Priya signs up as an organisation, then she is asked to set up TOTP; scanning the shown secret and entering a valid code lands her on Admin Home; on her next sign-in she is asked for a code, not a new set-up. | NOT MET |
| AC-06 | US-02 | error | Given Priya at the code step, when she enters a wrong code, then an error is shown, the field is cleared and she stays on the code step; and opening any `/admin` URL before a valid code sends her back to the code step. | NOT MET |
| AC-07 | US-02 | happy | Given Priya adds Aisha on Staff, when the invite email arrives in the mail catcher and Aisha opens its link, then she sets a password, lands on Carer Home, and can sign in again with that password. | NOT MET |
| AC-08 | US-02 | guard | Given the public `/sign-up` page, then there is no way to create a carer account or join an existing organisation. | NOT MET |
| AC-09 | US-02 | happy | Given each of Helen (Family Settings), Aisha (Carer Settings) and Priya (sign-in "Forgot password"), when they request a reset and open the emailed link, then they set a new password; the old password is refused and the new one signs them in (Priya is still asked for her code). | NOT MET |
| AC-10 | US-02 | error | Given a used or expired reset link, when it is opened, then the page offers to send a new link and does not change the password. | NOT MET |
| AC-11 | US-02 | guard | Given a wrong password for a real email and any password for an unknown email, then both show the same message; and given each role signed in, when it opens another role's home URL, then it is sent to its own home. | NOT MET |

## Phase 2 — Family core

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-12 | US-03 | happy | Given seeded events, when Helen opens Calendar, then day, week and month views each show them on the right Melbourne date and time, and Previous, Next and Today move the range correctly. | NOT MET |
| AC-13 | US-03 | happy | Given Helen creates a one-off event and a weekly recurring event costing $40.00 from a named bucket, then both show on the calendar on the right dates, the recurring one also shows 4 and 52 weeks later, and neither has charged the budget yet. | NOT MET |
| AC-14 | US-03 | happy | Given an event on the calendar, when Helen clicks it, then Task detail shows its title, date and time, cost and bucket, assigned carer (or none) and documents. | NOT MET |
| AC-15 | US-03 | happy | Given that event, when Helen edits its title, time and cost, then the calendar and Task detail show the new values, and completions recorded before the edit are unchanged in the Task log. | NOT MET |
| AC-16 | US-03 | happy | Given an event, when Helen uploads a document to it, then a file tile shows on Task detail and opens the file. | NOT MET |
| AC-17 | US-03 | happy | Given seeded buckets, when Helen opens Budget, then each bucket shows total, used and remaining matching the seed; when she adds $500.00 with Update funds, then the bucket and overall totals rise by $500.00 and the history row reads "Recorded by Helen Carter". | NOT MET |
| AC-18 | US-03 | happy | Given Family Settings and Margaret's Info, when Helen changes her phone number and Margaret's Habits, then both show the new values after leaving and returning to the screen. | NOT MET |

## Phase 3 — Family → Admin and Carer

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-19 | US-04 | sync | Given Aisha is on a current shift with Margaret and Priya has Margaret's client view open, when Helen creates an event, then Aisha (patient Calendar) and Priya (client view Calendar) see it with the same title, date and time. | NOT MET |
| AC-20 | US-04 | sync | Given that event, when Helen edits it and then deletes a different event, then Aisha and Priya see the edit and no longer see the deleted event. | NOT MET |
| AC-21 | US-04 | sync | Given Helen's $500.00 top-up, then Priya's client view Budget shows the same totals and the row "Recorded by Helen Carter". | NOT MET |
| AC-22 | US-04 | sync | Given Helen's change to Margaret's Habits and her own phone number, then Aisha (Client info) and Priya (client view Info) see the new Habits, and Priya sees Helen's new number wherever the family contact is shown. | NOT MET |
| AC-23 | US-04 | sync | Given Helen's uploaded document, then Aisha and Priya see the file tile on that task and can open it, and Aisha has a 'family' notification for it. | NOT MET |

## Phase 4 — Admin → Family and Carer

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-24 | US-05 | sync | Given Priya assigns Aisha to Margaret for a future slot, then Aisha sees a "New shift assigned" notification and the shift on her Calendar, and Helen sees "Assigned to Aisha Rahman" on Margaret's tasks in that slot. | NOT MET |
| AC-25 | US-05 | sync | Given Priya creates a costed event in Margaret's client view, then Helen and Aisha see it with its cost and bucket. | NOT MET |
| AC-26 | US-05 | sync | Given Priya edits an event and ticks a task in the client view, then Helen and Aisha see the edit and the task done, named "Priya Shah". | NOT MET |
| AC-27 | US-05 | sync | Given Priya adds funds in the client view, then Helen's Budget shows the new totals and "Recorded by Priya Shah". | NOT MET |
| AC-28 | US-05 | sync | Given Aisha's only future shift with Margaret, when Priya cancels it, then the shift leaves Aisha's Calendar, Margaret leaves Aisha's Patients once no current or future shift remains, and Helen no longer sees Aisha assigned in that slot. | NOT MET |
| AC-29 | US-05 | sync | Given Priya deactivates Aisha, then Aisha cannot sign in, Aisha leaves Staff's active list and Margaret's carer list, Helen no longer sees Aisha on future tasks, and tasks Aisha completed earlier still read "Done · Aisha Rahman" for Helen and Priya. | NOT MET |
| AC-30 | US-05 | sync | Given any mix of shifts and assignments made in this phase, then for every carer and client the pairing shown on Staff, Clients and Manage agree with each other, and Admin Home's counts match the number of rows on Staff and Clients. | NOT MET |
| AC-31 | US-05 | sync | Given Priya removes Margaret, then Margaret leaves Priya's Clients and Manage and Aisha's Patients, Margaret's future shifts are cancelled, and Helen's Home and Settings show the removal banner with Choose organisation. | NOT MET |

## Phase 5 — Carer → Family and Admin

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-32 | US-06 | guard | Given Aisha has shifts with Margaret only, then Patients lists Margaret and not a second client of the same organisation, and that client's patient URL shows not-found. | NOT MET |
| AC-33 | US-06 | guard | Given Aisha's shift with Margaret has not started yet, or has ended with a later shift booked, then she can open Margaret's screens but the tick, add-event and edit controls are absent, and a completion written with her own session is refused by the database. | NOT MET |
| AC-34 | US-06 | sync | Given Aisha is on a current shift, when she ticks Margaret's task, then Helen sees "Done · Aisha Rahman" on Home, Calendar and Task log, Priya sees it done in the client view, and an Overdue entry for it is cleared for both. | NOT MET |
| AC-35 | US-06 | sync | Given a task costing $40.00 from a bucket with enough funds, when Aisha ticks it, then Helen's Budget and Priya's client view Budget each show used up and remaining down by exactly $40.00, with one spending row naming the event; ticking the next occurrence of the weekly event charges another $40.00, and the same occurrence cannot be charged twice. | NOT MET |
| AC-36 | US-06 | sync | Given a task costing more than the bucket's remaining balance, when Aisha ticks it, then Helen and Priya both see the cost as pending and the bucket as "No funds left"; when Helen adds enough funds, then the pending cost is paid and both see the new remaining. | NOT MET |
| AC-37 | US-06 | sync | Given Aisha is on a current shift, when she adds an event and edits another for Margaret, then Helen and Priya see both changes. | NOT MET |
| AC-38 | US-06 | sync | Given Carer Settings, when Aisha changes her phone number, then Priya's Staff panel shows the new number; and Aisha's name and role cannot be changed from Carer Settings. | NOT MET |

## Phase 6 — Organisation change

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-39 | US-07 | sync | Given Margaret has completions, costs and top-ups under Priya's organisation, when Helen changes organisation to Tom Nguyen's, then Priya and Aisha no longer see Margaret (lists and direct URLs), Tom sees Margaret on Clients and in the client view, and every earlier completion, cost and top-up still shows for Helen and Tom. | NOT MET |

## Phase 7 — Budget emails

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-40 | US-08 | sync | Given Aisha's completion pushes a bucket past a warning threshold, when the threshold job route runs, then Helen and Priya each receive one email naming Margaret and the bucket, Aisha receives none, and running the job again sends nothing new. | NOT MET |
| AC-41 | US-08 | sync | Given Aisha's completion leaves a cost pending, when the pending-cost job route runs, then Helen and Priya each receive one email with the approved sentence, Aisha receives none, and running the job again sends nothing new. | NOT MET |

## Phase 8 — Full-names sweep, whole-suite run and sign-off

| ID | Story | Type | Criterion | Status |
|---|---|---|---|---|
| AC-45 | US-09 | guard | Given a client, family member, carer and admin who each share a first name with another person in the same run (e.g. a second client Margaret Lee), when each role opens every screen of its dashboard (Family: Home including its header and greeting, Calendar, Task detail, Task log, Budget, Info, Settings; Carer: Home, notifications, Patients, patient screens, Calendar, Settings; Admin: Home, Staff, Clients, Manage, client view, Settings), then every person name shown, the client's name included, is the full first and last name and never the first name alone (CHG-032). | NOT MET |
| AC-42 | US-01 | happy | Given a fresh local stack, when `npm run test:journey` runs three times in a row, then every phase passes each time (apart from tests marked `test.fail()` for a recorded defect), and no `int-12-` rows remain afterwards. | NOT MET |
| AC-43 | US-01 | review | Given each phase, then its main journey has been walked through by hand in a real Chrome window with all three roles, with no console errors, and screenshots are saved in `evidence/`. | NOT MET |
| AC-44 | US-01 | review | Given every failure that turned out to be a product defect, then it is listed in PROGRESS.md with steps to reproduce and raised with the human as a Parking lot item or feature proposal; none is fixed inside INT-12. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD) · DEFECT (test marked `test.fail()`, defect recorded).
