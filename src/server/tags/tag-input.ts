/**
 * F0-29: the one set of rules for tag names, used by the tag picker, the event actions,
 * `setDocumentTags` and the Task log's `?tag=` (AC-03, AC-14). `set_event_tags` and
 * `set_document_tags` check the same rules in the database. Plain Zod, safe in a client bundle.
 */
import { z } from "zod";

/** Longest tag name, in characters. */
export const TAG_MAX_LENGTH = 30;

/** Most tags on one event or document. */
export const TAGS_PER_ITEM_MAX = 10;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

/** Trimmed, with each run of inner whitespace made one space. */
export function normaliseTagName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** One tag name: no control characters, then normalised, 1–30 characters. */
export const TagNameSchema = z
  .string()
  .refine((raw) => !CONTROL_CHARACTERS.test(raw), "Tags can't contain control characters.")
  .transform(normaliseTagName)
  .pipe(
    z
      .string()
      .min(1, "Enter a tag.")
      .max(TAG_MAX_LENGTH, `Tags can be up to ${TAG_MAX_LENGTH} characters.`),
  );

/** An item's tags: each name valid, one per name in any case (the first spelling), at most 10. */
export const TagNamesSchema = z
  .array(TagNameSchema)
  .transform((names) => uniqueTagNames(names))
  .pipe(z.array(z.string()).max(TAGS_PER_ITEM_MAX, `Up to ${TAGS_PER_ITEM_MAX} tags.`));

/** The names with later repeats in any case left out; order kept. */
export function uniqueTagNames(names: readonly string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** A to Z, ignoring case, the order tags are shown in everywhere. */
export const compareTagNames = new Intl.Collator("en-AU", { sensitivity: "base", numeric: true })
  .compare;

export function sortTagNames(names: readonly string[]): string[] {
  return [...names].sort(compareTagNames);
}
