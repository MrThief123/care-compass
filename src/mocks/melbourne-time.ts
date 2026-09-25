/**
 * Melbourne wall-clock helpers for the mock layer (UI-04). The implementation moved to
 * `src/lib/dates/melbourne-time.ts` (F0-11), which real data needs too; these are the names the
 * mock layer already imports.
 *
 * Read only by `src/mocks/**` — never imported by `src/app` or `src/features`.
 */
export { localToMelbourneIso, melbourneDateKey } from "@/lib/dates/melbourne-time";
