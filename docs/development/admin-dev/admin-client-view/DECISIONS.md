# Decisions — ADM-11 Admin — Client view

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| — | None open. Changing a client's organisation stays Family only (PD-058, answered 2026-09-25). | — | — |

## Feature decisions log

### FD-01 — Admins get event write access through one additive migration
- Date: 2026-10-03 · Decided by: Dhruv Verma (in-session)
- Context: PD-058 says admins do everything Family can. `can_edit_care_events` (F0-11) allows only the family and an on-shift carer, and `supabase/tests/care_events.test.sql` asserts "Priya (admin) cannot create events" and "an admin cannot tick off". So events, ticks and unticks were refused for admins, although client info, documents and the budget already allowed them.
- Decision: a new migration made with `supabase migration new`: `can_edit_care_events` also returns true for `is_admin_of_client` (which already needs AAL2 and the client's current organisation); `set_occurrence_undone` treats an admin like the family (may undo anyone's tick). Additive, no table or column change. `actor_display_name`, `created_by` and `recorded_by` already come from `auth.uid()`, so every write names the admin.
- Test changes (**HUMAN REVIEW: test expectation changed**, recorded now, before and after in `care_events.test.sql`): "Priya (admin) cannot create events: admin access is read only" becomes "can create events"; "an admin cannot tick off" becomes "can tick off". Reason: recorded requirement change (PD-058, CHG-020).
- Consequences: the migration touches `care_events`, `care_event_overrides`, `care_event_completions` policies and `set_event_cost`'s callers; the PR says so (CLAUDE.md §3).

### FD-02 — Additive `basePath` on two Lane F views, not a shared PR first
- Date: 2026-10-03 · Decided by: Dhruv Verma (in-session)
- Context: `FamilyBudgetView` links to `/family/<id>/budget/edit` and `EditBudgetView` back to `/family/<id>/budget`. Home, Calendar, Care log, Task detail and the event form already take a base path (CHG-043, CHG-048).
- Decision: add an optional `basePath` to those two views; default unchanged, so Family behaviour and its tests are untouched. Flagged in the PR as a Lane F edit. Home's "Choose organisation" link is not changed: a removed client has no organisation, so an admin cannot open it (FD-03).

### FD-03 — A separate admin guard shows not-found
- Date: 2026-10-03 · Decided by: Dhruv Verma (in-session)
- Decision: `assertAdminClientAccess(clientId)` in `src/server/admin/` reads the client row through RLS and calls `notFound()` when there is none, the id is malformed or the read fails. The admin client layout calls it before reading anything else. `assertClientAccess` (redirect to the landing page) is unchanged for Family. In `DATA_SOURCE=mock` it does nothing.

### FD-04 — Care log route is `tasks`, not `log`
- Date: 2026-10-03 · Non-blocking assumption
- Context: the PRD scope says "log"; the Family route helpers (`homeRoutes.tasks`, `taskDetailHrefFrom`) build `<base>/tasks` and `<base>/tasks/<occurrenceKey>`.
- Decision: `/admin/clients/<id>/tasks`, nav label "Care log". The overdue-row follow-up (PD-061) links there.

### FD-05 — Client bar and client nav (undesigned, PD-052)
- Date: 2026-10-03 · Non-blocking, **HUMAN REVIEW** in the PR
- Decision: Lane A component in `src/features/admin-client-view/`, above the screen inside the admin layout: client name, "Back to clients", and links Home, Info, Calendar, Budget, Care log (the current one has `aria-current="page"`). No Settings link (Out of Scope). The admin rail stays; "Clients" stays highlighted. Built from Foundations tokens, 44px targets, wraps under 768px.

### FD-06 — Mock mode cannot show a client view
- Date: 2026-10-03 · Assumption
- Context: the Admin mock clients use ids like `margaret`; the Family mock fixtures use `client-margaret`. They do not meet.
- Decision: the guard is a no-op in mock mode (as `assertClientAccess`); end-to-end behaviour is tested and demoed against the local Supabase stack with `DATA_SOURCE=supabase`. No mock id mapping is added.

### FD-07 — Admin calendar loader lives in Lane A
- Date: 2026-10-03 · Non-blocking, within FD-02's limit
- Context: `loadFamilyCalendar` takes a role of `"family" | "carer"` and calls `getCurrentUser(role)`, which redirects an admin. Widening that type would be a third Lane F edit.
- Decision: `src/features/admin-client-view/load-calendar.ts` reads the same contract functions with `getCurrentUser("admin")` and reuses `parseCalendarParams`, `visibleRange` and `selectLog`. Nothing in Lane F changes for it.
