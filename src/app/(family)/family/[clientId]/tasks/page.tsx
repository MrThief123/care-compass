import { redirect } from "next/navigation";

import { loadTaskLog } from "@/features/family-task-log/load-task-log";
import { TaskLogView } from "@/features/family-task-log/task-log-view";
import { getClientTags, getEventTagsByClient } from "@/server/tags/queries";

/**
 * Family · Task log (FAM-UI-07). The whole history, one page at a time: the URL's
 * `?q=&status=&page=` is cleaned, then answered by `getTaskLog` over every task, not over the
 * rows on screen (CHG-005). A page past the last goes to the last page. A rejected query
 * propagates to `error.tsx`, and `loading.tsx` shows while it runs. `?tag=` and the tags under
 * each task are F0-29's.
 */
export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const [loaded, tagOptions, tagsByEvent] = await Promise.all([
    searchParams.then((raw) => loadTaskLog(clientId, raw)),
    getClientTags(clientId),
    getEventTagsByClient(clientId),
  ]);

  if (loaded.kind === "redirect") redirect(loaded.href);

  return (
    <TaskLogView
      clientId={clientId}
      items={loaded.items}
      total={loaded.total}
      pageSize={loaded.pageSize}
      params={loaded.params}
      tagOptions={tagOptions}
      tagsByEvent={tagsByEvent}
    />
  );
}
