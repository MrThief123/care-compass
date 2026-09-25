import { getTaskLog, type TaskLogQueryInput } from "@/server/events/queries";
import type { Occurrence } from "@/types/domain";

import { lastPageFor } from "./pagination";
import { parseTaskLogParams, type RawSearchParams, type TaskLogParams } from "./task-log-params";
import { taskLogHref } from "./task-routes";

export type LoadedTaskLog =
  | {
      kind: "ok";
      items: Occurrence[];
      total: number;
      pageSize: number;
      lastPage: number;
      params: TaskLogParams;
    }
  /** The page asked for is past the last one: send the person to the last page (FD-14). */
  | { kind: "redirect"; href: string };

/**
 * One page of a client's whole task history, for the Task log route.
 *
 * The URL's params are cleaned first (the contract rejects bad input), then the contract is
 * asked for exactly that page: search and Status run over the whole history there, never over
 * the rows on screen. The order the contract returns is kept (newest first); nothing is
 * re-sorted here, since re-sorting one page can never surface rows from another. A page past
 * the end (a shared link after tasks were removed, or a typed number) is answered with a
 * redirect to the last page that exists, keeping the search and Status.
 */
export async function loadTaskLog(
  clientId: string,
  rawParams: RawSearchParams | undefined,
): Promise<LoadedTaskLog> {
  const params = parseTaskLogParams(rawParams);

  const query: TaskLogQueryInput = { page: params.page };
  if (params.q) query.q = params.q;
  if (params.status) query.status = params.status;

  const { items, total, pageSize } = await getTaskLog(clientId, query);
  const lastPage = lastPageFor(total, pageSize);

  if (params.page > lastPage) {
    return { kind: "redirect", href: taskLogHref(clientId, { ...params, page: lastPage }) };
  }

  return { kind: "ok", items, total, pageSize, lastPage, params };
}
