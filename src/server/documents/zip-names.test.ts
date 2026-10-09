import { describe, expect, it } from "vitest";

import { uniqueZipNames } from "./zip-names";

describe("[F0-25][AC-09] uniqueZipNames", () => {
  it("[F0-25][AC-09] keeps unique names and numbers duplicates before the extension", () => {
    expect(
      uniqueZipNames(["Care plan.pdf", "Care plan.pdf", "Care plan.pdf", "Photo.jpg"]),
    ).toEqual(["Care plan.pdf", "Care plan (2).pdf", "Care plan (3).pdf", "Photo.jpg"]);
  });

  it("[F0-25][AC-09] duplicates are compared case-insensitively; names without an extension work", () => {
    expect(uniqueZipNames(["Notes", "notes"])).toEqual(["Notes", "notes (2)"]);
  });

  it("[F0-25][AC-09] a generated name never collides with a real one", () => {
    expect(uniqueZipNames(["a.pdf", "a.pdf", "a (2).pdf"])).toEqual([
      "a.pdf",
      "a (2).pdf",
      "a (2) (2).pdf",
    ]);
  });

  it("[F0-25][AC-09] strips path separators so an entry cannot escape the archive", () => {
    expect(uniqueZipNames(["../../evil.pdf", "a/b\\c.pdf"])).toEqual(["evil.pdf", "c.pdf"]);
  });
});
