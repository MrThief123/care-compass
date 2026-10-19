import { describe, expect, it } from "vitest";

import {
  TAG_MAX_LENGTH,
  TAGS_PER_ITEM_MAX,
  TagNameSchema,
  TagNamesSchema,
  normaliseTagName,
} from "./tag-input";

/*
 * [F0-29] The one schema for tag names (AC-03, AC-14): used by the tag picker, the event
 * actions, `setDocumentTags` and the Task log's `?tag=`. The database checks the same rules.
 */
describe("[F0-29] tag names", () => {
  it("[F0-29][AC-03] trims and collapses inner spaces", () => {
    expect(normaliseTagName("  Doctors   visits ")).toBe("Doctors visits");
    expect(TagNameSchema.parse(" Medication ")).toBe("Medication");
  });

  it("[F0-29][AC-03] allows up to 30 characters and refuses more", () => {
    expect(TAG_MAX_LENGTH).toBe(30);
    expect(TagNameSchema.safeParse("x".repeat(30)).success).toBe(true);
    expect(TagNameSchema.safeParse("x".repeat(31)).success).toBe(false);
  });

  it("[F0-29][AC-03] refuses an empty name and control characters", () => {
    expect(TagNameSchema.safeParse("   ").success).toBe(false);
    expect(TagNameSchema.safeParse("Doc\u0000tors").success).toBe(false);
    expect(TagNameSchema.safeParse("Doc\ntors").success).toBe(false);
  });

  it("[F0-29][AC-03] keeps one of each name in any case, the first spelling", () => {
    expect(TagNamesSchema.parse(["Doctors", " doctors", "DOCTORS", "Therapy"])).toEqual([
      "Doctors",
      "Therapy",
    ]);
  });

  it("[F0-29][AC-03] allows up to 10 tags on one item and refuses more", () => {
    expect(TAGS_PER_ITEM_MAX).toBe(10);
    const ten = Array.from({ length: 10 }, (_, index) => `Tag ${index}`);
    expect(TagNamesSchema.safeParse(ten).success).toBe(true);
    expect(TagNamesSchema.safeParse([...ten, "Tag 10"]).success).toBe(false);
  });

  it("[F0-29][AC-14] an empty list is valid: it clears an item's tags", () => {
    expect(TagNamesSchema.parse([])).toEqual([]);
  });
});
