// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The kit files UI-05 changes use design tokens only (CLAUDE.md §7, AC-12):
 * no hex, rgb/hsl/oklch values, arbitrary colour utilities or stock Tailwind
 * palette colours.
 */
const CHANGED_KIT_FILES = [
  "src/components/shared/event-pill.tsx",
  "src/components/shared/calendar/status-cue.ts",
  "src/components/shared/calendar/day-timeline.tsx",
  "src/components/shared/calendar/week-grid.tsx",
  "src/components/shared/calendar/month-grid.tsx",
  "src/components/shared/calendar/event-popover.tsx",
];

const RAW_COLOUR = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/,
  /\b(?:bg|text|border|fill|stroke|ring|outline|decoration|shadow)-\[/,
  /\b(?:bg|text|border|fill|stroke|ring|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  /\b(?:bg|text|border)-(?:black|white)\b/,
];

describe("[UI-05][AC-12] plain-event kit styles use tokens only", () => {
  it.each(CHANGED_KIT_FILES)("[UI-05][AC-12] %s has no raw colour values", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    for (const pattern of RAW_COLOUR) expect(source).not.toMatch(pattern);
  });
});
