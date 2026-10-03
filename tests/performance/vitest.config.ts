import { defineConfig, mergeConfig } from "vitest/config";

import base from "../../vitest.config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/performance/**/*.test.ts"],
      environment: "node",
      setupFiles: [],
      pool: "threads",
      maxWorkers: 1,
      fileParallelism: false,
      testTimeout: 900_000,
      hookTimeout: 120_000,
    },
  }),
);
