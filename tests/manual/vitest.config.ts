import { defineConfig } from "vitest/config";

import base from "../../vitest.config";

// Manual unit tests: simple hand-written checks, kept out of `npm test` so
// their known failures (see the testing report) don't break the main suite.
export default defineConfig({
  resolve: base.resolve,
  test: {
    include: ["tests/manual/**/*.test.ts"],
    environment: "node",
    setupFiles: [],
  },
});
