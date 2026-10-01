import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    globals: false,
    // Integration tests re-import the server actions after vi.resetModules() and talk to a
    // real Supabase stack; on a loaded CI runner that can pass the 5s default (seen in
    // F0-07's shared-authentication tests on main).
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      // Vite/Vitest never sets Next's "react-server" resolve condition, so
      // `import "server-only"` (F0-04's src/server/jobs/supabase-admin.ts)
      // always resolves to the throwing build. Point tests at its no-op
      // build instead — same fix Next's own examples use for Vitest.
      "server-only": path.resolve(dirname, "./node_modules/server-only/empty.js"),
    },
  },
});
