# FAM-11 — Family — Update funds (Edit budget)

| Field | Value |
|---|---|
| Feature ID | FAM-11 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` |
| Feature branch | `feature/family-budget-update-funds` |
| Documentation | `docs/development/family-dev/family-budget-update-funds/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D15–D16 |
| Status / owner | See PROGRESS.md |

> **Rewritten on start (2026-10-02)** as CHG-020 (PD-058), CHG-021 (PD-059) and CHG-022 (PD-060) instruct. The original "Update form" (bucket, amount, date, description, future date rejected) no longer exists: the screen is the **Edit budget page** (`/family/<clientId>/budget/edit`), built on fixtures by FAM-UI-05. This feature makes its Save real.

## Purpose
Make Save on the Edit budget page write to the database, atomically, for Family and for the client's organisation's admins.

## Problem
Edit budget (FAM-UI-05) holds its changes in local state and a reload drops them. The database has one-change functions (`add_funds`, `remove_funds`, `add_bucket`, `rename_bucket`, `remove_bucket`, F0-12) but nothing applies a whole page-worth of changes as one save, and no Server Action exists.

## Description
One Save applies, in one transaction: add or remove funds on any bucket, rename a bucket, add a bucket (name and starting amount, $0 allowed), remove a bucket, with one optional note for the save. Any wrong field refuses the whole save and nothing is written (PD-059). Budget then shows the stored result, including pending costs paid by a top-up (PD-060).

## User value
Budgets stay accurate as funding changes; the history is a real, attributed record.

## Users
- Family of the client (PD-034).
- Admins of the client's organisation act as Family (PD-058, REQ-38).
- Carers never edit the budget.

## Scope
- New migration (`supabase migration new`): `save_budget_edit(p_client_id uuid, p_buckets jsonb, p_added jsonb, p_note text)`, `security definer`, one transaction, built on the existing F0-12 functions so every rule stays in one place. Order inside the save: removals, renames, fund changes, then added buckets (so a name freed by a removal or rename can be reused in the same save). A refusal raises with the field path in `detail` (`buckets.<i>.amount|name|remove`, `added.<i>.name|startingAmount`, same keys the page already uses). `p_buckets` rows are `{id, name, direction, amount, remove}`; `p_added` rows are `{name, starting_amount}`. Granted to `authenticated` only; `can_edit_budget` is the lock.
- Server Action `saveBudgetEdit(clientId, edit)` in `src/server/budget/actions.ts`: Zod-validated, result shape per ARCHITECTURE.md §4, calls the RPC, maps database errors to fixed messages and field errors. `DATA_SOURCE=mock` returns `NOT_AVAILABLE` (nothing can persist).
- Wire `EditBudgetView`: in supabase mode Save calls the action, shows field errors from a refusal (focus first), a general message for other failures (entered values kept), and on success returns to Budget, which re-reads from the database (`router.refresh`). In mock mode the Phase 1 local-state behaviour is unchanged (FD-02).
- Each save records its note on every row it writes and the signed-in person's name as the recorder (CHG-022); Budget's "Recorded by you" label is a Phase 1 artefact only.
- A top-up pays the bucket's pending costs, oldest first (already inside `add_funds`).
- Regenerate `src/lib/supabase/database.types.ts` for the new function (only that diff).

## Out of Scope
- Editing or deleting past entries; inter-bucket transfers (PL-10).
- The `/admin/clients/<id>/budget/edit` route (ADM-11), though the action and RPC already allow admins.
- Design changes to the page (FAM-UI-05); paying pending costs by hand.
- Changing the validation messages the page already shows.

## Functional Requirements
- Amount > 0 with at most 2 decimals, below $10,000,000,000; a starting amount may be 0.
- A removal of funds cannot exceed the balance ("Only $X available"); never below $0.
- A name is required, at most 40 characters, unique per client ignoring case and surrounding spaces.
- A bucket can be removed only with no cost ever charged to it (paid or pending); its remaining money leaves as a "Bucket removed" row.
- A save with no changes writes nothing.
- Dates are today in `Australia/Melbourne` (`budget_today()`); there is no date field.

## UI / UX Requirements
- No new design. Behaviour on the existing page: refusal keeps the page, marks each field and focuses the first; success goes to Budget showing the saved figures; Cancel and Escape change nothing. A non-field failure shows one plain message above Save, entered values kept, no PII.

## Dependencies
- Features: FAM-10, F0-12, FAM-UI-05 (all merged).
- Blocking decisions: OQ-04, OQ-05, OQ-19 — all ANSWERED (root DECISIONS.md; PD-033/PD-034/PD-058/PD-059/PD-060).
- Non-blocking: OQ-03 (thresholds) — answered, 75/85/100, derived by F0-12.

## Inputs
`clientId`; per saved bucket: id, name, direction, amount, remove; per new bucket: name, starting amount; optional note.

## Outputs
Rows in `budget_fund_entries` (kinds `funds_added`, `funds_removed`, `bucket_added`, `bucket_removed`), renamed/removed `budget_buckets`, pending costs paid.

## Error / Edge Cases
- Whole save refused on any wrong field; nothing written.
- Removing a bucket and typing an amount on it: the amount is ignored (page rule).
- A bucket removed by someone else meanwhile: refused with a general "reload" message.
- Two people save at once: each save is its own transaction; buckets are locked row by row, so the second sees the first's balance ("Only $X available").
- Signed out or expired session: `NOT_ALLOWED`.

## Security / Permissions
- Authority is the database: `can_edit_budget` (family of the client, admin of the client's organisation); carers, other families and other organisations' admins get `42501`.
- Messages name no client; logs carry a feature tag and error class only.

## Technical Considerations
- Server Action wraps one RPC call so the whole save is one transaction.
- Additive migration only; no existing function or table changes.
- Keep `src/features/family-budget/budget-edit.ts`'s validation as the first line of defence; the action re-validates with Zod (never trust the client).

## Traceability
- Product requirements: REQ-29, REQ-38; REQ-37 (pending settlement).
- Decisions: PD-033, PD-034, PD-058, PD-059, PD-060; CHG-020/021/022.
- Sources: UI-D1, UI-D19, CM-0409.

## Labels
Design gap (OQ-19): the Edit budget page was built from tokens in FAM-UI-05; this feature adds no new UI.
