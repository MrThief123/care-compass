import { defineConfig, devices } from "@playwright/test";

// F0-20: E2E_PORT lets a run use another port than 3000 (a stale server may hold it) and
// E2E_DATA_SOURCE=supabase runs the real route guards (the default stays mock).
const port = process.env.E2E_PORT ?? "3000";
const dataSource = process.env.E2E_DATA_SOURCE ?? "mock";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    env: { DATA_SOURCE: dataSource },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
