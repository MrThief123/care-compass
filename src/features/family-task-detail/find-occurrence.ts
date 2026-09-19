import { getTaskLog } from "@/server/events/queries";
import type { Occurrence } from "@/types/domain";

/**
 * Finds one occurrence by its key, for Task detail.
 *
 * There is no single-occurrence contract function yet (DECISIONS.md FD-03),
 * so this derives it from `getTaskLog`, paging until the key turns up or the
 * log ends. Correct for occurrences inside the Task log's range; replace with
 * a `getOccurrence(clientId, key)` contract function when one exists.
 */
export async function findOccurrence(
  clientId: string,
  key: string,
): Promise<Occurrence | undefined> {
  for (let page = 1; ; page += 1) {
    const result = await getTaskLog(clientId, { page });
    const found = result.items.find((item) => item.key === key);
    if (found) return found;
    if (result.items.length === 0 || page * result.pageSize >= result.total) return undefined;
  }
}
