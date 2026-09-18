import { describe, expect, it } from "vitest";

import { cn } from "./utils";

/**
 * `cn` merges conflicting Tailwind utilities so the last one wins. The type
 * ramp in `src/styles/tokens.css` is declared with `@utility`, which
 * tailwind-merge cannot see: left to itself it reads `text-body-small` as a
 * colour and lets any `text-<colour>` in the same call delete it, silently
 * dropping a font size, line height and weight the layout is measured against.
 */
describe("cn", () => {
  it("keeps a type token beside a text colour", () => {
    expect(cn("text-body-small", "text-text-primary")).toBe("text-body-small text-text-primary");
    expect(cn("text-label-caps", "text-text-brand")).toBe("text-label-caps text-text-brand");
    expect(cn("px-2 py-1 text-body-small font-medium", "border text-text-secondary")).toBe(
      "px-2 py-1 text-body-small font-medium border text-text-secondary",
    );
  });

  it("keeps a type token beside the line height that overrides it", () => {
    expect(cn("text-body-small leading-tight", "text-text-primary")).toBe(
      "text-body-small leading-tight text-text-primary",
    );
  });

  it("still resolves two type tokens against each other", () => {
    expect(cn("text-body-small", "text-body-default")).toBe("text-body-default");
    expect(cn("text-title-page", "text-metric-large")).toBe("text-metric-large");
  });

  it("still resolves a type token against a built-in font size", () => {
    expect(cn("text-body-small", "text-sm")).toBe("text-sm");
    expect(cn("text-sm", "text-body-small")).toBe("text-body-small");
  });

  it("still merges the standard utility groups", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-text-primary", "text-text-secondary")).toBe("text-text-secondary");
    expect(cn("flex", false && "hidden", "items-center")).toBe("flex items-center");
  });
});
