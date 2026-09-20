/**
 * Display text for a document's metadata on Task detail. Local to this feature because
 * `src/lib/format` is not lane F's folder (DECISIONS.md FD-09).
 */

const UNITS = ["B", "KB", "MB", "GB"] as const;

/** e.g. 84312 -> "82.3 KB". Binary units (1024); a broken or negative size reads "0 B". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  let value = bytes;
  let unit = 0;
  while (unit < UNITS.length - 1 && Math.round(value * 10) / 10 >= 1024) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${Math.round(value)} B` : `${value.toFixed(1)} ${UNITS[unit]}`;
}

const FRIENDLY_TYPES: [RegExp, string][] = [
  [/^application\/pdf$/, "PDF"],
  [/^application\/msword$|wordprocessingml/, "Word"],
  [/^application\/vnd\.ms-excel$|spreadsheetml/, "Excel"],
  [/^text\/plain$/, "Text"],
];

/** e.g. "application/pdf" -> "PDF", "image/jpeg" -> "JPEG"; "File" for anything it does not recognise. */
export function fileTypeLabel(mimeType: string): string {
  const type = mimeType.trim().toLowerCase();
  const friendly = FRIENDLY_TYPES.find(([pattern]) => pattern.test(type));
  if (friendly) return friendly[1];
  const image = /^image\/([a-z0-9]+)$/.exec(type);
  return image ? image[1]!.toUpperCase() : "File";
}
