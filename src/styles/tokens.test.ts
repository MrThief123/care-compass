import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import fixture from "./tokens.fixture.json";

const tokensCss = fs.readFileSync(path.join(import.meta.dirname, "tokens.css"), "utf8");

function cssVarName(tokenKey: string): string {
  return `--color-${tokenKey.replace("/", "-")}`;
}

function readCssVar(name: string): string | undefined {
  const match = tokensCss.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match?.[1];
}

describe("design tokens", () => {
  it.each(Object.entries(fixture))(
    "[F0-05][AC-01] colour token %s matches the Figma fixture value",
    (tokenKey, expectedHex) => {
      const actual = readCssVar(cssVarName(tokenKey));
      expect(actual?.toUpperCase()).toBe(expectedHex.toUpperCase());
    },
  );
});
