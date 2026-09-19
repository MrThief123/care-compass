import { redirect } from "next/navigation";

import { loadTaskLog } from "@/features/family-task-log/load-task-log";
import { TaskLogView } from "@/features/family-task-log/task-log-view";

/**
 * Family · Task log (FAM-UI-07). The whole history, one page at a time: the URL's
 * `?q=&status=&page=` is cleaned, then answered by `getTaskLog` over every task, not over the
 * rows on screen (CHG-005). A page past the last goes to the last page. A rejected query
 * propagates to `error.tsx`, and `loading.tsx` shows while it runs.
 */
export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const loaded = await loadTaskLog(clientId, await searchParams);

  if (loaded.kind === "redirect") redirect(loaded.href);

  return (
    <TaskLogView
      clientId={clientId}
      items={loaded.items}
      total={loaded.total}
      pageSize={loaded.pageSize}
      params={loaded.params}
    />
  );
}
