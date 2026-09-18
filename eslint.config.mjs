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
    // src/app or src/features directly (UI-00 AC-06).
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
