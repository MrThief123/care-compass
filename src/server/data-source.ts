/**
 * Selects the `mock` or `supabase` implementation for every
 * `src/server/<domain>/queries.ts` / `actions.ts` contract function
 * (ARCHITECTURE.md §3.2 "Data-source adapter", PD-028).
 *
 * Screens never import `src/mocks` or a Supabase client directly — they
 * call the contract functions in `src/server/<domain>/`, which each read
 * `getDataSourceMode()` and delegate to the matching implementation.
 * Phase 1 screens run on `mock`; each Phase 3 wiring feature adds the
 * `supabase` branch for the functions it wires.
 */
export type DataSourceMode = "mock" | "supabase";

const VALID_MODES: readonly DataSourceMode[] = ["mock", "supabase"];

/** Default `mock` until Phase 3 (PRD.md UI-00 Scope). */
export function getDataSourceMode(): DataSourceMode {
  const raw = process.env.DATA_SOURCE;
  if (!raw) return "mock";
  if ((VALID_MODES as readonly string[]).includes(raw)) {
    return raw as DataSourceMode;
  }
  throw new Error(`Invalid DATA_SOURCE="${raw}"; expected "mock" or "supabase".`);
}

/**
 * Throws a clear, consistent error for a contract function whose Supabase
 * implementation doesn't exist yet (added by its Phase 3 wiring feature).
 */
export function notImplementedForSupabase(domain: string, fn: string): never {
  throw new Error(
    `${domain}.${fn}: DATA_SOURCE="supabase" is not implemented yet — this lands in the Phase 3 wiring ` +
      `feature for this domain. Use DATA_SOURCE=mock (the default) until then.`,
  );
}
