/**
 * Where a client's screens live. The Family screens are reused by carers under
 * `/carer/patients/<id>` (CHG-043), so every route helper takes an optional base path; leaving it
 * out keeps the Family `/family/<id>` links exactly as they were.
 */
export function resolveBasePath(clientId: string, basePath?: string): string {
  return basePath ?? `/family/${encodeURIComponent(clientId)}`;
}
