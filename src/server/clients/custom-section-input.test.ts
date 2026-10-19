// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  CUSTOM_SECTION_MESSAGES,
  MAX_CUSTOM_SECTIONS,
  parseCustomSectionInput,
} from "@/server/clients/custom-section-input";

/*
 * F0-26 T-01: the title and text rules every custom-section save goes through (AC-03, AC-08).
 * The database repeats them (supabase/tests/client_custom_sections.test.sql).
 */
describe("[F0-26][AC-03] parseCustomSectionInput", () => {
  it("[F0-26][AC-03] trims the title and text", () => {
    expect(
      parseCustomSectionInput({ title: "  Communication ", content: "  Short sentences. " }),
    ).toEqual({ ok: true, data: { title: "Communication", content: "Short sentences." } });
  });

  it("[F0-26][AC-03] stores blank text as null, so the section reads 'Nothing added yet.'", () => {
    expect(parseCustomSectionInput({ title: "Sleep", content: "   " })).toEqual({
      ok: true,
      data: { title: "Sleep", content: null },
    });
  });

  it("[F0-26][AC-03] refuses a blank title, naming the title field", () => {
    expect(parseCustomSectionInput({ title: "   ", content: "x" })).toEqual({
      ok: false,
      field: "title",
      message: CUSTOM_SECTION_MESSAGES.titleRequired,
    });
    expect(CUSTOM_SECTION_MESSAGES.titleRequired).toBe("Give the section a title.");
  });

  it("[F0-26][AC-03] accepts a 60-character title and refuses 61, after trimming", () => {
    expect(parseCustomSectionInput({ title: ` ${"x".repeat(60)} `, content: "" }).ok).toBe(true);
    expect(parseCustomSectionInput({ title: "x".repeat(61), content: "" })).toEqual({
      ok: false,
      field: "title",
      message: "Keep the title to 60 characters or fewer.",
    });
  });

  it.each(["Description", "habits", "MEDICAL HISTORY", " Documentation "])(
    "[F0-26][AC-03] refuses the built-in title %j in any case",
    (title) => {
      expect(parseCustomSectionInput({ title, content: "" })).toEqual({
        ok: false,
        field: "title",
        message: CUSTOM_SECTION_MESSAGES.titleTaken,
      });
    },
  );

  it("[F0-26][AC-03] the taken-title message asks for another title", () => {
    expect(CUSTOM_SECTION_MESSAGES.titleTaken).toBe(
      "There's already a section with that title. Choose another.",
    );
  });

  it("[F0-26][AC-03] accepts 5,000 characters of text and refuses 5,001, naming the text field", () => {
    expect(parseCustomSectionInput({ title: "Notes", content: "x".repeat(5000) }).ok).toBe(true);
    expect(parseCustomSectionInput({ title: "Notes", content: "x".repeat(5001) })).toEqual({
      ok: false,
      field: "content",
      message: "Keep it to 5,000 characters or fewer.",
    });
  });

  it("[F0-26][AC-03] reports the title first when both are wrong", () => {
    const result = parseCustomSectionInput({ title: "", content: "x".repeat(5001) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe("title");
  });
});

describe("[F0-26][AC-08] limit", () => {
  it("[F0-26][AC-08] a client may have at most 20 custom sections", () => {
    expect(MAX_CUSTOM_SECTIONS).toBe(20);
    expect(CUSTOM_SECTION_MESSAGES.limit).toBe(
      "This client already has 20 sections. Remove one to add another.",
    );
  });
});
