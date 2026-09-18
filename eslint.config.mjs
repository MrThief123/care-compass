import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    // ARCHITECTURE.md §3.2 / CLAUDE.md §7: screens read data only through
    // src/server/** contract functions; src/mocks is never imported from
    // src/app or src/features directly (UI-00 AC-06). Also covers F0-04
    // AC-02 for these same files — see the next block's comment. Both
    // patterns must live in one config object: flat config's per-rule
    // merging is "last matching config wins", not a union of patterns, so a
    // second `no-restricted-imports` block matching these same files would
    // silently replace this one instead of adding to it.
    files: ["src/app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/mocks/*", "**/mocks"],
              message:
                "src/mocks is a Phase 1 fixture/dev-mock module and must not be imported from src/app or " +
                "src/features. Read data through the matching src/server/<domain>/queries.ts or actions.ts " +
                "contract function instead (CLAUDE.md §7, ARCHITECTURE.md §3.2).",
            },
            {
              group: ["**/server/jobs/supabase-admin"],
              message:
                "supabase-admin.ts creates a service-role client that bypasses RLS and may only be imported " +
                "from src/server/jobs/** (F0-04 AC-02, ADR-02). Use src/lib/supabase/server.ts instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // F0-04 AC-02 / ARCHITECTURE.md ADR-02: the service-role client bypasses
    // RLS entirely, so only jobs may import it. Covers the rest of src/**
    // (src/app and src/features already got this pattern above — kept
    // disjoint from that block so neither silently overwrites the other).
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/jobs/**", "src/app/**", "src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/server/jobs/supabase-admin"],
              message:
                "supabase-admin.ts creates a service-role client that bypasses RLS and may only be imported " +
                "from src/server/jobs/** (F0-04 AC-02, ADR-02). Use src/lib/supabase/server.ts instead.",
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    // Nested git worktrees created by Claude Code's Agent tool (isolation: "worktree")
    // are full copies of this source tree and must not be linted as part of it.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
