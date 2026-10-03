# Decisions — INT-09 Overdue and upcoming care alert emails

## Open decisions affecting this feature
None blocking. OQ-40 was ANSWERED 2026-10-03 (PD-062 in the root `DECISIONS.md`). FD-03 (wording) is a proposal for the human to confirm in review.

## Feature decisions log

### FD-01 — What the human decided (OQ-40 / PD-062)
- Date: 2026-10-03 · Human-answered: one email per overdue task, once, 30 minutes after the due time, to the client's Family members and the organisation's current admins; no upcoming-care reminders in v1; no quiet hours; the carer on shift is not emailed.

### FD-02 — Cadence: a daily Vercel Cron (human-confirmed 2026-10-03)
- Decision: a third daily cron entry `0 21 * * *` (UTC) for `/api/jobs/care-overdue-alerts`, like INT-01 and INT-11. Vercel Hobby (free) allows crons only once a day; an every-15-minutes entry would need Vercel Pro and would be rejected on Hobby.
- Consequence: "30 minutes after due" is the earliest an occurrence qualifies, not the time the email arrives. An alert can arrive up to about a day later (the next 07:00 or 08:00 Melbourne run). If the project moves to Pro, only the schedule string changes.
- Alternatives not chosen: every 15 minutes on Pro; a free external trigger such as GitHub Actions (a second scheduler, against CHG-046).

### FD-03 — Email wording (PROPOSED; wording was not part of the OQ-40 answer)
- Subject: `Schedule of Care Program — overdue care` (same prefix as INT-01 and INT-11).
- Body: `"<task title>" for <client full name> was due at <h:mm am/pm> on <d MMMM> and has not been marked done. Log in to follow it up.`
- Reason: plain, one fact per sentence, in the house style of INT-11's approved sentence. Full name per PD-038; time in Australia/Melbourne. No upcoming-care wording.
- Human confirmation required: yes, in review. Changing it is one string.

### FD-04 — Window and cap (default, non-blocking)
- Only occurrences due in the last 48 hours are considered, so the first run on deploy never emails old items and a missed daily run is still caught on the next. At most 100 occurrences are alerted per run; the remainder go on the next run. Both are named constants.
- Reason: bounds sends in one run (PRD Error/Edge Cases) and the first-run backlog (INT-11 FD-09 asked the same of costs).

### FD-05 — Identity of an occurrence and the marker
- Tracking table `care_overdue_alert_notifications`, primary key `(event_id, original_start)`: the same identity `buildOccurrences` uses for its key, so an override that moves the start does not make a new occurrence. Written only after every recipient's send succeeded; deny-all RLS like `budget_pending_cost_notifications`. A task completed after it was alerted keeps its marker.

### FD-06 — Reuse and one copy
- Occurrences come from the pure `buildOccurrences` (F0-11) with rows the job reads under the service role; no second recurrence or status logic. Recipient resolution is a copy of INT-11's (that one is private to its file, INT-11 FD-08); folding the three copies into one helper is a follow-up, not part of this feature.
