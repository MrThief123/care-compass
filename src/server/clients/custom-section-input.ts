/**
 * F0-26: the title and text rules every custom Client Details section save goes through, shared
 * by the Server Actions and the form. The database repeats them as check constraints, a unique
 * index and a limit trigger (supabase/migrations/*_client_custom_sections.sql).
 */
export const MAX_CUSTOM_SECTIONS = 20;
const MAX_TITLE = 60;
const MAX_CONTENT = 5000;

/** Built-in section headings a custom section may not reuse, compared in lower case. */
const RESERVED_TITLES = new Set(["description", "habits", "medical history", "documentation"]);

export const CUSTOM_SECTION_MESSAGES = {
  titleRequired: "Give the section a title.",
  titleTooLong: `Keep the title to ${MAX_TITLE} characters or fewer.`,
  titleTaken: "There's already a section with that title. Choose another.",
  contentTooLong: "Keep it to 5,000 characters or fewer.",
  limit: `This client already has ${MAX_CUSTOM_SECTIONS} sections. Remove one to add another.`,
} as const;

export type CustomSectionField = "title" | "content";

export type CustomSectionInputResult =
  | { ok: true; data: { title: string; content: string | null } }
  | { ok: false; field: CustomSectionField; message: string };

/** Trims both values and stores blank text as null; the title is checked before the text. */
export function parseCustomSectionInput(input: {
  title: string;
  content: string;
}): CustomSectionInputResult {
  const title = input.title.trim();
  const content = input.content.trim();

  if (!title) return { ok: false, field: "title", message: CUSTOM_SECTION_MESSAGES.titleRequired };
  if (title.length > MAX_TITLE) {
    return { ok: false, field: "title", message: CUSTOM_SECTION_MESSAGES.titleTooLong };
  }
  if (RESERVED_TITLES.has(title.toLowerCase())) {
    return { ok: false, field: "title", message: CUSTOM_SECTION_MESSAGES.titleTaken };
  }
  if (content.length > MAX_CONTENT) {
    return { ok: false, field: "content", message: CUSTOM_SECTION_MESSAGES.contentTooLong };
  }

  return { ok: true, data: { title, content: content || null } };
}
