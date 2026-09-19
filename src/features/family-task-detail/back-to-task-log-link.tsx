import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import type { TaskLogParams } from "@/features/family-task-log/task-log-params";
import { taskLogHref } from "@/features/family-task-log/task-routes";

/**
 * '‹ Back to Task log' (design: Task detail). 44px target, brand text. `view` is the Task log's
 * validated q / status / page, so Back returns to the exact view the task was opened from.
 */
export function BackToTaskLogLink({
  clientId,
  view,
}: {
  clientId: string;
  view?: Partial<TaskLogParams>;
}) {
  return (
    <Link
      href={taskLogHref(clientId, view)}
      className="inline-flex min-h-11 items-center gap-1 self-start text-body-emphasis text-text-brand hover:underline"
    >
      <Icon name="chevron-left" size={16} aria-hidden />
      Back to Task log
    </Link>
  );
}
