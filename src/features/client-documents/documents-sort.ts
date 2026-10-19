import type { ClientDocument } from "@/types/domain";

export type DocumentSortKey = "name" | "size" | "date";
export type DocumentSortDirection = "asc" | "desc";

/** Case-insensitive, and "Medication 2" before "Medication 10". */
const compareNames = new Intl.Collator("en-AU", { sensitivity: "base", numeric: true }).compare;

/** A document matches when the text is in its file name or the title of its event. */
export function filterDocuments(
  documents: readonly ClientDocument[],
  query: string,
): ClientDocument[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...documents];
  return documents.filter(
    (document) =>
      document.name.toLowerCase().includes(needle) ||
      (document.eventTitle?.toLowerCase().includes(needle) ?? false),
  );
}

/** Ties are always by name, ascending, so the order does not jump when the direction flips. */
export function sortDocuments(
  documents: readonly ClientDocument[],
  key: DocumentSortKey,
  direction: DocumentSortDirection,
): ClientDocument[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...documents].sort((a, b) => {
    const primary =
      key === "name"
        ? compareNames(a.name, b.name)
        : key === "size"
          ? a.sizeBytes - b.sizeBytes
          : Date.parse(a.uploadedAt) - Date.parse(b.uploadedAt);
    return primary !== 0
      ? sign * primary
      : compareNames(a.name, b.name) || a.id.localeCompare(b.id);
  });
}
