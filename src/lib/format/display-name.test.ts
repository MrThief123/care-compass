import { describe, expect, it } from "vitest";

import { displayName } from "./display-name";

describe("[UI-00][AC-01] displayName", () => {
  it("returns the full name unchanged (PD-038 supersedes the 'Aisha R.' abbreviation)", () => {
    expect(displayName("Aisha Rahman")).toBe("Aisha Rahman");
  });

  it("normalises surrounding and repeated internal whitespace", () => {
    expect(displayName("  Daniel   K.  ")).toBe("Daniel K.");
  });
});
