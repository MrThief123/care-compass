import { describe, expect, it } from "vitest";

import { HELP_TEXT } from "./help-text";

describe("help text", () => {
  it("[FAM-17][AC-09] every entry has a label and one sentence of at most 100 characters", () => {
    const entries = Object.values(HELP_TEXT);

    expect(entries.length).toBeGreaterThanOrEqual(3);
    for (const { label, text } of entries) {
      expect(label.trim()).not.toBe("");
      expect(text.trim()).not.toBe("");
      expect(text.length).toBeLessThanOrEqual(100);
    }
  });
});
