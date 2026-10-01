/**
 * The base path the reused Family screens link under, so a carer never leaves
 * `/carer/patients/<id>` (CHG-043). Passed as `basePath` to the Family route helpers and views.
 */
export function carerPatientBase(clientId: string): string {
  return `/carer/patients/${encodeURIComponent(clientId)}`;
}
