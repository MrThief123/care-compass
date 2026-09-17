import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const rootDir = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

async function lintVirtualFile(filePath: string, code: string) {
  const eslint = new ESLint({
    cwd: rootDir,
    overrideConfigFile: path.join(rootDir, "eslint.config.mjs"),
  });
  const [result] = await eslint.lintText(code, { filePath: path.join(rootDir, filePath) });
  return result;
}

describe("[UI-00][AC-06] src/mocks is not importable from src/app or src/features", () => {
  it("fails lint when a file under src/app imports from src/mocks", async () => {
    const result = await lintVirtualFile(
      "src/app/(family)/family/page.ts",
      'import { fixtures } from "@/mocks/fixtures";\nexport default fixtures;\n',
    );

    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.messages.some((m) => /mocks/.test(m.message))).toBe(true);
  });

  it("fails lint when a file under src/features imports from src/mocks", async () => {
    const result = await lintVirtualFile(
      "src/features/family-home/widget.ts",
      'import { getCurrentUser } from "@/mocks/current-user";\nexport default getCurrentUser;\n',
    );

    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.messages.some((m) => /mocks/.test(m.message))).toBe(true);
  });

  it("does not restrict a src/server file importing from src/mocks", async () => {
    const result = await lintVirtualFile(
      "src/server/budget/queries.ts",
      'import { fixtures } from "@/mocks/fixtures";\nexport default fixtures;\n',
    );

    expect(result.messages.some((m) => /no-restricted-imports/.test(m.ruleId ?? ""))).toBe(false);
  });
});
