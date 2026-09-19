import { TaskLogView } from "@/features/family-task-log/task-log-view";
import { getTaskLog } from "@/server/events/queries";

/**
 * Family · Task log (FAM-UI-07). Reads only through the `events` contract;
 * a rejected query propagates to `error.tsx`, and `loading.tsx` shows while
 * it runs. Search and filter happen client-side in `TaskLogView`.
 */
export default async function TasksPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { items } = await getTaskLog(clientId);

  return <TaskLogView clientId={clientId} items={items} />;
}
