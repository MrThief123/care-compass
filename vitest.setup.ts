import { existsSync } from "node:fs";

import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

// F0-04: tests/integration/** needs real Supabase env vars (from `supabase
// start`), which Next.js normally loads for `next build`/`next dev` but
// plain `vitest` does not. Loading it here is a no-op when the file is
// absent (CI, or before `supabase start`), so src/**/*.test.ts is unaffected.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

expect.extend(toHaveNoViolations);

// `globals: false` (vitest.config.ts) means Testing Library's own auto-cleanup
// (which relies on globally-registered afterEach) never runs, so each test
// file's later tests see DOM left over from earlier renders.
afterEach(cleanup);
