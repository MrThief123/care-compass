# Progress — INT-09 Overdue and upcoming care alert emails

Owner: MrThief123
Status: MERGED TO DEV (merged to `main` in #221, 2026-10-03). A real send needs the hosted Resend, Vercel env and SMTP set-up (human)
Jira: —
Branch: `feature/shared-care-alert-emails`
PR target: `main`
Last updated: 2026-10-03

## Blockers
- None. OQ-40 ANSWERED 2026-10-03 (PD-062). The docs PR `docs/oq-40-answered` (decision record, rewritten docs) should merge first; this branch is cut from it.

## Dependencies status
- INT-01 — MERGED
- F0-11 — MERGED
- F0-24 — MERGED (hosted SMTP and Resend set-up is a human step, F0-24 AC-07)

## Completed
- OQ-40 recorded (PD-062); PRD, ACs, test plan, stories and feature decisions rewritten.

## In progress
- None. Waiting on the human's approval to open the PR.

## Remaining
- Human: merge `docs/oq-40-answered` first (decision record; this branch is cut from it), confirm the email wording (FD-03), and finish the hosted Resend / Vercel env set-up (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`) for a real send.

## Acceptance criteria status
- 8 / 8 MET (local stack, stubbed email provider; no real email was sent).

## Tests
- pgTAP: `care_overdue_alert_notifications.test.sql` 10 / 10; full `supabase test db` PASS.
- Unit: `care-overdue-alerts-logic.test.ts` and the route test (auth, cron entry) green.
- Integration: `tests/integration/care-overdue-alerts.test.ts` 9 / 9 on the local stack; INT-01 and INT-11 job tests still green.
- `tsc --noEmit` clean; eslint: only the 2 pre-existing `dev-preview` warnings.
- One test expectation changed (my own wrong expectation, code was right): DECISIONS.md FD-07.
- Not run: a real send through Resend (needs the hosted set-up above).

## Notes for the PR
- New migration `20261003113636_care_overdue_alert_notifications.sql`: one new table, additive, RLS on in the same migration; no existing table changed.
- `src/lib/supabase/database.types.ts`: only the new table's block added by hand (a full `db:types` regeneration with CLI 2.6.8 reorders and drops unrelated entries).
- `docs/security/PERMISSION_MATRIX.md` regenerated: adds the new table, INT-11's table and ADM-11's routes that the earlier features had not regenerated (0 gaps).
- Cadence is a daily Vercel Cron (FD-02): an alert can arrive up to about a day after the 30-minute mark.
