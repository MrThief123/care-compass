/**
 * File names for the entries of a "Download all" zip (F0-25). A name is cut to its last path
 * segment so an entry can never leave the archive, and a repeat is numbered before its extension
 * ("Care plan.pdf", "Care plan (2).pdf"). Names are compared case-insensitively because most
 * people unzip onto a case-insensitive disk.
 */
export function uniqueZipNames(names: readonly string[]): string[] {
  const taken = new Set<string>();

  return names.map((raw) => {
    const base = raw.split(/[\\/]/).filter(Boolean).pop() || "document";
    const dot = base.lastIndexOf(".");
    const stem = dot > 0 ? base.slice(0, dot) : base;
    const extension = dot > 0 ? base.slice(dot) : "";

    let candidate = base;
    for (let n = 2; taken.has(candidate.toLowerCase()); n += 1) {
      candidate = `${stem} (${n})${extension}`;
    }
    taken.add(candidate.toLowerCase());
    return candidate;
  });
}
