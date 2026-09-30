# Decisions — F0-20 Client header wiring and family route guard

## Open decisions affecting this feature
None.

## Feature decisions log
- FD-01 (2026-10-01, non-blocking default, human may override): family members cannot read `organisations` under RLS (`organisations_select_member` needs the caller's own `organisation_id`, which family profiles lack). The organisation name comes from the existing `list_organisations_for_transfer` RPC, picking the row with `is_current`. No migration. Cost: it returns every organisation's id and name on each layout render. Alternative if that is unwanted: a new `SECURITY DEFINER` function returning one name (a migration, pgTAP, CHG-036 rules).
- FD-02 (2026-10-01): `clients.date_of_birth` is nullable, so `ClientHeaderSummary.age` becomes optional (`age?: number`). The mock still always sets it. The layout omits "N years" when absent. Callers: family layout, Settings page.
- FD-03 (2026-10-01): `assertClientAccess` lives in `src/server/clients/queries.ts` and redirects (precedent: `getCurrentUser`). A layout does not stop its page rendering, so pages that must not fetch for an unlinked client call it too. FAM-01 does (AC-05).
- FD-04 (2026-10-01): `getCarerTodayShifts` (`src/server/shifts/queries.ts`) has no owner and no caller (added by CAR-UI-01, CHG-025; left for CAR-01, retired by CHG-033). Not touched here. Recommend a separate cleanup removing it, its mock and its T-07 contract test; needs a recorded decision because a test is removed.
- FD-05 (2026-10-01): closes F0-19 FD-05 by ordering, not by catching: session/role → client access → header data.

- FD-06 (2026-10-01): Next's layout docs say layouts do not re-render on navigation between pages under them, so the layout check runs on entry to `/family/<id>/...`, not on every page. Pages keep relying on RLS and call `assertClientAccess` when they must not fetch (as FD-03 says).
- FD-07 (2026-10-01): the client id is checked with `z.guid()` (as `changeClientOrganisation` does), not `z.uuid()`, because Postgres accepts any 8-4-4-4-12 hex id and seed ids carry no RFC version bits.

## Test changes
None. No test was changed, removed or skipped.
