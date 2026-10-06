import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "render.spec.ts",
  outputDir: "../../test-results/int07-browser",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 900_000,
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3267", actionTimeout: 15_000 },
  webServer: {
    command: "npm run start -- -p 3267",
    url: "http://127.0.0.1:3267",
    env: { DATA_SOURCE: "supabase" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
