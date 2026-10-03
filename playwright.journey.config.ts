import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

// INT-12 (`npm run test:journey`): the phased cross-role suite under tests/e2e/int-12/. Phases share
// one local Supabase stack and run in file order (phase-0 ... phase-8), one worker, no retries, so a
// failure is a finding, not a flake. Each phase seeds its own world, so one can run alone with
// `--grep @phase-N`.
export default defineConfig({
  ...base,
  testDir: "./tests/e2e/int-12",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
});
